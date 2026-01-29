/**
 * AKIOR Chat API
 *
 * Features:
 * - Conversation persistence (Supabase)
 * - RAG with knowledge base
 * - Long-term memory
 * - Interaction logging (IP/location headers)
 * - Rate limiting
 *
 * POST /api/chat
 * SECURITY: Requires valid JWT in Authorization header for authenticated features
 */

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { verifyAuth, isAuthError } from '@/lib/server-auth';
import { decrypt } from '@/lib/encryption';

function getOpenAI(apiKey?: string | null) {
  const key = apiKey || process.env.OPENAI_API_KEY;
  if (!key) return null;
  return new OpenAI({ apiKey: key });
}

function getSupabaseAdmin(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ruftuoilatlzniuasoza.supabase.co';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

function getSupabaseAuthed(token: string): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ruftuoilatlzniuasoza.supabase.co';
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1ZnR1b2lsYXRsem5pdWFzb3phIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2NjUxNzEsImV4cCI6MjA4NTI0MTE3MX0.JqPbHquY6lF6I2sYPoNLJjpvwP3aEvmIjAL4llk-hJ0';

  return createClient(url, anonKey, {
    auth: { persistSession: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
}

function getDbClientForAuth(token: string): SupabaseClient {
  return getSupabaseAdmin() || getSupabaseAuthed(token);
}

function getRequestMeta(request: NextRequest) {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';

  const userAgent = request.headers.get('user-agent') || undefined;

  // Best-effort geo: works on Vercel/Cloudflare/etc when those headers are present.
  const country =
    request.headers.get('x-vercel-ip-country') ||
    request.headers.get('cf-ipcountry') ||
    undefined;

  const region = request.headers.get('x-vercel-ip-country-region') || undefined;
  const city = request.headers.get('x-vercel-ip-city') || undefined;

  return { ip, userAgent, country, region, city };
}

// Rate limiting store (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 60; // requests per minute
const RATE_WINDOW = 60 * 1000; // 1 minute

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatRequest {
  message: string;
  history?: Message[];
  conversationId?: string;
  isPublic?: boolean;
  channel?: 'chat' | 'voice' | 'hud' | 'public' | 'unknown';
}

interface ChatResponse {
  reply: string;
  conversationId?: string;
  messageId?: string;
  tokensUsed?: number;
}

function checkRateLimit(identifier: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const record = rateLimitStore.get(identifier);

  if (!record || now > record.resetTime) {
    rateLimitStore.set(identifier, { count: 1, resetTime: now + RATE_WINDOW });
    return { allowed: true, remaining: RATE_LIMIT - 1 };
  }

  if (record.count >= RATE_LIMIT) {
    return { allowed: false, remaining: 0 };
  }

  record.count++;
  return { allowed: true, remaining: RATE_LIMIT - record.count };
}

async function getAgentSettings(db: SupabaseClient, userId: string) {
  const { data, error } = await db.from('agent_settings').select('*').eq('user_id', userId).single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching agent settings:', error);
  }

  if (data) {
    let decryptedApiKey: string | null = null;
    if (data.openai_api_key) {
      decryptedApiKey = decrypt(data.openai_api_key);
    }

    return {
      agent_name: data.agent_name || 'AKIOR',
      personality_prompt:
        data.personality_prompt ||
        'You are AKIOR, a helpful and knowledgeable AI assistant. You are professional, concise, and friendly.',
      voice_id: data.voice_id || 'alloy',
      voice_speed: data.voice_speed || 1.0,
      openai_api_key: decryptedApiKey,
    };
  }

  return {
    agent_name: 'AKIOR',
    personality_prompt: 'You are AKIOR, a helpful and knowledgeable AI assistant.',
    voice_id: 'alloy',
    voice_speed: 1.0,
    openai_api_key: null,
  };
}

async function searchKnowledge(openai: OpenAI, db: SupabaseClient, userId: string, query: string, limit = 5) {
  try {
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: query.slice(0, 8000),
    });
    const queryEmbedding = embeddingResponse.data[0].embedding;

    const { data, error } = await db.rpc('match_knowledge', {
      query_embedding: queryEmbedding,
      match_threshold: 0.5,
      match_count: limit,
      p_user_id: userId,
    });

    if (error) {
      console.error('Knowledge search error:', error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('Error searching knowledge:', err);
    return [];
  }
}

async function searchMemories(openai: OpenAI, db: SupabaseClient, userId: string, query: string, limit = 5) {
  try {
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: query.slice(0, 8000),
    });
    const queryEmbedding = embeddingResponse.data[0].embedding;

    const { data, error } = await db.rpc('match_memories', {
      query_embedding: queryEmbedding,
      match_threshold: 0.6,
      match_count: limit,
      p_user_id: userId,
    });

    if (error) {
      console.error('Memory search error:', error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('Error searching memories:', err);
    return [];
  }
}

async function getOrCreateConversation(db: SupabaseClient, userId: string, conversationId?: string, firstMessage?: string) {
  try {
    if (conversationId) {
      const { data: existing } = await db
        .from('conversations')
        .select('id')
        .eq('id', conversationId)
        .eq('user_id', userId)
        .single();

      if (existing) {
        await db.from('conversations').update({ updated_at: new Date().toISOString() }).eq('id', conversationId);
        return conversationId;
      }
    }

    const title = firstMessage
      ? firstMessage.slice(0, 50) + (firstMessage.length > 50 ? '...' : '')
      : 'New Conversation';

    const { data: newConv, error } = await db
      .from('conversations')
      .insert({ user_id: userId, title })
      .select('id')
      .single();

    if (error) {
      console.error('Error creating conversation:', error);
      return null;
    }

    return newConv.id;
  } catch (err) {
    console.error('Error in getOrCreateConversation:', err);
    return null;
  }
}

async function saveMessage(
  db: SupabaseClient,
  conversationId: string,
  userId: string,
  role: 'user' | 'assistant',
  content: string
) {
  try {
    const { data, error } = await db
      .from('messages')
      .insert({ conversation_id: conversationId, user_id: userId, role, content })
      .select('id')
      .single();

    if (error) {
      console.error('Error saving message:', error);
      return null;
    }

    return data.id;
  } catch (err) {
    console.error('Error in saveMessage:', err);
    return null;
  }
}

async function loadConversationHistory(db: SupabaseClient, conversationId: string, userId: string, limit = 50): Promise<Message[]> {
  try {
    const { data: conv } = await db
      .from('conversations')
      .select('id')
      .eq('id', conversationId)
      .eq('user_id', userId)
      .single();

    if (!conv) return [];

    const { data, error } = await db
      .from('messages')
      .select('role, content')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('Error loading conversation history:', error);
      return [];
    }

    return (data || []).map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));
  } catch (err) {
    console.error('Error in loadConversationHistory:', err);
    return [];
  }
}

async function extractAndSaveMemory(openai: OpenAI, db: SupabaseClient, userId: string, userMessage: string, assistantResponse: string) {
  try {
    const extractionResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a memory extraction assistant. Analyze the conversation and extract any important facts, preferences, or information about the user that should be remembered for future conversations.

Output format: JSON with "memories" array, each item having "content" (the fact to remember) and "importance" (1-10 scale).
If there's nothing important to remember, return: {"memories": []}

Examples of things to remember:
- User's name, job, location
- User's preferences and interests
- Important dates or events
- Technical details about their projects
- Personal facts they share`,
        },
        {
          role: 'user',
          content: `User said: "${userMessage.slice(0, 1000)}"\n\nAssistant responded: "${assistantResponse.slice(0, 1000)}"\n\nExtract any important facts to remember:`,
        },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 500,
    });

    const content = extractionResponse.choices[0].message.content;
    if (!content) return;

    const parsed = JSON.parse(content);
    const memories = parsed.memories || [];

    if (!Array.isArray(memories) || memories.length === 0) return;

    for (const memory of memories) {
      if (!memory.content) continue;

      const { data: insertedMemory, error: insertError } = await db
        .from('memories')
        .insert({
          user_id: userId,
          content: memory.content,
          memory_type: 'fact',
          importance: Math.min(10, Math.max(1, memory.importance || 5)),
        })
        .select('id')
        .single();

      if (insertError) {
        console.error('Error saving memory:', insertError);
        continue;
      }

      const embeddingResponse = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: memory.content,
      });

      await db.from('memories').update({ embedding: embeddingResponse.data[0].embedding }).eq('id', insertedMemory.id);
    }
  } catch (err) {
    console.error('Error extracting memories:', err);
  }
}

async function generateConversationTitle(openai: OpenAI, message: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'Generate a very short title (max 5 words) for a conversation that starts with this message. Return only the title, no quotes or punctuation.',
        },
        { role: 'user', content: message.slice(0, 200) },
      ],
      max_tokens: 20,
    });

    return response.choices[0].message.content?.slice(0, 50) || message.slice(0, 50);
  } catch {
    return message.slice(0, 50) + (message.length > 50 ? '...' : '');
  }
}

const PROJECT_SCOPE_PROMPT = `
IMPORTANT SCOPE RULES:
- You are AKIOR and you must ONLY talk about the AKIOR project: its product, features, roadmap, architecture, codebase, setup, troubleshooting, and improvements.
- If the user asks for anything unrelated (general knowledge, unrelated coding, personal advice, other products, etc.), politely refuse and redirect them back to AKIOR.
- Never invent AKIOR facts. If something is unknown, say what you need to know (e.g., ask for the relevant file or requirement).
`;

export async function POST(request: NextRequest): Promise<NextResponse<ChatResponse | { error: string }>> {
  const startTime = Date.now();

  try {
    const meta = getRequestMeta(request);

    const rateLimit = checkRateLimit(meta.ip);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Remaining': '0',
            'Retry-After': '60',
          },
        }
      );
    }

    const body: ChatRequest = await request.json();
    const { message, history = [], conversationId, isPublic = false, channel = isPublic ? 'public' : 'unknown' } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    if (message.length > 10000) {
      return NextResponse.json({ error: 'Message too long (max 10000 characters)' }, { status: 400 });
    }

    // Public (no auth): still restricted to AKIOR scope.
    if (isPublic) {
      const openai = getOpenAI();
      if (!openai) {
        return NextResponse.json({
          reply: `I'm currently running in demo mode without OpenAI integration.\n\nTo enable full AI capabilities, set OPENAI_API_KEY in the server environment.\n\nYour message was: "${message.slice(0, 100)}${message.length > 100 ? '...' : ''}"`,
        });
      }

      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        {
          role: 'system',
          content: `You are AKIOR.\n${PROJECT_SCOPE_PROMPT}\n\nGuidelines:\n- Be concise, friendly, and accurate\n- If the question is outside AKIOR scope, refuse and redirect`,
        },
        ...history.slice(-10).map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
        { role: 'user', content: message },
      ];

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages,
        max_tokens: 1000,
        temperature: 0.4,
      });

      return NextResponse.json(
        {
          reply: completion.choices[0].message.content || 'I apologize, but I was unable to generate a response.',
          tokensUsed: completion.usage?.total_tokens,
        },
        {
          headers: {
            'X-RateLimit-Remaining': rateLimit.remaining.toString(),
            'X-Response-Time': `${Date.now() - startTime}ms`,
          },
        }
      );
    }

    // Authenticated requests
    const authResult = await verifyAuth(request);
    if (isAuthError(authResult)) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const authHeader = request.headers.get('Authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

    const userId = authResult.userId;
    const db = token ? getDbClientForAuth(token) : null;

    // Agent settings (and optional user OpenAI key)
    const agentSettings = db
      ? await getAgentSettings(db, userId)
      : { agent_name: 'AKIOR', personality_prompt: 'You are AKIOR, a helpful AI assistant.', openai_api_key: null };

    const openai = getOpenAI(agentSettings.openai_api_key);
    if (!openai) {
      return NextResponse.json({
        reply: `I'm currently running in demo mode without OpenAI integration.\n\nTo enable full AI capabilities:\n1. Go to Settings and add your OpenAI API key\n2. Or set OPENAI_API_KEY in the server environment\n\nYour message was: "${message.slice(0, 100)}${message.length > 100 ? '...' : ''}"`,
      });
    }

    let activeConversationId = conversationId;
    let conversationHistory = history;

    if (db) {
      activeConversationId = await getOrCreateConversation(db, userId, conversationId, message);

      if (activeConversationId && !conversationId) {
        const title = await generateConversationTitle(openai, message);
        await db.from('conversations').update({ title }).eq('id', activeConversationId);
      } else if (activeConversationId && history.length === 0) {
        conversationHistory = await loadConversationHistory(db, activeConversationId, userId);
      }

      if (activeConversationId) {
        await saveMessage(db, activeConversationId, userId, 'user', message);
      }
    }

    // RAG context
    let knowledgeContext = '';
    let memoryContext = '';

    if (db) {
      const [knowledgeResults, memoryResults] = await Promise.all([
        searchKnowledge(openai, db, userId, message),
        searchMemories(openai, db, userId, message),
      ]);

      if (knowledgeResults.length > 0) {
        knowledgeContext =
          '\n\n## Relevant Knowledge:\n' +
          knowledgeResults
            .map(
              (k: { title: string; content: string; similarity: number }) =>
                `### ${k.title} (relevance: ${(k.similarity * 100).toFixed(0)}%)\n${k.content}`
            )
            .join('\n\n');
      }

      if (memoryResults.length > 0) {
        memoryContext =
          '\n\n## Things I Remember About You:\n' +
          memoryResults.map((m: { content: string }) => `- ${m.content}`).join('\n');
      }
    }

    // System prompt (strict scope)
    const systemPrompt = `${agentSettings.personality_prompt}

Your name is ${agentSettings.agent_name}.
${PROJECT_SCOPE_PROMPT}
${knowledgeContext}
${memoryContext}

Guidelines:
- Stay strictly within AKIOR scope
- Be helpful, accurate, and concise
- Use the knowledge base information when relevant
- If you don't know something, say so honestly
- Keep responses focused and well-structured`;

    const messagesForModel: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.slice(-30).map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      { role: 'user', content: message },
    ];

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: messagesForModel,
      max_tokens: 1800,
      temperature: 0.4,
    });

    const reply = completion.choices[0].message.content || 'I apologize, but I was unable to generate a response.';

    let messageId: string | undefined;

    if (activeConversationId && db) {
      messageId = (await saveMessage(db, activeConversationId, userId, 'assistant', reply)) || undefined;

      // Background memory extraction
      extractAndSaveMemory(openai, db, userId, message, reply).catch(console.error);

      // Record interaction log (backend-only)
      await db.from('interaction_logs').insert({
        user_id: userId,
        conversation_id: activeConversationId,
        channel,
        user_message: message,
        assistant_message: reply,
        client_ip: meta.ip,
        country: meta.country,
        region: meta.region,
        city: meta.city,
        user_agent: meta.userAgent,
      });
    }

    return NextResponse.json(
      {
        reply,
        conversationId: activeConversationId || undefined,
        messageId,
        tokensUsed: completion.usage?.total_tokens,
      },
      {
        headers: {
          'X-RateLimit-Remaining': rateLimit.remaining.toString(),
          'X-Response-Time': `${Date.now() - startTime}ms`,
        },
      }
    );
  } catch (error) {
    console.error('Chat API Error:', error);

    if (error instanceof OpenAI.APIError) {
      if (error.status === 429) {
        return NextResponse.json({ error: 'AI service is temporarily overloaded. Please try again in a moment.' }, { status: 503 });
      }
      if (error.status === 401) {
        return NextResponse.json({ error: 'AI service configuration error. Please contact support.' }, { status: 500 });
      }
    }

    return NextResponse.json({ error: 'An unexpected error occurred. Please try again.' }, { status: 500 });
  }
}

export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}