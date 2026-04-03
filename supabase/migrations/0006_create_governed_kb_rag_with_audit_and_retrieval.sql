-- Governed Knowledge Base + RAG (admin-approved ingestion, chunking, embeddings, vector search)
-- SECURITY: RLS is enabled on ALL tables.

-- Ensure pgvector exists (already enabled in initial migration, but safe to re-run)
CREATE EXTENSION IF NOT EXISTS vector;

-- -----------------------------------------------------------------------------
-- Tables
-- -----------------------------------------------------------------------------

-- Sources: raw uploads + governance state
CREATE TABLE IF NOT EXISTS public.sources (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  classification TEXT NOT NULL DEFAULT 'public' CHECK (classification IN ('public', 'internal', 'restricted')),
  trust_level INTEGER NOT NULL DEFAULT 50,
  checksum TEXT NOT NULL,
  original_ref TEXT,
  title TEXT,
  mime_type TEXT,
  tenant_id TEXT NOT NULL DEFAULT 'default',
  acl_user_ids UUID[] NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  indexed_at TIMESTAMP WITH TIME ZONE NULL
);

-- Parsed + versioned representations
CREATE TABLE IF NOT EXISTS public.source_versions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  source_id UUID NOT NULL REFERENCES public.sources(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  parsed_ref TEXT NOT NULL,
  metadata_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(source_id, version)
);

-- Chunks
CREATE TABLE IF NOT EXISTS public.chunks (
  chunk_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  source_id UUID NOT NULL REFERENCES public.sources(id) ON DELETE CASCADE,
  source_version INTEGER NOT NULL,
  object_ref TEXT NOT NULL,
  text_hash TEXT NOT NULL,
  tenant_id TEXT NOT NULL DEFAULT 'default',
  classification TEXT NOT NULL CHECK (classification IN ('public', 'internal', 'restricted')),
  acl_user_ids UUID[] NULL,
  metadata_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vectors
CREATE TABLE IF NOT EXISTS public.vectors (
  vector_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chunk_id UUID NOT NULL REFERENCES public.chunks(chunk_id) ON DELETE CASCADE,
  embedding vector(256) NOT NULL,
  tenant_id TEXT NOT NULL DEFAULT 'default',
  classification TEXT NOT NULL CHECK (classification IN ('public', 'internal', 'restricted')),
  acl_user_ids UUID[] NULL,
  metadata_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit events (redacted payloads)
CREATE TABLE IF NOT EXISTS public.audit_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ts TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  actor_id UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID NULL,
  trace_id TEXT NOT NULL,
  payload_json JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- Retrieval events (query hashed)
CREATE TABLE IF NOT EXISTS public.retrieval_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ts TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  actor_id UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  query_hash TEXT NOT NULL,
  topk INTEGER NOT NULL,
  sources_used UUID[] NOT NULL DEFAULT '{}'::uuid[],
  trace_id TEXT NOT NULL
);

-- -----------------------------------------------------------------------------
-- RLS
-- -----------------------------------------------------------------------------

ALTER TABLE public.sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.source_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.retrieval_events ENABLE ROW LEVEL SECURITY;

-- Sources policies
DROP POLICY IF EXISTS sources_insert_own ON public.sources;
CREATE POLICY sources_insert_own ON public.sources
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS sources_select_own_or_approved_public ON public.sources;
CREATE POLICY sources_select_own_or_approved_public ON public.sources
FOR SELECT TO authenticated
USING (
  auth.uid() = created_by
  OR (status = 'approved' AND classification IN ('public','internal'))
);

DROP POLICY IF EXISTS sources_select_approved_public_anon ON public.sources;
CREATE POLICY sources_select_approved_public_anon ON public.sources
FOR SELECT TO anon
USING (status = 'approved' AND classification = 'public');

DROP POLICY IF EXISTS sources_update_own ON public.sources;
CREATE POLICY sources_update_own ON public.sources
FOR UPDATE TO authenticated
USING (auth.uid() = created_by);

DROP POLICY IF EXISTS sources_delete_own ON public.sources;
CREATE POLICY sources_delete_own ON public.sources
FOR DELETE TO authenticated
USING (auth.uid() = created_by);

-- Source versions policies (only owner of source)
DROP POLICY IF EXISTS source_versions_select_owner ON public.source_versions;
CREATE POLICY source_versions_select_owner ON public.source_versions
FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.sources s WHERE s.id = source_id AND s.created_by = auth.uid()));

DROP POLICY IF EXISTS source_versions_insert_owner ON public.source_versions;
CREATE POLICY source_versions_insert_owner ON public.source_versions
FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.sources s WHERE s.id = source_id AND s.created_by = auth.uid()));

DROP POLICY IF EXISTS source_versions_update_owner ON public.source_versions;
CREATE POLICY source_versions_update_owner ON public.source_versions
FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.sources s WHERE s.id = source_id AND s.created_by = auth.uid()));

DROP POLICY IF EXISTS source_versions_delete_owner ON public.source_versions;
CREATE POLICY source_versions_delete_owner ON public.source_versions
FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM public.sources s WHERE s.id = source_id AND s.created_by = auth.uid()));

-- Chunks policies
DROP POLICY IF EXISTS chunks_select_public_anon ON public.chunks;
CREATE POLICY chunks_select_public_anon ON public.chunks
FOR SELECT TO anon
USING (classification = 'public');

DROP POLICY IF EXISTS chunks_select_authed_by_classification_acl ON public.chunks;
CREATE POLICY chunks_select_authed_by_classification_acl ON public.chunks
FOR SELECT TO authenticated
USING (
  (classification IN ('public','internal') AND (acl_user_ids IS NULL OR auth.uid() = ANY(acl_user_ids)))
  OR (classification = 'restricted' AND acl_user_ids IS NOT NULL AND auth.uid() = ANY(acl_user_ids))
);

DROP POLICY IF EXISTS chunks_insert_owner ON public.chunks;
CREATE POLICY chunks_insert_owner ON public.chunks
FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.sources s WHERE s.id = source_id AND s.created_by = auth.uid()));

DROP POLICY IF EXISTS chunks_delete_owner ON public.chunks;
CREATE POLICY chunks_delete_owner ON public.chunks
FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM public.sources s WHERE s.id = source_id AND s.created_by = auth.uid()));

-- Vectors policies
DROP POLICY IF EXISTS vectors_select_public_anon ON public.vectors;
CREATE POLICY vectors_select_public_anon ON public.vectors
FOR SELECT TO anon
USING (classification = 'public');

DROP POLICY IF EXISTS vectors_select_authed_by_classification_acl ON public.vectors;
CREATE POLICY vectors_select_authed_by_classification_acl ON public.vectors
FOR SELECT TO authenticated
USING (
  (classification IN ('public','internal') AND (acl_user_ids IS NULL OR auth.uid() = ANY(acl_user_ids)))
  OR (classification = 'restricted' AND acl_user_ids IS NOT NULL AND auth.uid() = ANY(acl_user_ids))
);

DROP POLICY IF EXISTS vectors_insert_owner ON public.vectors;
CREATE POLICY vectors_insert_owner ON public.vectors
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.chunks c
    JOIN public.sources s ON s.id = c.source_id
    WHERE c.chunk_id = chunk_id
      AND s.created_by = auth.uid()
  )
);

DROP POLICY IF EXISTS vectors_delete_owner ON public.vectors;
CREATE POLICY vectors_delete_owner ON public.vectors
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.chunks c
    JOIN public.sources s ON s.id = c.source_id
    WHERE c.chunk_id = chunk_id
      AND s.created_by = auth.uid()
  )
);

-- Audit events policies: actor can see their own, authenticated can insert with actor_id=auth.uid()
DROP POLICY IF EXISTS audit_events_select_own ON public.audit_events;
CREATE POLICY audit_events_select_own ON public.audit_events
FOR SELECT TO authenticated
USING (actor_id = auth.uid());

DROP POLICY IF EXISTS audit_events_insert_authed ON public.audit_events;
CREATE POLICY audit_events_insert_authed ON public.audit_events
FOR INSERT TO authenticated
WITH CHECK (actor_id = auth.uid());

-- Retrieval events policies
DROP POLICY IF EXISTS retrieval_events_select_own ON public.retrieval_events;
CREATE POLICY retrieval_events_select_own ON public.retrieval_events
FOR SELECT TO authenticated
USING (actor_id = auth.uid());

DROP POLICY IF EXISTS retrieval_events_insert_authed ON public.retrieval_events;
CREATE POLICY retrieval_events_insert_authed ON public.retrieval_events
FOR INSERT TO authenticated
WITH CHECK (actor_id = auth.uid());

-- -----------------------------------------------------------------------------
-- Indexes
-- -----------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS sources_status_idx ON public.sources(status);
CREATE INDEX IF NOT EXISTS sources_created_by_idx ON public.sources(created_by);
CREATE INDEX IF NOT EXISTS sources_classification_idx ON public.sources(classification);

CREATE INDEX IF NOT EXISTS source_versions_source_id_idx ON public.source_versions(source_id);
CREATE INDEX IF NOT EXISTS chunks_source_id_idx ON public.chunks(source_id);
CREATE INDEX IF NOT EXISTS vectors_chunk_id_idx ON public.vectors(chunk_id);
CREATE INDEX IF NOT EXISTS vectors_embedding_idx ON public.vectors USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE INDEX IF NOT EXISTS audit_events_actor_id_idx ON public.audit_events(actor_id);
CREATE INDEX IF NOT EXISTS audit_events_resource_idx ON public.audit_events(resource_type, resource_id);

CREATE INDEX IF NOT EXISTS retrieval_events_actor_id_idx ON public.retrieval_events(actor_id);

-- -----------------------------------------------------------------------------
-- RPC: similarity search over governed KB vectors
-- Note: SECURITY INVOKER (default) so RLS still applies.
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.match_kb_vectors(
  query_embedding vector(256),
  match_count int,
  p_tenant_id text,
  p_classifications text[],
  p_actor_id uuid
)
RETURNS TABLE (
  vector_id uuid,
  chunk_id uuid,
  source_id uuid,
  source_version int,
  similarity float,
  chunk_metadata jsonb
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    v.vector_id,
    v.chunk_id,
    c.source_id,
    c.source_version,
    1 - (v.embedding <=> query_embedding) as similarity,
    c.metadata_json as chunk_metadata
  FROM public.vectors v
  JOIN public.chunks c ON c.chunk_id = v.chunk_id
  JOIN public.sources s ON s.id = c.source_id
  WHERE v.tenant_id = p_tenant_id
    AND v.classification = ANY(p_classifications)
    AND s.status = 'approved'
    AND (
      v.acl_user_ids IS NULL
      OR (p_actor_id IS NOT NULL AND p_actor_id = ANY(v.acl_user_ids))
    )
  ORDER BY v.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;