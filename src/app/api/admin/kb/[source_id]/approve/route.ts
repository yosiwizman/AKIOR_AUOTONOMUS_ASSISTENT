import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, isAuthError } from '@/lib/server-auth';
import { getSupabaseAdmin, getSupabaseAuthed } from '@/lib/kb/server-clients';
import { safeId } from '@/lib/kb/hash';
import { writeAuditEvent } from '@/lib/kb/audit';
import { indexApprovedSource } from '@/lib/kb/ingestion';
import { logJson } from '@/lib/kb/logger';
import { assertAdmin } from '@/lib/kb/admin';

export async function POST(req: NextRequest, ctx: { params: Promise<{ source_id: string }> }) {
  const traceId = safeId('trace');
  const started = Date.now();

  const tenantId = (req.headers.get('x-tenant-id') || 'default').slice(0, 64);

  try {
    const auth = await verifyAuth(req);
    if (isAuthError(auth)) {
      return NextResponse.json({ error: auth.error, trace_id: traceId }, { status: auth.status });
    }

    // Governance: only allow admin to approve.
    assertAdmin({ isAuthenticated: true, email: auth.email || null });

    const { source_id } = await ctx.params;
    if (!source_id) {
      return NextResponse.json({ error: 'Missing source_id', trace_id: traceId }, { status: 400 });
    }

    const authHeader = req.headers.get('Authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

    // Use service role if available so admin can approve across tenants/users.
    const adminDb = getSupabaseAdmin(tenantId);
    const db = adminDb || getSupabaseAuthed(token, tenantId);

    const { data: source, error: srcErr } = await db
      .from('sources')
      .select('id, status, classification, tenant_id, acl_user_ids, indexed_at')
      .eq('id', source_id)
      .single();

    if (srcErr || !source) {
      return NextResponse.json({ error: 'Source not found', trace_id: traceId }, { status: 404 });
    }

    // Idempotent retry safety: if already approved+indexed, exit early.
    if ((source as any).status === 'approved' && (source as any).indexed_at) {
      const { data: chunkRows } = await db.from('chunks').select('chunk_id').eq('source_id', source_id);
      const chunkIds = (chunkRows || []).map((r: any) => r.chunk_id as string);
      const { count: vecCount } = chunkIds.length
        ? await db.from('vectors').select('vector_id', { count: 'exact', head: true }).in('chunk_id', chunkIds)
        : { count: 0 };

      if ((vecCount || 0) > 0 && (vecCount || 0) >= chunkIds.length) {
        return NextResponse.json({
          ok: true,
          trace_id: traceId,
          already: true,
          indexed: { chunks: chunkIds.length, vectors: vecCount || 0 },
        });
      }
      // else: approved but not fully indexed → continue to attempt indexing
    }

    if ((source as any).status !== 'approved') {
      const { error: updErr } = await db.from('sources').update({ status: 'approved' }).eq('id', source_id);
      if (updErr) throw updErr;

      await writeAuditEvent({
        db,
        actorId: auth.userId,
        traceId,
        action: 'kb.approve',
        resourceType: 'source',
        resourceId: source_id,
        payload: { source_id, tenant_id: tenantId },
      });
    }

    const { data: sv, error: svErr } = await db
      .from('source_versions')
      .select('version, metadata_json')
      .eq('source_id', source_id)
      .order('version', { ascending: false })
      .limit(1)
      .single();

    if (svErr || !sv) {
      return NextResponse.json({ error: 'Missing parsed version', trace_id: traceId }, { status: 409 });
    }

    const parsedText = (sv.metadata_json as any)?.text as string | undefined;
    if (!parsedText || parsedText.trim().length === 0) {
      return NextResponse.json({ error: 'Parsed text is empty', trace_id: traceId }, { status: 400 });
    }

    const indexResult = await indexApprovedSource({
      db,
      tenantId: (source as any).tenant_id || tenantId,
      sourceId: source_id,
      sourceVersion: sv.version,
      parsedText,
      classification: (source as any).classification,
      aclUserIds: (source as any).acl_user_ids,
    });

    await writeAuditEvent({
      db,
      actorId: auth.userId,
      traceId,
      action: 'kb.index',
      resourceType: 'source',
      resourceId: source_id,
      payload: {
        source_id,
        tenant_id: tenantId,
        chunks: indexResult.chunks,
        vectors: indexResult.vectors,
      },
    });

    logJson('info', {
      trace_id: traceId,
      event: 'kb.approve.index.ok',
      source_id,
      chunks: indexResult.chunks,
      vectors: indexResult.vectors,
      ms: Date.now() - started,
    });

    return NextResponse.json({
      ok: true,
      trace_id: traceId,
      source_id,
      indexed: indexResult,
    });
  } catch (err) {
    const status = (err as any)?.status || 500;

    // Audit (redacted) - never include document/chunk text.
    try {
      const adminDb = getSupabaseAdmin(tenantId);
      const db = adminDb || getSupabaseAuthed((req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, ''), tenantId);

      await writeAuditEvent({
        db,
        actorId: null, // service role (if present) will bypass RLS; otherwise best-effort
        traceId,
        action: 'kb.index_failed',
        resourceType: 'source',
        resourceId: null,
        payload: {
          reason_code: (err as any)?.code || 'unknown',
          message: err instanceof Error ? err.message : String(err),
          tenant_id: tenantId,
        },
      });
    } catch {
      // ignore audit failures
    }

    logJson('error', {
      trace_id: traceId,
      event: 'kb.approve.index.error',
      error: err instanceof Error ? err.message : String(err),
      ms: Date.now() - started,
    });

    return NextResponse.json({ error: status === 403 ? 'Forbidden' : 'Failed to approve/index', trace_id: traceId }, { status });
  }
}