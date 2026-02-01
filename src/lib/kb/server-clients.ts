import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ruftuoilatlzniuasoza.supabase.co';
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1ZnR1b2lsYXRsem5pdWFzb3phIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2NjUxNzEsImV4cCI6MjA4NTI0MTE3MX0.JqPbHquY6lF6I2sYPoNLJjpvwP3aEvmIjAL4llk-hJ0';

type ExtraHeaders = Record<string, string>;

function buildHeaders(opts?: { token?: string; tenantId?: string }): ExtraHeaders {
  const headers: ExtraHeaders = {};
  if (opts?.token) headers.Authorization = `Bearer ${opts.token}`;
  if (opts?.tenantId) headers['x-tenant-id'] = opts.tenantId;
  return headers;
}

export function getSupabaseAnon(tenantId?: string): SupabaseClient {
  const headers = buildHeaders({ tenantId });
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
    global: Object.keys(headers).length ? { headers } : undefined,
  });
}

export function getSupabaseAuthed(token: string, tenantId?: string): SupabaseClient {
  const headers = buildHeaders({ token, tenantId });
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
    global: { headers },
  });
}

export function getSupabaseAdmin(tenantId?: string): SupabaseClient | null {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  console.log('[server-clients] getSupabaseAdmin called:', {
    has_service_key: !!serviceKey,
    key_length: serviceKey?.length || 0,
    key_prefix: serviceKey?.substring(0, 20) || 'none',
    tenant_id: tenantId,
  });
  
  if (!serviceKey) {
    console.error('[server-clients] SUPABASE_SERVICE_ROLE_KEY is not set');
    return null;
  }
  
  const headers = buildHeaders({ tenantId });
  const client = createClient(SUPABASE_URL, serviceKey, {
    auth: { persistSession: false },
    global: Object.keys(headers).length ? { headers } : undefined,
  });
  
  console.log('[server-clients] Admin client created successfully');
  return client;
}