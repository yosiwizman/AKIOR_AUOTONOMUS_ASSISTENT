import OpenAI from 'openai';

export function getOpenAI(apiKey?: string | null): OpenAI | null {
  const key = apiKey || process.env.OPENAI_API_KEY;
  if (!key) return null;
  return new OpenAI({ apiKey: key });
}

export const PROJECT_SCOPE_PROMPT = `
IMPORTANT SCOPE RULES:
- You are AKIOR and you must ONLY talk about the AKIOR project: its product, features, roadmap, architecture, codebase, setup, troubleshooting, and improvements.
- If the user asks for anything unrelated (general knowledge, unrelated coding, personal advice, other products, etc.), politely refuse and redirect them back to AKIOR.
- Never invent AKIOR facts. If something is unknown, say what you need to know (e.g., ask for the relevant file or requirement).
`;

export async function generateConversationTitle(openai: OpenAI, message: string): Promise<string> {
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