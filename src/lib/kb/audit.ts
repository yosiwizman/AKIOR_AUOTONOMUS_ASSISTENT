import type { SupabaseClient } from '@supabase/supabase-js';
import { redactJson } from './redaction';
import { sha256Hex } from './hash';

type Json = null | boolean | number | string | Json[] | { [key: string]: Json };

export async function writeAuditEvent(opts: {
  db: SupabaseClient;
  actorId: string | null;
  traceId: string;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  payload: Json;
}) {
  const payloadRedacted = redactJson(opts.payload);

  await opts.db.from('audit_events').insert({
    actor_id: opts.actorId,
    trace_id: opts.traceId,
    action: opts.action,
    resource_type: opts.resourceType,
    resource_id: opts.resourceId ?? null,
    payload_json: payloadRedacted,
  });
}

export async function writeRetrievalEvent(opts: {
  db: SupabaseClient;
  actorId: string;
  traceId: string;
  query: string;
  topk: number;
  sourcesUsed: string[];
}) {
  await opts.db.from('retrieval_events').insert({
    actor_id: opts.actorId,
    trace_id: opts.traceId,
    query_hash: sha256Hex(opts.query),
    topk: opts.topk,
    sources_used: opts.sourcesUsed,
  });
}