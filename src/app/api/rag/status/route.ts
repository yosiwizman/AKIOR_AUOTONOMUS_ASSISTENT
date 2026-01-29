import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAnon, getSupabaseAuthed } from '@/lib/kb/server-clients';

function getAuthToken(req: NextRequest) {
  const authHeader = req.headers.get('Authorization') || '';
  return authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
}

export async function GET(req: NextRequest) {
  const token = getAuthToken(req);
  const db = token ? getSupabaseAuthed(token) : getSupabaseAnon();

  const [{ count: sourcesTotal }, { count: approvedTotal }, { count: chunksTotal }, { count: vectorsTotal }] = await Promise.all([
    db.from('sources').select('*', { count: 'exact', head: true }),
    db.from('sources').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
    db.from('chunks').select('*', { count: 'exact', head: true }),
    db.from('vectors').select('*', { count: 'exact', head: true }),
  ]);

  const { data: lastIndex } = await db
    .from('sources')
    .select('indexed_at')
    .not('indexed_at', 'is', null)
    .order('indexed_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const sources_approved = approvedTotal || 0;
  const vectors_total = vectorsTotal || 0;

  let rag_state: 'OFF' | 'DEGRADED' | 'ON' = 'OFF';
  if (sources_approved === 0) rag_state = 'OFF';
  else if (sources_approved > 0 && vectors_total === 0) rag_state = 'DEGRADED';
  else rag_state = 'ON';

  return NextResponse.json({
    ok: true,
    data: {
      sources_total: sourcesTotal || 0,
      sources_approved,
      chunks_total: chunksTotal || 0,
      vectors_total,
      last_index_time: lastIndex?.indexed_at || null,
      rag_state,
    },
  });
}
