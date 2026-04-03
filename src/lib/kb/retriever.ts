import type { SupabaseClient } from '@supabase/supabase-js';
import { embedText, getEmbedDim } from './embedding';
import type { Classification } from './access';

export type RetrievalHit = {
  source_id: string;
  source_version: number;
  chunk_id: string;
  confidence: number;
  metadata: Record<string, unknown>;
  text?: string; // optional, only used for generation
};

export async function retrieveTopChunks(opts: {
  db: SupabaseClient;
  q: string;
  topK: number;
  classifications: Classification[];
  includeText: boolean;
  userId?: string;
}): Promise<RetrievalHit[]> {
  const queryEmbedding = embedText(opts.q);
  const expectedDim = getEmbedDim();
  if (queryEmbedding.length !== expectedDim) {
    throw new Error(`Embedding dimension mismatch: expected ${expectedDim}, got ${queryEmbedding.length}`);
  }

  const { data, error } = await opts.db.rpc('match_kb_vectors', {
    query_embedding: queryEmbedding,
    match_count: opts.topK,
    p_tenant_id: 'default',
    p_classifications: opts.classifications,
    p_actor_id: opts.userId || null,
  });

  if (error) throw error;

  const rows = (data || []) as Array<{
    chunk_id: string;
    source_id: string;
    source_version: number;
    similarity: number;
    chunk_metadata: Record<string, unknown>;
  }>;

  if (!opts.includeText || rows.length === 0) {
    return rows.map((r) => ({
      source_id: r.source_id,
      source_version: r.source_version,
      chunk_id: r.chunk_id,
      confidence: Math.max(0, Math.min(1, r.similarity)),
      metadata: r.chunk_metadata || {},
    }));
  }

  const chunkIds = rows.map((r) => r.chunk_id);

  const { data: chunkData, error: chunkErr } = await opts.db
    .from('chunks')
    .select('chunk_id, object_ref, metadata_json')
    .in('chunk_id', chunkIds);

  if (chunkErr) throw chunkErr;

  // object_ref is opaque; in this slice we store text preview in metadata_json.text
  const byId = new Map<string, any>();
  for (const c of chunkData || []) byId.set((c as any).chunk_id, c);

  return rows.map((r) => {
    const c = byId.get(r.chunk_id);
    const text = (c?.metadata_json as any)?.text as string | undefined;
    return {
      source_id: r.source_id,
      source_version: r.source_version,
      chunk_id: r.chunk_id,
      confidence: Math.max(0, Math.min(1, r.similarity)),
      metadata: r.chunk_metadata || {},
      text,
    };
  });
}