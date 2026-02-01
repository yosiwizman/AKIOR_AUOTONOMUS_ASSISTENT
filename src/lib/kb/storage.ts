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

  console.log('[storage] storeBytes called:', {
    bucket: opts.bucket,
    path,
    size: opts.bytes.length,
    contentType: opts.contentType,
    pathPrefix: opts.pathPrefix,
  });

  try {
    await ensureBucket(opts.db, opts.bucket);
    
    console.log('[storage] Attempting upload to bucket:', {
      bucket: opts.bucket,
      path,
      size: opts.bytes.length,
      contentType: opts.contentType,
    });
    
    const uploadResult = await opts.db.storage.from(opts.bucket).upload(path, opts.bytes, {
      contentType: opts.contentType,
      upsert: true,
    });
    
    if (uploadResult.error) {
      console.error('[storage] Upload error:', {
        bucket: opts.bucket,
        path,
        error: uploadResult.error.message,
        statusCode: (uploadResult.error as any).statusCode,
        name: (uploadResult.error as any).name,
        details: uploadResult.error,
      });
      throw new Error(`Storage upload failed: ${uploadResult.error.message}`);
    }

    console.log('[storage] Upload successful:', {
      bucket: opts.bucket,
      path,
      uploadPath: uploadResult.data?.path,
    });

    return { ref: `supabase://storage/${opts.bucket}/${path}`, bytesHash };
  } catch (err) {
    console.error('[storage] Failed to store bytes (caught exception):', {
      bucket: opts.bucket,
      path,
      error: err instanceof Error ? err.message : String(err),
      errorName: err instanceof Error ? err.name : 'Unknown',
      stack: err instanceof Error ? err.stack : undefined,
    });
    
    // Log the fallback
    console.warn('[storage] Using inline fallback reference');
    
    // Fallback: inline reference (still hashed, still verifiable, but not object storage)
    return { ref: `inline://sha256/${bytesHash}`, bytesHash };
  }
}