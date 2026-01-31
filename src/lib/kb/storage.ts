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
    
    if (error) {
      console.error('[storage] Upload error:', {
        bucket: opts.bucket,
        path,
        error: error.message,
        statusCode: (error as any).statusCode,
      });
      throw new Error(`Storage upload failed: ${error.message}`);
    }

    return { ref: `supabase://storage/${opts.bucket}/${path}`, bytesHash };
  } catch (err) {
    console.error('[storage] Failed to store bytes:', {
      bucket: opts.bucket,
      path,
      error: err instanceof Error ? err.message : String(err),
    });
    // Fallback: inline reference (still hashed, still verifiable, but not object storage)
    return { ref: `inline://sha256/${bytesHash}`, bytesHash };
  }
}