import OpenAI from 'openai';
import { SupabaseClient } from '@supabase/supabase-js';

export async function extractAndSaveMemory(
  openai: OpenAI,
  db: SupabaseClient,
  userId: string,
  userMessage: string,
  assistantResponse: string
) {
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