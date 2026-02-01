import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, isAuthError } from '@/lib/server-auth';
import { getSupabaseAdmin } from '@/lib/kb/server-clients';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (isAuthError(auth)) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const adminDb = getSupabaseAdmin();
    if (!adminDb) {
      return NextResponse.json({
        ok: false,
        error: 'Admin client not available',
        has_service_key: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      }, { status: 500 });
    }

    // Test 1: List buckets
    const { data: buckets, error: bucketsError } = await adminDb.storage.listBuckets();
    
    if (bucketsError) {
      return NextResponse.json({
        ok: false,
        error: 'Failed to list buckets',
        details: bucketsError.message,
      }, { status: 500 });
    }

    const kbRawExists = buckets?.some(b => b.name === 'kb-raw');
    const kbParsedExists = buckets?.some(b => b.name === 'kb-parsed');

    // Test 2: Try to upload a small test file
    const testContent = new TextEncoder().encode('test-content-' + Date.now());
    const testPath = `${auth.userId}/test-${Date.now()}.txt`;
    
    const { error: uploadError } = await adminDb.storage
      .from('kb-raw')
      .upload(testPath, testContent, {
        contentType: 'text/plain',
        upsert: true,
      });

    let uploadSuccess = !uploadError;
    let uploadErrorMessage = uploadError?.message || null;

    // Clean up test file
    if (uploadSuccess) {
      await adminDb.storage.from('kb-raw').remove([testPath]);
    }

    return NextResponse.json({
      ok: true,
      tests: {
        admin_client: 'OK',
        list_buckets: 'OK',
        kb_raw_exists: kbRawExists,
        kb_parsed_exists: kbParsedExists,
        test_upload: uploadSuccess ? 'OK' : 'FAILED',
        upload_error: uploadErrorMessage,
      },
      buckets: buckets?.map(b => ({
        name: b.name,
        public: b.public,
        file_size_limit: b.file_size_limit,
      })),
    });
  } catch (err) {
    return NextResponse.json(
      { 
        ok: false,
        error: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
      },
      { status: 500 }
    );
  }
}