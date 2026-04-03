import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { NextRequest } from 'next/server';

import * as uploadRoute from '@/app/api/admin/kb/upload/route';
import * as approveRoute from '@/app/api/admin/kb/[source_id]/approve/route';
import * as statusRoute from '@/app/api/rag/status/route';
import * as testQueryRoute from '@/app/api/rag/test-query/route';
import * as askRoute from '@/app/api/ask/route';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ruftuoilatlzniuasoza.supabase.co';
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1ZnR1b2lsYXRsem5pdWFzb3phIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2NjUxNzEsImV4cCI6MjA4NTI0MTE3MX0.JqPbHquY6lF6I2sYPoNLJjpvwP3aEvmIjAL4llk-hJ0';

function requireEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var for integration tests: ${name}`);
  return v;
}

function authHeaders(token?: string): Record<string, string> {
  const h: Record<string, string> = {};
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

describe('Governed RAG (upload → approve → index → retrieve)', () => {
  const serviceKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');

  const adminDb = createClient(SUPABASE_URL, serviceKey, { auth: { persistSession: false } });
  const anonDb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } });

  const email = `rag-admin-${Date.now()}@example.com`;
  const password = 'StrongPassword!12345';

  let accessToken = '';
  let userId = '';

  const createdSourceIds: string[] = [];

  beforeAll(async () => {
    // Create admin user
    const { data: created, error: createErr } = await adminDb.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (createErr) throw createErr;
    userId = created.user?.id || '';

    const { data: session, error: signInErr } = await anonDb.auth.signInWithPassword({ email, password });
    if (signInErr) throw signInErr;
    accessToken = session.session?.access_token || '';

    // Allowlist this user as admin for approve endpoint
    process.env.AKIOR_ADMIN_EMAILS = email;
  });

  afterAll(async () => {
    // Cleanup sources/chunks/vectors created by tests.
    if (createdSourceIds.length > 0) {
      const { data: chunkRows } = await adminDb.from('chunks').select('chunk_id').in('source_id', createdSourceIds);
      const chunkIds = (chunkRows || []).map((r: any) => r.chunk_id);

      if (chunkIds.length > 0) {
        await adminDb.from('vectors').delete().in('chunk_id', chunkIds);
      }

      await adminDb.from('chunks').delete().in('source_id', createdSourceIds);
      await adminDb.from('source_versions').delete().in('source_id', createdSourceIds);
      await adminDb.from('sources').delete().in('id', createdSourceIds);
    }

    if (userId) {
      await adminDb.auth.admin.deleteUser(userId);
    }
  });

  it('1) upload doc → pending', async () => {
    const file = new File(['AKIOR RAG Test Doc\n\nThis document states: the launch codename is BLUEBIRD.\n'], 'rag-test.txt', {
      type: 'text/plain',
    });

    const form = new FormData();
    form.append('file', file);
    form.append('title', 'RAG Test Doc');
    form.append('classification', 'public');

    const req = new NextRequest('http://localhost/api/admin/kb/upload', {
      method: 'POST',
      headers: authHeaders(accessToken),
      body: form,
    });

    const res = await uploadRoute.POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect((json as any).ok).toBe(true);
    expect((json as any).status).toBe('pending');
    expect(typeof (json as any).source_id).toBe('string');

    createdSourceIds.push((json as any).source_id);
  });

  it('2) approve → indexed (vectors_total > 0) and status OFF→ON', async () => {
    // Initially should be OFF (approved=0) or DEGRADED if something else exists.
    const s0 = await statusRoute.GET(new NextRequest('http://localhost/api/rag/status'));
    const j0: any = await s0.json();
    expect(j0.ok).toBe(true);
    expect(['OFF', 'DEGRADED', 'ON']).toContain(j0.data.rag_state);

    const sourceId = createdSourceIds[0];
    const req = new NextRequest(`http://localhost/api/admin/kb/${sourceId}/approve`, {
      method: 'POST',
      headers: authHeaders(accessToken),
    });

    const res = await approveRoute.POST(req, { params: Promise.resolve({ source_id: sourceId }) });
    const json: any = await res.json();

    expect(res.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.indexed.vectors).toBeGreaterThan(0);

    const s1 = await statusRoute.GET(new NextRequest('http://localhost/api/rag/status'));
    const j1: any = await s1.json();
    expect(j1.ok).toBe(true);
    expect(j1.data.vectors_total).toBeGreaterThan(0);
    expect(j1.data.rag_state).toBe('ON');
  });

  it('3) query returns citations referencing that source', async () => {
    const req = new NextRequest('http://localhost/api/rag/test-query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders(accessToken) },
      body: JSON.stringify({ q: 'What is the launch codename?', topK: 5 }),
    });

    const res = await testQueryRoute.POST(req);
    const json: any = await res.json();

    expect(res.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.hits.length).toBeGreaterThan(0);
    expect(json.hits[0].source_id).toBe(createdSourceIds[0]);
    expect(typeof json.hits[0].chunk_id).toBe('string');
  });

  it('4) restricted doc cannot be retrieved by public role', async () => {
    const restrictedText = 'RESTRICTED: the secret codename is NIGHTHAWK.';

    // Upload restricted
    const file = new File([restrictedText], 'restricted.txt', { type: 'text/plain' });
    const form = new FormData();
    form.append('file', file);
    form.append('title', 'Restricted Doc');
    form.append('classification', 'restricted');
    form.append('restricted_only_me', 'true');

    const upReq = new NextRequest('http://localhost/api/admin/kb/upload', {
      method: 'POST',
      headers: authHeaders(accessToken),
      body: form,
    });
    const upRes = await uploadRoute.POST(upReq);
    const upJson: any = await upRes.json();
    expect(upRes.status).toBe(200);
    createdSourceIds.push(upJson.source_id);

    // Approve restricted
    const apReq = new NextRequest(`http://localhost/api/admin/kb/${upJson.source_id}/approve`, {
      method: 'POST',
      headers: authHeaders(accessToken),
    });
    const apRes = await approveRoute.POST(apReq, { params: Promise.resolve({ source_id: upJson.source_id }) });
    const apJson: any = await apRes.json();
    expect(apRes.status).toBe(200);
    expect(apJson.indexed.vectors).toBeGreaterThan(0);

    // Public test-query (no auth) must not retrieve restricted
    const pubReq = new NextRequest('http://localhost/api/rag/test-query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: 'What is the secret codename?', topK: 5 }),
    });

    const pubRes = await testQueryRoute.POST(pubReq);
    const pubJson: any = await pubRes.json();

    expect(pubRes.status).toBe(200);
    expect(pubJson.ok).toBe(true);
    expect(pubJson.role).toBe('public');
    expect(pubJson.hits.length).toBe(0);
  });

  it('5) /api/ask returns answer + citations', async () => {
    const req = new NextRequest('http://localhost/api/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders(accessToken) },
      body: JSON.stringify({ q: 'What is the launch codename?', topK: 5 }),
    });

    const res = await askRoute.POST(req);
    const json: any = await res.json();

    expect(res.status).toBe(200);
    expect(typeof json.answer).toBe('string');
    expect(Array.isArray(json.citations)).toBe(true);
    expect(json.citations.length).toBeGreaterThan(0);
  });

  it('6) audit + retrieval events created', async () => {
    const { count: auditCount } = await adminDb
      .from('audit_events')
      .select('*', { count: 'exact', head: true })
      .eq('actor_id', userId);

    const { count: retrievalCount } = await adminDb
      .from('retrieval_events')
      .select('*', { count: 'exact', head: true })
      .eq('actor_id', userId);

    expect((auditCount || 0)).toBeGreaterThan(0);
    expect((retrievalCount || 0)).toBeGreaterThan(0);
  });
});