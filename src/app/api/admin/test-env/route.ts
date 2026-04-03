import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, isAuthError } from '@/lib/server-auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (isAuthError(auth)) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
    const keyLength = process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0;
    const keyPrefix = process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 30) || 'not-set';

    return NextResponse.json({
      ok: true,
      environment: {
        has_service_key: hasServiceKey,
        key_length: keyLength,
        key_prefix: keyPrefix,
        node_env: process.env.NODE_ENV,
        vercel_env: process.env.VERCEL_ENV,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { 
        error: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
      },
      { status: 500 }
    );
  }
}