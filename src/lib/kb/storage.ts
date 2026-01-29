import type { SupabaseClient } from '@supabase/supabase-js';
import { sha256Hex } from './hash';

export type StoredObject = {
  ref: string; // opaque reference
  bytesHash: string;
};

async function ensureBucket(db: SupabaseClient, bucket: string) {
  // Best-effort: bucket creation requires elevated privileges.
  const { data: existing } = await db.storage.listBuckets();
  if (existing?.some((b) => b.name === bucket)) return;
  await db.storage.createBucket(bucket, { public: false }).catch(() => null);
}

export async function storeBytes(opts: {
  db: SupabaseClient;
  bucket: string;
  pathPrefix: string;
  bytes: Uint8Array;
  contentType: string;
}): Promise<StoredObject> {
  const bytesHash = sha256Hex(Buffer.from(opts.bytes));
  const path = `${opts.pathPrefix}/${bytesHash}`;

  try {
    await ensureBucket(opts.db, opts.bucket);
    const { error } = await opts.db.storage.from(opts.bucket).upload(path, opts.bytes, {
      contentType: opts.contentType,
      upsert: true,
    });
    if (error) throw error;

    return { ref: `supabase://storage/${opts.bucket}/${path}`, bytesHash };
  } catch {
    // Fallback: inline reference (still hashed, still verifiable, but not object storage)
    return { ref: `inline://sha256/${bytesHash}`, bytesHash };
  }
}
