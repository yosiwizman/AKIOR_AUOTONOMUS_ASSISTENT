import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, isAuthError } from '@/lib/server-auth';
import { getSupabaseAuthed } from '@/lib/kb/server-clients';
import { safeId } from '@/lib/kb/hash';
import { writeAuditEvent } from '@/lib/kb/audit';
import { indexApprovedSource } from '@/lib/kb/ingestion';
import { logJson } from '@/lib/kb/logger';

export async function POST(req: NextRequest, ctx: { params: Promise<{ source_id: string }> }) {
  const traceId = safeId('trace');
  const started = Date.now();

  try {
    const auth = await verifyAuth(req);
    if (isAuthError(auth)) {
      return NextResponse.json({ error: auth.error, trace_id: traceId }, { status: auth.status });
    }

    const { source_id } = await ctx.params;
    if (!source_id) {
      return NextResponse.json({ error: 'Missing source_id', trace_id: traceId }, { status: 400 });
    }

    const authHeader = req.headers.get('Authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    const db = getSupabaseAuthed(token);

    const { data: source, error: srcErr } = await db
      .from('sources')
      .select('id, status, classification, tenant_id, acl_user_ids')
      .eq('id', source_id)
      .single();

    if (srcErr || !source) {
      return NextResponse.json({ error: 'Source not found', trace_id: traceId }, { status: 404 });
    }

    if (source.status === 'approved') {
      return NextResponse.json({ ok: true, trace_id: traceId, already: true });
    }

    const { error: updErr } = await db.from('sources').update({ status: 'approved' }).eq('id', source_id);
    if (updErr) throw updErr;

    await writeAuditEvent({
      db,
      actorId: auth.userId,
      traceId,
      action: 'kb.approve',
      resourceType: 'source',
      resourceId: source_id,
      payload: { source_id },
    });

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
      tenantId: (source as any).tenant_id || 'default',
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
    logJson('error', {
      trace_id: traceId,
      event: 'kb.approve.index.error',
      error: err instanceof Error ? err.message : String(err),
      ms: Date.now() - started,
    });
    return NextResponse.json({ error: 'Failed to approve/index', trace_id: traceId }, { status: 500 });
  }
}
