/**
 * AKIOR Chat API - Enterprise Grade
 * 
 * Features:
 * - Full conversation persistence
 * - RAG with knowledge base
 * - Long-term memory
 * - Rate limiting
 * - Comprehensive error handling
 * - Streaming support ready
 * 
 * POST /api/chat
 */

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Lazy initialization to avoid build-time errors
function getOpenAI(apiKey?: string | null) {
  const key = apiKey || process.env.OPENAI_API_KEY;
  if (!key) {
    return null;
  }
  return new OpenAI({ apiKey: key });
}

function getSupabaseAdmin(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ruftuoilatlzniuasoza.supabase.co';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!key) {
    return null;
  }
  
  return createClient(url, key, { auth: { persistSession: false } });
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
  userId?: string;
  conversationId?: string;
  isPublic?: boolean; // For free public interface
}

interface ChatResponse {
  reply: string;
  conversationId?: string;
  messageId?: string;
  tokensUsed?: number;
}

// Rate limiting check
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

// Get user's agent settings (including API key)
async function getAgentSettings(supabaseAdmin: SupabaseClient, userId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('agent_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching agent settings:', error);
    }

    return data || {
      agent_name: 'AKIOR',
      personality_prompt: 'You are AKIOR, a helpful and knowledgeable AI assistant. You are professional, concise, and friendly.',
      voice_id: 'alloy',
      voice_speed: 1.0,
      openai_api_key: null,
    };
  } catch (err) {
    console.error('Error in getAgentSettings:', err);
    return {
      agent_name: 'AKIOR',
      personality_prompt: 'You are AKIOR, a helpful and knowledgeable AI assistant.',
      voice_id: 'alloy',
      voice_speed: 1.0,
      openai_api_key: null,
    };
  }
}

// Search knowledge base using vector similarity
async function searchKnowledge(openai: OpenAI, supabaseAdmin: SupabaseClient, userId: string, query: string, limit = 5) {
  try {
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: query.slice(0, 8000),
    });
    const queryEmbedding = embeddingResponse.data[0].embedding;

    const { data, error } = await supabaseAdmin.rpc('match_knowledge', {
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

// Search memories using vector similarity
async function searchMemories(openai: OpenAI, supabaseAdmin: SupabaseClient, userId: string, query: string, limit = 5) {
  try {
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: query.slice(0, 8000),
    });
    const queryEmbedding = embeddingResponse.data[0].embedding;

    const { data, error } = await supabaseAdmin.rpc('match_memories', {
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

// Get or create conversation
async function getOrCreateConversation(supabaseAdmin: SupabaseClient, userId: string, conversationId?: string, firstMessage?: string) {
  try {
    // If conversationId provided, verify it belongs to user
    if (conversationId) {
      const { data: existing } = await supabaseAdmin
        .from('conversations')
        .select('id')
        .eq('id', conversationId)
        .eq('user_id', userId)
        .single();

      if (existing) {
        // Update the updated_at timestamp
        await supabaseAdmin
          .from('conversations')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', conversationId);
        return conversationId;
      }
    }

    // Create new conversation
    const title = firstMessage 
      ? firstMessage.slice(0, 50) + (firstMessage.length > 50 ? '...' : '')
      : 'New Conversation';

    const { data: newConv, error } = await supabaseAdmin
      .from('conversations')
      .insert({
        user_id: userId,
        title,
      })
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

// Save message to database
async function saveMessage(
  supabaseAdmin: SupabaseClient,
  conversationId: string,
  userId: string,
  role: 'user' | 'assistant',
  content: string
) {
  try {
    const { data, error } = await supabaseAdmin
      .from('messages')
      .insert({
        conversation_id: conversationId,
        user_id: userId,
        role,
        content,
      })
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

// Load conversation history from database
async function loadConversationHistory(supabaseAdmin: SupabaseClient, conversationId: string, limit = 50): Promise<Message[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('messages')
      .select('role, content')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('Error loading conversation history:', error);
      return [];
    }

    return (data || []).map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));
  } catch (err) {
    console.error('Error in loadConversationHistory:', err);
    return [];
  }
}

// Extract and save important information as memories
async function extractAndSaveMemory(openai: OpenAI, supabaseAdmin: SupabaseClient, userId: string, userMessage: string, assistantResponse: string) {
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
- Personal facts they share`
        },
        {
          role: 'user',
          content: `User said: "${userMessage.slice(0, 1000)}"\n\nAssistant responded: "${assistantResponse.slice(0, 1000)}"\n\nExtract any important facts to remember:`
        }
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

      const { data: insertedMemory, error: insertError } = await supabaseAdmin
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

      // Generate embedding for the memory
      const embeddingResponse = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: memory.content,
      });

      await supabaseAdmin
        .from('memories')
        .update({ embedding: embeddingResponse.data[0].embedding })
        .eq('id', insertedMemory.id);
    }
  } catch (err) {
    console.error('Error extracting memories:', err);
  }
}

// Generate title for conversation based on first message
async function generateConversationTitle(openai: OpenAI, message: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Generate a very short title (max 5 words) for a conversation that starts with this message. Return only the title, no quotes or punctuation.'
        },
        { role: 'user', content: message.slice(0, 200) }
      ],
      max_tokens: 20,
    });

    return response.choices[0].message.content?.slice(0, 50) || message.slice(0, 50);
  } catch {
    return message.slice(0, 50) + (message.length > 50 ? '...' : '');
  }
}

export async function POST(request: NextRequest): Promise<NextResponse<ChatResponse | { error: string }>> {
  const startTime = Date.now();

  try {
    // Get client IP for rate limiting
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                     request.headers.get('x-real-ip') || 
                     'unknown';

    // Check rate limit
    const rateLimit = checkRateLimit(clientIp);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Remaining': '0',
            'Retry-After': '60',
          }
        }
      );
    }

    const body: ChatRequest = await request.json();
    const { message, history = [], userId, conversationId, isPublic = false } = body;

    // Validate request
    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    if (message.length > 10000) {
      return NextResponse.json({ error: 'Message too long (max 10000 characters)' }, { status: 400 });
    }

    // Get Supabase admin client
    const supabaseAdmin = getSupabaseAdmin();

    // Get agent settings (including user's API key) for authenticated users
    const agentSettings = userId && supabaseAdmin
      ? await getAgentSettings(supabaseAdmin, userId)
      : { agent_name: 'AKIOR', personality_prompt: 'You are AKIOR, a helpful AI assistant.', openai_api_key: null };

    // Check if OpenAI is configured (user's key takes priority)
    const openai = getOpenAI(agentSettings.openai_api_key);
    if (!openai) {
      return NextResponse.json({
        reply: `I'm currently running in demo mode without OpenAI integration.\n\nTo enable full AI capabilities:\n1. Go to Settings and add your OpenAI API key\n2. Or set OPENAI_API_KEY in the server environment\n\nYour message was: "${message.slice(0, 100)}${message.length > 100 ? '...' : ''}"`,
      });
    }

    // For public interface, use minimal settings
    if (isPublic) {
      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        {
          role: 'system',
          content: `You are AKIOR, a helpful AI assistant. Be concise, friendly, and helpful.
          
Guidelines:
- Provide accurate, helpful information
- Be concise but thorough
- If you don't know something, say so
- Do not generate images or perform actions - only provide information`
        },
        ...history.slice(-10).map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
        { role: 'user', content: message },
      ];

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages,
        max_tokens: 1000,
        temperature: 0.7,
      });

      return NextResponse.json({
        reply: completion.choices[0].message.content || 'I apologize, but I was unable to generate a response.',
        tokensUsed: completion.usage?.total_tokens,
      }, {
        headers: {
          'X-RateLimit-Remaining': rateLimit.remaining.toString(),
          'X-Response-Time': `${Date.now() - startTime}ms`,
        }
      });
    }

    // Get or create conversation
    let activeConversationId = conversationId;
    let conversationHistory = history;

    if (userId && supabaseAdmin) {
      // Get or create conversation
      activeConversationId = await getOrCreateConversation(supabaseAdmin, userId, conversationId, message);

      // If we have a conversation, load history from database
      if (activeConversationId && !conversationId) {
        // New conversation, generate a better title
        const title = await generateConversationTitle(openai, message);
        await supabaseAdmin
          .from('conversations')
          .update({ title })
          .eq('id', activeConversationId);
      } else if (activeConversationId && history.length === 0) {
        // Existing conversation but no history provided, load from DB
        conversationHistory = await loadConversationHistory(supabaseAdmin, activeConversationId);
      }

      // Save user message
      if (activeConversationId) {
        await saveMessage(supabaseAdmin, activeConversationId, userId, 'user', message);
      }
    }

    // Search knowledge base and memories for context
    let knowledgeContext = '';
    let memoryContext = '';

    if (userId && supabaseAdmin) {
      const [knowledgeResults, memoryResults] = await Promise.all([
        searchKnowledge(openai, supabaseAdmin, userId, message),
        searchMemories(openai, supabaseAdmin, userId, message),
      ]);

      if (knowledgeResults.length > 0) {
        knowledgeContext = '\n\n## Relevant Knowledge:\n' + 
          knowledgeResults.map((k: { title: string; content: string; similarity: number }) => 
            `### ${k.title} (relevance: ${(k.similarity * 100).toFixed(0)}%)\n${k.content}`
          ).join('\n\n');
      }

      if (memoryResults.length > 0) {
        memoryContext = '\n\n## Things I Remember About You:\n' +
          memoryResults.map((m: { content: string }) => `- ${m.content}`).join('\n');
      }
    }

    // Build system prompt
    const systemPrompt = `${agentSettings.personality_prompt}

Your name is ${agentSettings.agent_name}.
${knowledgeContext}
${memoryContext}

Guidelines:
- Be helpful, accurate, and concise
- Use the knowledge base information when relevant to answer questions
- Remember and reference things you know about the user naturally
- If you don't know something, say so honestly
- Keep responses focused and well-structured
- Maintain conversation context and refer back to previous messages when relevant`;

    // Build messages array with conversation history
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.slice(-30).map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user', content: message },
    ];

    // Generate response
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      max_tokens: 2000,
      temperature: 0.7,
    });

    const reply = completion.choices[0].message.content || 'I apologize, but I was unable to generate a response.';

    // Save assistant message and extract memories
    let messageId: string | undefined;
    if (userId && activeConversationId && supabaseAdmin) {
      messageId = await saveMessage(supabaseAdmin, activeConversationId, userId, 'assistant', reply) || undefined;
      
      // Extract and save memories in the background
      extractAndSaveMemory(openai, supabaseAdmin, userId, message, reply).catch(console.error);
    }

    return NextResponse.json({
      reply,
      conversationId: activeConversationId || undefined,
      messageId,
      tokensUsed: completion.usage?.total_tokens,
    }, {
      headers: {
        'X-RateLimit-Remaining': rateLimit.remaining.toString(),
        'X-Response-Time': `${Date.now() - startTime}ms`,
      }
    });
  } catch (error) {
    console.error('Chat API Error:', error);
    
    // Determine error type and return appropriate response
    if (error instanceof OpenAI.APIError) {
      if (error.status === 429) {
        return NextResponse.json(
          { error: 'AI service is temporarily overloaded. Please try again in a moment.' },
          { status: 503 }
        );
      }
      if (error.status === 401) {
        return NextResponse.json(
          { error: 'AI service configuration error. Please contact support.' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
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