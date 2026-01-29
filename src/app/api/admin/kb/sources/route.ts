import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, isAuthError } from '@/lib/server-auth';
import { getSupabaseAuthed } from '@/lib/kb/server-clients';

export async function GET(req: NextRequest) {
  const auth = await verifyAuth(req);
  if (isAuthError(auth)) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const authHeader = req.headers.get('Authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  const db = getSupabaseAuthed(token);

  const { data, error } = await db
    .from('sources')
    .select('id, title, status, classification, trust_level, checksum, created_at, indexed_at')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, sources: data || [] });
}
