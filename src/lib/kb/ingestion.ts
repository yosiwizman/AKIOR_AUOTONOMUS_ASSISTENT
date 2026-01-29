import * as pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import { chunkText } from './chunking';
import { embedText } from './embedding';
import { sha256Hex } from './hash';
import { storeBytes } from './storage';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Classification } from './access';

export async function extractTextFromFile(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const mime = (file.type || '').toLowerCase();
  const lowerName = (file.name || '').toLowerCase();

  if (mime === 'application/pdf' || lowerName.endsWith('.pdf')) {
    const parsed = await (pdfParse as unknown as (buf: Buffer) => Promise<{ text: string }>)(buffer);
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

  const storedRaw = await storeBytes({
    db: opts.db,
    bucket: 'kb-raw',
    pathPrefix: opts.actorId,
    bytes: rawBytes,
    contentType: opts.file.type || 'application/octet-stream',
  });

  const { data: source, error: sourceErr } = await opts.db
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
    .select('id')
    .single();

  if (sourceErr) throw sourceErr;

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
    .insert({
      source_id: source.id,
      version: 1,
      parsed_ref: storedParsed.ref,
      metadata_json: {
        parsed_bytes_hash: storedParsed.bytesHash,
        // Keep the parsed text in DB for local-first indexing/debug.
        // Do not log this field.
        text: parsedText,
      },
    })
    .select('id')
    .single();

  if (svErr) throw svErr;

  return {
    sourceId: source.id,
    sourceVersionId: sv.id,
    checksum,
    originalRef: storedRaw.ref,
    parsedRef: storedParsed.ref,
  };
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

  const { data: insertedChunks, error: chunkErr } = await opts.db
    .from('chunks')
    .insert(chunkRows)
    .select('chunk_id, text_hash');

  if (chunkErr) throw chunkErr;

  const inserted = (insertedChunks || []) as Array<{ chunk_id: string; text_hash: string }>;
  const byHash = new Map<string, string>();
  for (const row of inserted) byHash.set(row.text_hash, row.chunk_id);

  const vectorRows = chunkRows.map((c, i) => {
    const chunkId = byHash.get(c.text_hash);
    if (!chunkId) throw new Error('Chunk insert mismatch');

    const embedding = embedText((c.metadata_json as any)?.text || '');
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
  });

  const { error: vecErr } = await opts.db.from('vectors').insert(vectorRows);
  if (vecErr) throw vecErr;

  await opts.db.from('sources').update({ indexed_at: new Date().toISOString() }).eq('id', opts.sourceId);

  return { chunks: chunkRows.length, vectors: vectorRows.length };
}