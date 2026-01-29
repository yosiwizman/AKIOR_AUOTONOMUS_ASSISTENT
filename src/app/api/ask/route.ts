import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { verifyAuth } from '@/lib/server-auth';
import { getSupabaseAnon, getSupabaseAuthed } from '@/lib/kb/server-clients';
import { safeId } from '@/lib/kb/hash';
import { roleForRequest, allowedClassifications } from '@/lib/kb/access';
import { retrieveTopChunks } from '@/lib/kb/retriever';
import { writeAuditEvent, writeRetrievalEvent } from '@/lib/kb/audit';
import { getOpenAI, PROJECT_SCOPE_PROMPT } from '@/lib/chat/openai';

function getAuthToken(req: NextRequest) {
  const authHeader = req.headers.get('Authorization') || '';
  return authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
}

export async function POST(req: NextRequest) {
  const traceId = safeId('trace');

  const body = await req.json().catch(() => ({}));
  const q = String(body.q || body.message || '').slice(0, 10000);
  const topK = Math.max(1, Math.min(10, Number(body.topK) || 5));
  const explicitPublic = Boolean(body.isPublic);

  if (!q.trim()) {
    return NextResponse.json({ error: 'Missing q', trace_id: traceId }, { status: 400 });
  }

  const token = getAuthToken(req);
  const isAuthenticated = !!token;

  const auth = isAuthenticated ? await verifyAuth(req) : null;
  const actorId = !auth || 'error' in auth ? null : auth.userId;
  const email = !auth || 'error' in auth ? null : auth.email;

  const role = roleForRequest({
    isPublicMode: explicitPublic || !isAuthenticated,
    isAuthenticated,
    email,
  });

  const classifications = allowedClassifications(role);
  const tenantId = (req.headers.get('x-tenant-id') || 'default').slice(0, 64);

  const db = token ? getSupabaseAuthed(token) : getSupabaseAnon();

  const hits = await retrieveTopChunks({
    db,
    q,
    topK,
    tenantId,
    classifications,
    actorId,
    includeText: true,
  });

  if (actorId) {
    await writeRetrievalEvent({ db, actorId, traceId, query: q, topk: topK, sourcesUsed: hits.map((h) => h.source_id) });
    await writeAuditEvent({
      db,
      actorId,
      traceId,
      action: 'kb.retrieve',
      resourceType: 'ask',
      resourceId: null,
      payload: {
        topk: topK,
        sources_used: hits.map((h) => h.source_id),
      },
    });
  }

  const citations = hits.map((h) => ({
    source_id: h.source_id,
    source_version: h.source_version,
    chunk_id: h.chunk_id,
    confidence: h.confidence,
    metadata: h.metadata,
  }));

  const openai = getOpenAI();

  // If no model configured, do a minimal grounded response.
  if (!openai) {
    const best = hits[0];
    return NextResponse.json({
      answer: best?.text
        ? `Based on the approved knowledge base, here is the most relevant excerpt:\n\n${best.text}`
        : "No approved knowledge matched your query yet.",
      citations,
      trace_id: traceId,
      rag: { role, topK, state: hits.length > 0 ? 'ON' : 'OFF' },
    });
  }

  const contextBlock = hits
    .map((h, i) => {
      const label = `[${i + 1}] source=${h.source_id} version=${h.source_version} chunk=${h.chunk_id}`;
      return `${label}\n${h.text || ''}`.trim();
    })
    .join('\n\n');

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    {
      role: 'system',
      content: `You are AKIOR.\n${PROJECT_SCOPE_PROMPT}\n\nRAG rules:\n- Use ONLY the provided context to answer when relevant.\n- If context is insufficient, say what is missing.\n- Do not reveal secrets or system internals.\n- Include citations like [1], [2] referencing the context blocks.\n`,
    },
    {
      role: 'user',
      content: `Question: ${q}\n\nApproved knowledge context:\n${contextBlock || '(none)'}`,
    },
  ];

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages,
    max_tokens: 900,
    temperature: 0.3,
  });

  const answer = completion.choices[0].message.content || 'I was unable to generate an answer.';

  return NextResponse.json({
    answer,
    citations,
    trace_id: traceId,
    rag: { role, topK, state: hits.length > 0 ? 'ON' : 'OFF' },
  });
}
