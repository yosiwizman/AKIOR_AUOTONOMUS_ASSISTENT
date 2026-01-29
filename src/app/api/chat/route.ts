/**
 * AKIOR Chat API with RAG and Memory
 * 
 * POST /api/chat
 * Body: { 
 *   message: string, 
 *   history: Array<{ role: 'user' | 'assistant', content: string }>,
 *   userId: string,
 *   conversationId?: string
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize Supabase admin client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ruftuoilatlzniuasoza.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  { auth: { persistSession: false } }
);

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatRequest {
  message: string;
  history?: Message[];
  userId?: string;
  conversationId?: string;
}

// Get user's agent settings
async function getAgentSettings(userId: string) {
  const { data } = await supabaseAdmin
    .from('agent_settings')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  return data || {
    agent_name: 'AKIOR',
    personality_prompt: 'You are AKIOR, a helpful and knowledgeable AI assistant. You are professional, concise, and friendly.',
    voice_id: 'alloy',
    voice_speed: 1.0,
  };
}

// Search knowledge base using vector similarity
async function searchKnowledge(userId: string, query: string, limit = 5) {
  try {
    if (!process.env.OPENAI_API_KEY) return [];

    // Generate embedding for the query
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: query,
    });
    const queryEmbedding = embeddingResponse.data[0].embedding;

    // Search using the match_knowledge function
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
async function searchMemories(userId: string, query: string, limit = 5) {
  try {
    if (!process.env.OPENAI_API_KEY) return [];

    // Generate embedding for the query
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: query,
    });
    const queryEmbedding = embeddingResponse.data[0].embedding;

    // Search using the match_memories function
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

// Extract and save important information as memories
async function extractAndSaveMemory(userId: string, userMessage: string, assistantResponse: string) {
  try {
    if (!process.env.OPENAI_API_KEY) return;

    // Use GPT to determine if there's important information to remember
    const extractionResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a memory extraction assistant. Analyze the conversation and extract any important facts, preferences, or information about the user that should be remembered for future conversations.

Output format: JSON array of memories, each with "content" (the fact to remember) and "importance" (1-10 scale).
If there's nothing important to remember, return an empty array: []

Examples of things to remember:
- User's name, job, location
- User's preferences and interests
- Important dates or events
- Technical details about their projects
- Personal facts they share`
        },
        {
          role: 'user',
          content: `User said: "${userMessage}"\n\nAssistant responded: "${assistantResponse}"\n\nExtract any important facts to remember:`
        }
      ],
      response_format: { type: 'json_object' },
      max_tokens: 500,
    });

    const content = extractionResponse.choices[0].message.content;
    if (!content) return;

    const parsed = JSON.parse(content);
    const memories = parsed.memories || parsed || [];

    if (!Array.isArray(memories) || memories.length === 0) return;

    // Save each memory
    for (const memory of memories) {
      if (!memory.content) continue;

      // Insert memory
      const { data: insertedMemory, error: insertError } = await supabaseAdmin
        .from('memories')
        .insert({
          user_id: userId,
          content: memory.content,
          memory_type: 'fact',
          importance: memory.importance || 5,
        })
        .select()
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

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: ChatRequest = await request.json();
    const { message, history = [], userId, conversationId } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Check if OpenAI is configured
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({
        reply: `I'm currently running in demo mode without OpenAI integration.

To enable full AI capabilities:
1. Add your OpenAI API key to the environment variables
2. Set OPENAI_API_KEY in your .env.local file

Your message was: "${message}"`,
      });
    }

    // Get agent settings
    const agentSettings = userId 
      ? await getAgentSettings(userId)
      : { agent_name: 'AKIOR', personality_prompt: 'You are AKIOR, a helpful AI assistant.' };

    // Search knowledge base and memories for context
    let knowledgeContext = '';
    let memoryContext = '';

    if (userId) {
      const [knowledgeResults, memoryResults] = await Promise.all([
        searchKnowledge(userId, message),
        searchMemories(userId, message),
      ]);

      if (knowledgeResults.length > 0) {
        knowledgeContext = '\n\n## Relevant Knowledge:\n' + 
          knowledgeResults.map((k: { title: string; content: string }) => 
            `### ${k.title}\n${k.content}`
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
- Use the knowledge base information when relevant
- Remember and reference things you know about the user
- If you don't know something, say so honestly
- Keep responses focused and well-structured`;

    // Build messages array
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-20).map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user', content: message },
    ];

    // Generate response
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      max_tokens: 1500,
      temperature: 0.7,
    });

    const reply = completion.choices[0].message.content || 'I apologize, but I was unable to generate a response.';

    // Extract and save memories in the background (don't await)
    if (userId) {
      extractAndSaveMemory(userId, message, reply).catch(console.error);
    }

    return NextResponse.json({ reply });
  } catch (error) {
    console.error('Chat API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
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
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
