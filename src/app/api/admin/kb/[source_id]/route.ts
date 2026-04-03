import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, isAuthError } from '@/lib/server-auth';
import { getSupabaseAdmin, getSupabaseAuthed } from '@/lib/kb/server-clients';
import { safeId } from '@/lib/kb/hash';
import { writeAuditEvent } from '@/lib/kb/audit';
import { logJson } from '@/lib/kb/logger';
import { assertAdmin } from '@/lib/kb/admin';
import type { Classification } from '@/lib/kb/access';

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ source_id: string }> }) {
  const traceId = safeId('trace');
  const started = Date.now();
  const tenantId = (req.headers.get('x-tenant-id') || 'default').slice(0, 64);

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

    const adminDb = getSupabaseAdmin(tenantId);
    const db = adminDb || getSupabaseAuthed(token, tenantId);

    // Check if source exists and user has permission
    const { data: source, error: srcErr } = await db
      .from('sources')
      .select('id, created_by, title, tenant_id')
      .eq('id', source_id)
      .single();

    if (srcErr || !source) {
      return NextResponse.json({ error: 'Source not found', trace_id: traceId }, { status: 404 });
    }

    // Only allow deletion if user is admin or the creator
    const isAdmin = auth.email?.endsWith('@akior.com') || false;
    const isCreator = (source as any).created_by === auth.userId;

    if (!isAdmin && !isCreator) {
      return NextResponse.json({ error: 'Forbidden', trace_id: traceId }, { status: 403 });
    }

    // Delete vectors first (cascade from chunks)
    const { data: chunks } = await db
      .from('chunks')
      .select('chunk_id')
      .eq('source_id', source_id);

    if (chunks && chunks.length > 0) {
      const chunkIds = chunks.map((c: any) => c.chunk_id);
      await db.from('vectors').delete().in('chunk_id', chunkIds);
    }

    // Delete chunks
    await db.from('chunks').delete().eq('source_id', source_id);

    // Delete source versions
    await db.from('source_versions').delete().eq('source_id', source_id);

    // Delete source
    const { error: deleteErr } = await db.from('sources').delete().eq('id', source_id);
    if (deleteErr) throw deleteErr;

    await writeAuditEvent({
      db,
      actorId: auth.userId,
      traceId,
      action: 'kb.delete',
      resourceType: 'source',
      resourceId: source_id,
      payload: {
        source_id,
        title: (source as any).title,
        tenant_id: tenantId,
      },
    });

    logJson('info', {
      trace_id: traceId,
      event: 'kb.delete.ok',
      source_id,
      ms: Date.now() - started,
    });

    return NextResponse.json({
      ok: true,
      trace_id: traceId,
      source_id,
    });
  } catch (err) {
    logJson('error', {
      trace_id: traceId,
      event: 'kb.delete.error',
      error: err instanceof Error ? err.message : String(err),
      ms: Date.now() - started,
    });
    return NextResponse.json({ error: 'Failed to delete', trace_id: traceId }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ source_id: string }> }) {
  const traceId = safeId('trace');
  const started = Date.now();
  const tenantId = (req.headers.get('x-tenant-id') || 'default').slice(0, 64);

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

    const adminDb = getSupabaseAdmin(tenantId);
    const db = adminDb || getSupabaseAuthed(token, tenantId);

    // Check if source exists and user has permission
    const { data: source, error: srcErr } = await db
      .from('sources')
      .select('id, created_by, tenant_id')
      .eq('id', source_id)
      .single();

    if (srcErr || !source) {
      return NextResponse.json({ error: 'Source not found', trace_id: traceId }, { status: 404 });
    }

    // Only allow editing if user is admin or the creator
    const isAdmin = auth.email?.endsWith('@akior.com') || false;
    const isCreator = (source as any).created_by === auth.userId;

    if (!isAdmin && !isCreator) {
      return NextResponse.json({ error: 'Forbidden', trace_id: traceId }, { status: 403 });
    }

    const body = await req.json();
    const updates: any = {};

    if (body.title !== undefined) {
      updates.title = body.title ? String(body.title).slice(0, 100) : null;
    }

    if (body.classification !== undefined) {
      const classification = String(body.classification).toLowerCase() as Classification;
      if (!['public', 'internal', 'restricted'].includes(classification)) {
        return NextResponse.json({ error: 'Invalid classification', trace_id: traceId }, { status: 400 });
      }
      updates.classification = classification;
    }

    if (body.trust_level !== undefined) {
      const trustLevel = Math.max(0, Math.min(100, Number(body.trust_level) || 50));
      updates.trust_level = trustLevel;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No updates provided', trace_id: traceId }, { status: 400 });
    }

    const { error: updateErr } = await db
      .from('sources')
      .update(updates)
      .eq('id', source_id);

    if (updateErr) throw updateErr;

    // If classification changed, update chunks and vectors
    if (updates.classification) {
      await db
        .from('chunks')
        .update({ classification: updates.classification })
        .eq('source_id', source_id);

      const { data: chunks } = await db
        .from('chunks')
        .select('chunk_id')
        .eq('source_id', source_id);

      if (chunks && chunks.length > 0) {
        const chunkIds = chunks.map((c: any) => c.chunk_id);
        await db
          .from('vectors')
          .update({ classification: updates.classification })
          .in('chunk_id', chunkIds);
      }
    }

    await writeAuditEvent({
      db,
      actorId: auth.userId,
      traceId,
      action: 'kb.update',
      resourceType: 'source',
      resourceId: source_id,
      payload: {
        source_id,
        updates,
        tenant_id: tenantId,
      },
    });

    logJson('info', {
      trace_id: traceId,
      event: 'kb.update.ok',
      source_id,
      updates,
      ms: Date.now() - started,
    });

    return NextResponse.json({
      ok: true,
      trace_id: traceId,
      source_id,
      updates,
    });
  } catch (err) {
    logJson('error', {
      trace_id: traceId,
      event: 'kb.update.error',
      error: err instanceof Error ? err.message : String(err),
      ms: Date.now() - started,
    });
    return NextResponse.json({ error: 'Failed to update', trace_id: traceId }, { status: 500 });
  }
}
