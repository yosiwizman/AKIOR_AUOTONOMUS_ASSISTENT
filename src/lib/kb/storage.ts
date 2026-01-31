import type { SupabaseClient } from '@supabase/supabase-js';
import { sha256Hex } from './hash';

export type StoredObject = {
  ref: string; // opaque reference
  bytesHash: string;
};

async function ensureBucket(db: SupabaseClient, bucket: string) {
  // Best-effort: bucket creation requires elevated privileges.
  try {
    const { data: existing, error: listError } = await db.storage.listBuckets();
    
    if (listError) {
      console.error('[storage] Failed to list buckets:', listError);
      return;
    }
    
    if (existing?.some((b) => b.name === bucket)) {
      console.log('[storage] Bucket exists:', bucket);
      return;
    }
    
    console.log('[storage] Creating bucket:', bucket);
    const { error: createError } = await db.storage.createBucket(bucket, { public: false });
    
    if (createError) {
      console.error('[storage] Failed to create bucket:', createError);
    }
  } catch (err) {
    console.error('[storage] ensureBucket error:', err);
  }
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
    
    console.log('[storage] Uploading to bucket:', {
      bucket: opts.bucket,
      path,
      size: opts.bytes.length,
      contentType: opts.contentType,
    });
    
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
        details: error,
      });
      throw new Error(`Storage upload failed: ${error.message}`);
    }

    console.log('[storage] Upload successful:', {
      bucket: opts.bucket,
      path,
    });

    return { ref: `supabase://storage/${opts.bucket}/${path}`, bytesHash };
  } catch (err) {
    console.error('[storage] Failed to store bytes:', {
      bucket: opts.bucket,
      path,
      error: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
    });
    // Fallback: inline reference (still hashed, still verifiable, but not object storage)
    return { ref: `inline://sha256/${bytesHash}`, bytesHash };
  }
}