import { chunkText } from './chunking';
import { embedText, getEmbedDim } from './embedding';
import { sha256Hex } from './hash';
import { storeBytes } from './storage';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Classification } from './access';

// Dynamic imports for Node.js-only libraries
let pdfParse: any;
let mammoth: any;

async function loadParsers() {
  if (!pdfParse) {
    const pdfModule = await import('pdf-parse');
    pdfParse = pdfModule.default || pdfModule;
  }
  if (!mammoth) {
    mammoth = await import('mammoth');
  }
}

export async function extractTextFromFile(file: File): Promise<string> {
  await loadParsers();
  
  const buffer = Buffer.from(await file.arrayBuffer());
  const mime = (file.type || '').toLowerCase();
  const lowerName = (file.name || '').toLowerCase();

  if (mime === 'application/pdf' || lowerName.endsWith('.pdf')) {
    const parsed = await pdfParse(buffer);
    return parsed.text || '';
  }

  if (
    mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    lowerName.endsWith('.docx')
  ) {
    const { value } = await mammoth.extractRawText({ buffer });
    return value || '';
  }

  return buffer.toString('utf8');
}

export async function ingestAndParse(opts: {
  db: SupabaseClient;
  actorId: string;
  tenantId: string;
  title: string;
  file: File;
  classification: Classification;
  trustLevel: number;
  aclUserIds: string[] | null;
}): Promise<{ sourceId: string; sourceVersionId: string; checksum: string; originalRef: string; parsedRef: string }> {
  const rawBytes = new Uint8Array(await opts.file.arrayBuffer());
  const checksum = sha256Hex(Buffer.from(rawBytes));

  // Idempotency / de-dupe: if this exact content already exists for tenant+classification, reuse it.
  const { data: existingSource } = await opts.db
    .from('sources')
    .select('id, original_ref')
    .eq('tenant_id', opts.tenantId)
    .eq('classification', opts.classification)
    .eq('checksum', checksum)
    .maybeSingle();

  if (existingSource?.id) {
    const { data: existingSv } = await opts.db
      .from('source_versions')
      .select('id, parsed_ref')
      .eq('source_id', existingSource.id)
      .eq('version', 1)
      .maybeSingle();

    if (existingSv?.id) {
      return {
        sourceId: existingSource.id,
        sourceVersionId: existingSv.id,
        checksum,
        originalRef: (existingSource as any).original_ref || '',
        parsedRef: (existingSv as any).parsed_ref || '',
      };
    }
    // Fallthrough: source exists but version is missing/corrupt; we will regenerate version below.
  }

  // Store raw bytes (best-effort idempotent by content hash path)
  const storedRaw = await storeBytes({
    db: opts.db,
    bucket: 'kb-raw',
    pathPrefix: opts.actorId,
    bytes: rawBytes,
    contentType: opts.file.type || 'application/octet-stream',
  });

  // Create source row (may race under unique checksum constraint)
  let sourceId = existingSource?.id as string | undefined;
  let originalRef = storedRaw.ref;

  if (!sourceId) {
    const { data: inserted, error: sourceErr } = await opts.db
      .from('sources')
      .insert({
        status: 'pending',
        classification: opts.classification,
        trust_level: opts.trustLevel,
        checksum,
        original_ref: storedRaw.ref,
        title: opts.title,
        mime_type: opts.file.type || null,
        tenant_id: opts.tenantId,
        acl_user_ids: opts.aclUserIds,
        created_by: opts.actorId,
      })
      .select('id, original_ref')
      .single();

    if (sourceErr) {
      // Unique checksum constraint can race; resolve by selecting the existing row.
      if ((sourceErr as any).code === '23505') {
        const { data: raced, error: racedErr } = await opts.db
          .from('sources')
          .select('id, original_ref')
          .eq('tenant_id', opts.tenantId)
          .eq('classification', opts.classification)
          .eq('checksum', checksum)
          .maybeSingle();

        if (racedErr) throw racedErr;
        if (!raced?.id) throw sourceErr;

        sourceId = raced.id;
        originalRef = (raced as any).original_ref || '';
      } else {
        throw sourceErr;
      }
    } else {
      sourceId = inserted.id;
      originalRef = (inserted as any).original_ref || storedRaw.ref;
    }
  }

  if (!sourceId) {
    throw new Error('Failed to create or resolve source id');
  }

  const extracted = await extractTextFromFile(opts.file);
  const parsedText = extracted.trim();

  const storedParsed = await storeBytes({
    db: opts.db,
    bucket: 'kb-parsed',
    pathPrefix: opts.actorId,
    bytes: new TextEncoder().encode(parsedText),
    contentType: 'text/plain',
  });

  const { data: sv, error: svErr } = await opts.db
    .from('source_versions')
    .upsert(
      {
        source_id: sourceId,
        version: 1,
        parsed_ref: storedParsed.ref,
        metadata_json: {
          parsed_bytes_hash: storedParsed.bytesHash,
          // Keep the parsed text in DB for local-first indexing/debug.
          // Do not log this field.
          text: parsedText,
        },
      },
      { onConflict: 'source_id,version' }
    )
    .select('id')
    .single();

  if (svErr) throw svErr;

  return {
    sourceId,
    sourceVersionId: sv.id,
    checksum,
    originalRef,
    parsedRef: storedParsed.ref,
  };
}

function assertEmbeddingDims(embedding: number[]) {
  const expected = getEmbedDim();
  if (embedding.length !== expected) {
    const err = new Error(`Embedding dimension mismatch: expected ${expected}, got ${embedding.length}`);
    (err as any).code = 'embedding_dim_mismatch';
    (err as any).expected = expected;
    (err as any).actual = embedding.length;
    throw err;
  }
}

export async function indexApprovedSource(opts: {
  db: SupabaseClient;
  tenantId: string;
  sourceId: string;
  sourceVersion: number;
  parsedText: string;
  classification: Classification;
  aclUserIds: string[] | null;
}): Promise<{ chunks: number; vectors: number }> {
  // Idempotency: if vectors already exist for this source+version, do nothing.
  const { data: existingChunkRows } = await opts.db
    .from('chunks')
    .select('chunk_id, text_hash')
    .eq('source_id', opts.sourceId)
    .eq('source_version', opts.sourceVersion);

  const existingChunkIds = (existingChunkRows || []).map((r: any) => r.chunk_id as string);

  if (existingChunkIds.length > 0) {
    const { count: existingVecCount } = await opts.db
      .from('vectors')
      .select('vector_id', { count: 'exact', head: true })
      .in('chunk_id', existingChunkIds);

    if ((existingVecCount || 0) >= existingChunkIds.length) {
      await opts.db.from('sources').update({ indexed_at: new Date().toISOString() }).eq('id', opts.sourceId);
      return { chunks: existingChunkIds.length, vectors: existingVecCount || 0 };
    }
  }

  const chunks = chunkText(opts.parsedText, { chunkChars: 1200, overlapChars: 150, maxChunks: 200 });
  if (chunks.length === 0) return { chunks: 0, vectors: 0 };

  const chunkRows = chunks.map((c, i) => {
    const textHash = sha256Hex(c.text);
    return {
      source_id: opts.sourceId,
      source_version: opts.sourceVersion,
      object_ref: `inline://sha256/${textHash}`,
      text_hash: textHash,
      tenant_id: opts.tenantId,
      classification: opts.classification,
      acl_user_ids: opts.aclUserIds,
      metadata_json: {
        ...c.metadata,
        ordinal: i,
        // NOTE: store chunk text for generation + verification; do not log it.
        text: c.text,
      },
    };
  });

  // Insert missing chunks (dedupe by (source_id, source_version, text_hash))
  const existingByHash = new Map<string, string>();
  for (const row of existingChunkRows || []) existingByHash.set((row as any).text_hash, (row as any).chunk_id);

  const missingChunks = chunkRows.filter((r) => !existingByHash.has(r.text_hash));
  if (missingChunks.length > 0) {
    const { data: insertedChunks, error: chunkErr } = await opts.db
      .from('chunks')
      .insert(missingChunks)
      .select('chunk_id, text_hash');

    if (chunkErr) throw chunkErr;

    for (const row of insertedChunks || []) {
      existingByHash.set((row as any).text_hash, (row as any).chunk_id);
    }
  }

  const allChunkIds: string[] = [];
  for (const r of chunkRows) {
    const id = existingByHash.get(r.text_hash);
    if (!id) throw new Error('Chunk insert mismatch');
    allChunkIds.push(id);
  }

  // Insert missing vectors (dedupe by unique chunk_id)
  const { data: existingVecRows } = await opts.db
    .from('vectors')
    .select('chunk_id')
    .in('chunk_id', allChunkIds);

  const existingVec = new Set<string>((existingVecRows || []).map((r: any) => r.chunk_id as string));

  const vectorRows = chunkRows
    .map((c, i) => {
      const chunkId = existingByHash.get(c.text_hash);
      if (!chunkId) throw new Error('Chunk insert mismatch');
      if (existingVec.has(chunkId)) return null;

      const embedding = embedText((c.metadata_json as any)?.text || '');
      assertEmbeddingDims(embedding);

      return {
        chunk_id: chunkId,
        embedding,
        tenant_id: opts.tenantId,
        classification: opts.classification,
        acl_user_ids: opts.aclUserIds,
        metadata_json: {
          source_id: opts.sourceId,
          source_version: opts.sourceVersion,
          chunk_ordinal: i,
        },
      };
    })
    .filter(Boolean) as any[];

  if (vectorRows.length > 0) {
    const { error: vecErr } = await opts.db.from('vectors').insert(vectorRows);
    if (vecErr) throw vecErr;
  }

  await opts.db.from('sources').update({ indexed_at: new Date().toISOString() }).eq('id', opts.sourceId);

  return { chunks: chunkRows.length, vectors: existingVec.size + vectorRows.length };
}