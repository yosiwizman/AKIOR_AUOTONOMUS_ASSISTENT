import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/server-auth';
import { getSupabaseAnon, getSupabaseAuthed } from '@/lib/kb/server-clients';
import { safeId } from '@/lib/kb/hash';
import { roleForRequest, allowedClassifications } from '@/lib/kb/access';
import { retrieveTopChunks } from '@/lib/kb/retriever';
import { writeRetrievalEvent, writeAuditEvent } from '@/lib/kb/audit';
import { logJson } from '@/lib/kb/logger';

function getAuthToken(req: NextRequest) {
  const authHeader = req.headers.get('Authorization') || '';
  return authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
}

export async function POST(req: NextRequest) {
  const traceId = safeId('trace');

  const token = getAuthToken(req);
  const isAuthenticated = !!token;
  const auth = isAuthenticated ? await verifyAuth(req) : null;

  const isPublicMode = !isAuthenticated; // debug endpoint: public gets spokesman constraints
  const role = roleForRequest({
    isPublicMode,
    isAuthenticated,
    email: !auth || 'error' in auth ? null : auth.email,
  });

  const db = token ? getSupabaseAuthed(token) : getSupabaseAnon();

  const body = await req.json().catch(() => ({}));
  const q = String(body.q || '').slice(0, 2000);
  const topK = Math.max(1, Math.min(20, Number(body.topK) || 5));

  if (!q) return NextResponse.json({ error: 'Missing q', trace_id: traceId }, { status: 400 });

  const tenantId = (req.headers.get('x-tenant-id') || 'default').slice(0, 64);

  const actorId = !auth || 'error' in auth ? null : auth.userId;
  const classifications = allowedClassifications(role);

  const hits = await retrieveTopChunks({
    db,
    q,
    topK,
    tenantId,
    classifications,
    actorId,
    includeText: true,
  });

  logJson('info', {
    trace_id: traceId,
    event: 'kb.test_query',
    role,
    topK,
    hits: hits.length,
  });

  if (actorId) {
    await writeRetrievalEvent({ db, actorId, traceId, query: q, topk: topK, sourcesUsed: hits.map((h) => h.source_id) });
    await writeAuditEvent({
      db,
      actorId,
      traceId,
      action: 'kb.retrieve',
      resourceType: 'retrieval',
      resourceId: null,
      payload: {
        topk: topK,
        sources_used: hits.map((h) => h.source_id),
      },
    });
  }

  return NextResponse.json({
    ok: true,
    trace_id: traceId,
    role,
    topK,
    hits: hits.map((h) => ({
      source_id: h.source_id,
      source_version: h.source_version,
      chunk_id: h.chunk_id,
      confidence: h.confidence,
      metadata: h.metadata,
      text_preview: (h.text || '').slice(0, 240),
    })),
  });
}