import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, isAuthError } from '@/lib/server-auth';
import { getSupabaseAuthed, getSupabaseAdmin } from '@/lib/kb/server-clients';
import { ingestAndParse } from '@/lib/kb/ingestion';
import { safeId, sha256Hex } from '@/lib/kb/hash';
import { writeAuditEvent } from '@/lib/kb/audit';
import { logJson } from '@/lib/kb/logger';
import type { Classification } from '@/lib/kb/access';

// Force Node.js runtime for file parsing libraries (pdf-parse, mammoth)
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function safeTitleFromName(name: string) {
  return name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9 _-]+/g, '').trim().slice(0, 100) || 'Document';
}

export async function POST(req: NextRequest) {
  const traceId = safeId('trace');
  const started = Date.now();

  try {
    logJson('info', {
      trace_id: traceId,
      event: 'kb.upload.request_received',
      has_service_key: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    });

    const auth = await verifyAuth(req);
    if (isAuthError(auth)) {
      return NextResponse.json({ error: auth.error, trace_id: traceId }, { status: auth.status });
    }

    const tenantId = (req.headers.get('x-tenant-id') || 'default').slice(0, 64);

    const authHeader = req.headers.get('Authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    
    // Use admin client for storage operations to bypass RLS
    const adminDb = getSupabaseAdmin(tenantId);
    if (!adminDb) {
      logJson('error', {
        trace_id: traceId,
        event: 'kb.upload.error',
        error: 'SUPABASE_SERVICE_ROLE_KEY not configured',
        env_check: {
          has_key: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
          key_length: process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0,
        },
      });
      return NextResponse.json({
        error: 'Server configuration error: Missing service role key',
        trace_id: traceId
      }, { status: 500 });
    }
    
    // Use authenticated client for regular database operations
    const db = getSupabaseAuthed(token, tenantId);

    const form = await req.formData();
    const file = form.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Missing file', trace_id: traceId }, { status: 400 });
    }

    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 50MB)', trace_id: traceId }, { status: 400 });
    }

    const title = ((form.get('title') as string | null) || '').trim().slice(0, 100) || safeTitleFromName(file.name);

    const classification = (((form.get('classification') as string | null) || 'public').toLowerCase() as Classification);
    if (!['public', 'internal', 'restricted'].includes(classification)) {
      return NextResponse.json({ error: 'Invalid classification', trace_id: traceId }, { status: 400 });
    }

    const trustLevelStr = ((form.get('trust_level') as string | null) || '50').trim();
    const trustLevel = Math.max(0, Math.min(100, Number(trustLevelStr) || 50));

    const restrictedOnlyMe = ((form.get('restricted_only_me') as string | null) || 'false').toLowerCase() === 'true';
    const aclUserIds = restrictedOnlyMe || classification === 'restricted' ? [auth.userId] : null;

    logJson('info', {
      trace_id: traceId,
      event: 'kb.upload.start',
      user_id: auth.userId,
      file_name: file.name,
      file_size: file.size,
      classification,
      trust_level: trustLevel,
      has_admin_client: !!adminDb,
      has_auth_client: !!db,
    });

    let sourceId: string;
    let checksum: string;
    let originalRef: string;
    let parsedRef: string;

    try {
      // Pass both admin client (for storage) and regular client (for database)
      const result = await ingestAndParse({
        db,
        storageDb: adminDb,
        actorId: auth.userId,
        tenantId,
        title,
        file,
        classification,
        trustLevel,
        aclUserIds,
      });
      
      sourceId = result.sourceId;
      checksum = result.checksum;
      originalRef = result.originalRef;
      parsedRef = result.parsedRef;
      
      logJson('info', {
        trace_id: traceId,
        event: 'kb.upload.ingestion_complete',
        source_id: sourceId,
      });
    } catch (ingestionError) {
      logJson('error', {
        trace_id: traceId,
        event: 'kb.upload.ingestion_failed',
        error: ingestionError instanceof Error ? ingestionError.message : String(ingestionError),
        stack: ingestionError instanceof Error ? ingestionError.stack : undefined,
      });
      throw ingestionError;
    }

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
    const errorMessage = err instanceof Error ? err.message : String(err);
    const errorStack = err instanceof Error ? err.stack : undefined;
    
    logJson('error', {
      trace_id: traceId,
      event: 'kb.upload.error',
      error: errorMessage,
      error_stack: errorStack,
      ms: Date.now() - started,
    });
    
    // Provide more specific error messages for common issues
    let userMessage = 'Failed to upload';
    if (errorMessage.includes('storage')) {
      userMessage = 'Storage error: Unable to save file. Please check storage permissions.';
    } else if (errorMessage.includes('bucket')) {
      userMessage = 'Storage bucket error: Please contact support.';
    } else if (errorMessage.includes('parse') || errorMessage.includes('extract')) {
      userMessage = 'Failed to parse document. Please ensure the file is not corrupted.';
    }
    
    return NextResponse.json({ 
      error: userMessage, 
      trace_id: traceId,
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    }, { status: 500 });
  }
}