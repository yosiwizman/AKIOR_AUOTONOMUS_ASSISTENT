/**
 * AKIOR Chat API (Refactored & Modular)
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
import { verifyAuth, isAuthError } from '../../../lib/server-auth';

import { getOpenAI, PROJECT_SCOPE_PROMPT, generateConversationTitle } from '../../../lib/chat/openai';
import { getDbClientForAuth, getAgentSettings } from '../../../lib/chat/clients';
import { searchKnowledge, searchMemories, buildSystemPrompt } from '../../../lib/chat/context';
import { getOrCreateConversation, saveMessage, loadConversationHistory } from '../../../lib/chat/conversation';
import { extractAndSaveMemory } from '../../../lib/chat/memory';
import { getRequestMeta } from '../../../lib/chat/meta';
import { checkRateLimit } from '../../../lib/chat/rate-limit';
import type { ChatRequest, ChatResponse, Message } from '../../../lib/chat/types';

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
          headers: { 'X-RateLimit-Remaining': '0', 'Retry-After': '60' },
        }
      );
    }

    const body: ChatRequest = await request.json();
    const {
      message,
      history = [],
      conversationId,
      isPublic = false,
      channel = isPublic ? 'public' : 'unknown',
    } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    if (message.length > 10000) {
      return NextResponse.json({ error: 'Message too long (max 10000 characters)' }, { status: 400 });
    }

    // Public (no auth): strictly AKIOR scope, no persistence
    if (isPublic) {
      const openai = getOpenAI();
      if (!openai) {
        return NextResponse.json({
          reply: `I'm currently running in demo mode without OpenAI integration.\n\nTo enable full AI capabilities, set OPENAI_API_KEY in the server environment.\n\nYour message was: "${message.slice(0, 100)}${message.length > 100 ? '...' : ''}"`,
        });
      }

      const messagesForModel: OpenAI.Chat.ChatCompletionMessageParam[] = [
        {
          role: 'system',
          content: `You are AKIOR.\n${PROJECT_SCOPE_PROMPT}\n\nGuidelines:\n- Be concise, friendly, and accurate\n- If the question is outside AKIOR scope, refuse and redirect`,
        },
        ...history.slice(-10).map((m: Message) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
        { role: 'user', content: message },
      ];

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: messagesForModel,
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

    const agentSettings = db
      ? await getAgentSettings(db, userId)
      : { agent_name: 'AKIOR', personality_prompt: 'You are AKIOR, a helpful AI assistant.' };

    const openai = getOpenAI((agentSettings as any).openai_api_key);
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

    const systemPrompt = buildSystemPrompt(
      { agent_name: (agentSettings as any).agent_name, personality_prompt: (agentSettings as any).personality_prompt },
      knowledgeContext,
      memoryContext
    );

    const messagesForModel: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.slice(-30).map((m: Message) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
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

      // Memory extraction is best-effort
      extractAndSaveMemory(openai, db, userId, message, reply).catch(console.error);

      // Backend-only interaction log
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