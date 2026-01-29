import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, isAuthError } from '@/lib/server-auth';
import { getSupabaseAuthed } from '@/lib/kb/server-clients';
import { ingestAndParse } from '@/lib/kb/ingestion';
import { safeId, sha256Hex } from '@/lib/kb/hash';
import { writeAuditEvent } from '@/lib/kb/audit';
import { logJson } from '@/lib/kb/logger';
import type { Classification } from '@/lib/kb/access';

function safeTitleFromName(name: string) {
  return name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9 _-]+/g, '').trim().slice(0, 100) || 'Document';
}

export async function POST(req: NextRequest) {
  const traceId = safeId('trace');
  const started = Date.now();

  try {
    const auth = await verifyAuth(req);
    if (isAuthError(auth)) {
      return NextResponse.json({ error: auth.error, trace_id: traceId }, { status: auth.status });
    }

    const authHeader = req.headers.get('Authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    const db = getSupabaseAuthed(token);

    const form = await req.formData();
    const file = form.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Missing file', trace_id: traceId }, { status: 400 });
    }

    if (file.size > 15 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 15MB)', trace_id: traceId }, { status: 400 });
    }

    const title = ((form.get('title') as string | null) || '').trim().slice(0, 100) || safeTitleFromName(file.name);

    const classification = (((form.get('classification') as string | null) || 'public').toLowerCase() as Classification);
    if (!['public', 'internal', 'restricted'].includes(classification)) {
      return NextResponse.json({ error: 'Invalid classification', trace_id: traceId }, { status: 400 });
    }

    const trustLevelStr = ((form.get('trust_level') as string | null) || '50').trim();
    const trustLevel = Math.max(0, Math.min(100, Number(trustLevelStr) || 50));

    const tenantId = (req.headers.get('x-tenant-id') || 'default').slice(0, 64);

    const restrictedOnlyMe = ((form.get('restricted_only_me') as string | null) || 'false').toLowerCase() === 'true';
    const aclUserIds = restrictedOnlyMe || classification === 'restricted' ? [auth.userId] : null;

    const { sourceId, checksum, originalRef, parsedRef } = await ingestAndParse({
      db,
      actorId: auth.userId,
      tenantId,
      title,
      file,
      classification,
      trustLevel,
      aclUserIds,
    });

    await writeAuditEvent({
      db,
      actorId: auth.userId,
      traceId,
      action: 'kb.upload',
      resourceType: 'source',
      resourceId: sourceId,
      payload: {
        source_id: sourceId,
        checksum,
        checksum_short: checksum.slice(0, 12),
        original_ref_hash: sha256Hex(originalRef),
        parsed_ref_hash: sha256Hex(parsedRef),
        classification,
        trust_level: trustLevel,
        size: file.size,
        mime_type: file.type || null,
      },
    });

    await writeAuditEvent({
      db,
      actorId: auth.userId,
      traceId,
      action: 'kb.parse',
      resourceType: 'source_version',
      resourceId: sourceId,
      payload: {
        source_id: sourceId,
        version: 1,
        parsed_ref_hash: sha256Hex(parsedRef),
      },
    });

    logJson('info', {
      trace_id: traceId,
      event: 'kb.upload.ok',
      source_id: sourceId,
      ms: Date.now() - started,
    });

    return NextResponse.json({
      ok: true,
      trace_id: traceId,
      source_id: sourceId,
      status: 'pending',
    });
  } catch (err) {
    logJson('error', {
      trace_id: traceId,
      event: 'kb.upload.error',
      error: err instanceof Error ? err.message : String(err),
      ms: Date.now() - started,
    });
    return NextResponse.json({ error: 'Failed to upload', trace_id: traceId }, { status: 500 });
  }
}