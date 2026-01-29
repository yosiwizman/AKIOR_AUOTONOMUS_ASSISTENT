import OpenAI from 'openai';
import { SupabaseClient } from '@supabase/supabase-js';
import { PROJECT_SCOPE_PROMPT } from './openai';

export async function searchKnowledge(openai: OpenAI, db: SupabaseClient, userId: string, query: string, limit = 5) {
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

export async function searchMemories(openai: OpenAI, db: SupabaseClient, userId: string, query: string, limit = 5) {
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

export function buildSystemPrompt(agentSettings: {
  agent_name: string;
  personality_prompt: string;
}, knowledgeContext: string, memoryContext: string) {
  return `${agentSettings.personality_prompt}

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
}