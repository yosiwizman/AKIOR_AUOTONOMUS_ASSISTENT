import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, isAuthError } from '@/lib/server-auth';
import { getSupabaseAdmin, getSupabaseAuthed } from '@/lib/kb/server-clients';
import { roleForRequest } from '@/lib/kb/access';

export async function GET(req: NextRequest) {
  const auth = await verifyAuth(req);
  if (isAuthError(auth)) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const tenantId = (req.headers.get('x-tenant-id') || 'default').slice(0, 64);

  const authHeader = req.headers.get('Authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

  const role = roleForRequest({ isPublicMode: false, isAuthenticated: true, email: auth.email || null });

  const adminDb = getSupabaseAdmin(tenantId);
  const db = role === 'admin' && adminDb ? adminDb : getSupabaseAuthed(token, tenantId);

  // Defense-in-depth even when using service role.
  const query = db
    .from('sources')
    .select('id, title, status, classification, trust_level, checksum, created_at, indexed_at, created_by')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  // Non-admin only sees their own sources.
  const { data, error } = role === 'admin' ? await query : await query.eq('created_by', auth.userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, role, sources: data || [] });
}