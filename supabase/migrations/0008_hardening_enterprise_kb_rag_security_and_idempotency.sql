-- Enterprise hardening for governed KB + RAG
-- Goals:
-- - Enforce tenant isolation in RLS
-- - Ensure approved-only retrieval
-- - Prevent accidental RPC bypass (SECURITY INVOKER + server-derived auth)
-- - Add idempotency/dedupe constraints
-- - Add explicit embedding dimension check

-- -----------------------------------------------------------------------------
-- Helper: derive tenant from request headers (server must forward x-tenant-id)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.current_tenant_id()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(NULLIF((current_setting('request.headers', true)::jsonb ->> 'x-tenant-id'), ''), 'default');
$$;

-- -----------------------------------------------------------------------------
-- Constraints / indexes for idempotency
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  -- Unique checksum per tenant + classification (de-dupe sources)
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'sources_tenant_classification_checksum_uniq'
  ) THEN
    ALTER TABLE public.sources
      ADD CONSTRAINT sources_tenant_classification_checksum_uniq
      UNIQUE (tenant_id, classification, checksum);
  END IF;

  -- Prevent duplicate chunk materialization for the same source version
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chunks_source_version_text_hash_uniq'
  ) THEN
    ALTER TABLE public.chunks
      ADD CONSTRAINT chunks_source_version_text_hash_uniq
      UNIQUE (source_id, source_version, text_hash);
  END IF;

  -- One vector per chunk
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'vectors_chunk_id_uniq'
  ) THEN
    ALTER TABLE public.vectors
      ADD CONSTRAINT vectors_chunk_id_uniq
      UNIQUE (chunk_id);
  END IF;

  -- Explicit embedding dimension check (defense-in-depth)
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'vectors_embedding_dim_check'
  ) THEN
    ALTER TABLE public.vectors
      ADD CONSTRAINT vectors_embedding_dim_check
      CHECK (vector_dims(embedding) = 256);
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- RLS policy hardening (tenant isolation + approved-only retrieval)
-- -----------------------------------------------------------------------------

-- SOURCES
DROP POLICY IF EXISTS sources_insert_own ON public.sources;
CREATE POLICY sources_insert_own ON public.sources
FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = created_by
  AND tenant_id = public.current_tenant_id()
);

DROP POLICY IF EXISTS sources_select_own_or_approved_public ON public.sources;
CREATE POLICY sources_select_own_or_approved_public ON public.sources
FOR SELECT TO authenticated
USING (
  tenant_id = public.current_tenant_id()
  AND (
    auth.uid() = created_by
    OR (status = 'approved' AND classification IN ('public','internal'))
    OR (status = 'approved' AND classification = 'restricted' AND acl_user_ids IS NOT NULL AND auth.uid() = ANY(acl_user_ids))
  )
);

DROP POLICY IF EXISTS sources_select_approved_public_anon ON public.sources;
CREATE POLICY sources_select_approved_public_anon ON public.sources
FOR SELECT TO anon
USING (
  tenant_id = public.current_tenant_id()
  AND status = 'approved'
  AND classification = 'public'
);

DROP POLICY IF EXISTS sources_update_own ON public.sources;
CREATE POLICY sources_update_own ON public.sources
FOR UPDATE TO authenticated
USING (
  auth.uid() = created_by
  AND tenant_id = public.current_tenant_id()
);

DROP POLICY IF EXISTS sources_delete_own ON public.sources;
CREATE POLICY sources_delete_own ON public.sources
FOR DELETE TO authenticated
USING (
  auth.uid() = created_by
  AND tenant_id = public.current_tenant_id()
);

-- SOURCE_VERSIONS
DROP POLICY IF EXISTS source_versions_select_owner ON public.source_versions;
CREATE POLICY source_versions_select_owner ON public.source_versions
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.sources s
    WHERE s.id = source_id
      AND s.created_by = auth.uid()
      AND s.tenant_id = public.current_tenant_id()
  )
);

DROP POLICY IF EXISTS source_versions_insert_owner ON public.source_versions;
CREATE POLICY source_versions_insert_owner ON public.source_versions
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.sources s
    WHERE s.id = source_id
      AND s.created_by = auth.uid()
      AND s.tenant_id = public.current_tenant_id()
  )
);

DROP POLICY IF EXISTS source_versions_update_owner ON public.source_versions;
CREATE POLICY source_versions_update_owner ON public.source_versions
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.sources s
    WHERE s.id = source_id
      AND s.created_by = auth.uid()
      AND s.tenant_id = public.current_tenant_id()
  )
);

DROP POLICY IF EXISTS source_versions_delete_owner ON public.source_versions;
CREATE POLICY source_versions_delete_owner ON public.source_versions
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.sources s
    WHERE s.id = source_id
      AND s.created_by = auth.uid()
      AND s.tenant_id = public.current_tenant_id()
  )
);

-- CHUNKS
DROP POLICY IF EXISTS chunks_select_public_anon ON public.chunks;
CREATE POLICY chunks_select_public_anon ON public.chunks
FOR SELECT TO anon
USING (
  tenant_id = public.current_tenant_id()
  AND classification = 'public'
  AND EXISTS (
    SELECT 1
    FROM public.sources s
    WHERE s.id = source_id
      AND s.status = 'approved'
      AND s.tenant_id = public.current_tenant_id()
  )
);

DROP POLICY IF EXISTS chunks_select_authed_by_classification_acl ON public.chunks;
CREATE POLICY chunks_select_authed_by_classification_acl ON public.chunks
FOR SELECT TO authenticated
USING (
  tenant_id = public.current_tenant_id()
  AND EXISTS (
    SELECT 1
    FROM public.sources s
    WHERE s.id = source_id
      AND s.status = 'approved'
      AND s.tenant_id = public.current_tenant_id()
  )
  AND (
    (classification IN ('public','internal') AND (acl_user_ids IS NULL OR auth.uid() = ANY(acl_user_ids)))
    OR (classification = 'restricted' AND acl_user_ids IS NOT NULL AND auth.uid() = ANY(acl_user_ids))
  )
);

DROP POLICY IF EXISTS chunks_insert_owner ON public.chunks;
CREATE POLICY chunks_insert_owner ON public.chunks
FOR INSERT TO authenticated
WITH CHECK (
  tenant_id = public.current_tenant_id()
  AND EXISTS (
    SELECT 1
    FROM public.sources s
    WHERE s.id = source_id
      AND s.created_by = auth.uid()
      AND s.tenant_id = public.current_tenant_id()
  )
);

DROP POLICY IF EXISTS chunks_delete_owner ON public.chunks;
CREATE POLICY chunks_delete_owner ON public.chunks
FOR DELETE TO authenticated
USING (
  tenant_id = public.current_tenant_id()
  AND EXISTS (
    SELECT 1
    FROM public.sources s
    WHERE s.id = source_id
      AND s.created_by = auth.uid()
      AND s.tenant_id = public.current_tenant_id()
  )
);

-- VECTORS
DROP POLICY IF EXISTS vectors_select_public_anon ON public.vectors;
CREATE POLICY vectors_select_public_anon ON public.vectors
FOR SELECT TO anon
USING (
  tenant_id = public.current_tenant_id()
  AND classification = 'public'
  AND EXISTS (
    SELECT 1
    FROM public.chunks c
    JOIN public.sources s ON s.id = c.source_id
    WHERE c.chunk_id = chunk_id
      AND s.status = 'approved'
      AND s.tenant_id = public.current_tenant_id()
  )
);

DROP POLICY IF EXISTS vectors_select_authed_by_classification_acl ON public.vectors;
CREATE POLICY vectors_select_authed_by_classification_acl ON public.vectors
FOR SELECT TO authenticated
USING (
  tenant_id = public.current_tenant_id()
  AND EXISTS (
    SELECT 1
    FROM public.chunks c
    JOIN public.sources s ON s.id = c.source_id
    WHERE c.chunk_id = chunk_id
      AND s.status = 'approved'
      AND s.tenant_id = public.current_tenant_id()
  )
  AND (
    (classification IN ('public','internal') AND (acl_user_ids IS NULL OR auth.uid() = ANY(acl_user_ids)))
    OR (classification = 'restricted' AND acl_user_ids IS NOT NULL AND auth.uid() = ANY(acl_user_ids))
  )
);

DROP POLICY IF EXISTS vectors_insert_owner ON public.vectors;
CREATE POLICY vectors_insert_owner ON public.vectors
FOR INSERT TO authenticated
WITH CHECK (
  tenant_id = public.current_tenant_id()
  AND EXISTS (
    SELECT 1
    FROM public.chunks c
    JOIN public.sources s ON s.id = c.source_id
    WHERE c.chunk_id = chunk_id
      AND s.created_by = auth.uid()
      AND s.tenant_id = public.current_tenant_id()
  )
);

DROP POLICY IF EXISTS vectors_delete_owner ON public.vectors;
CREATE POLICY vectors_delete_owner ON public.vectors
FOR DELETE TO authenticated
USING (
  tenant_id = public.current_tenant_id()
  AND EXISTS (
    SELECT 1
    FROM public.chunks c
    JOIN public.sources s ON s.id = c.source_id
    WHERE c.chunk_id = chunk_id
      AND s.created_by = auth.uid()
      AND s.tenant_id = public.current_tenant_id()
  )
);

-- -----------------------------------------------------------------------------
-- RPC: similarity search (SECURITY INVOKER)
-- - Tenant derived from request header (defense-in-depth)
-- - Actor derived from auth.uid() (no caller-supplied actor)
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.match_kb_vectors(
  query_embedding vector(256),
  match_count int,
  p_classifications text[]
)
RETURNS TABLE (
  vector_id uuid,
  chunk_id uuid,
  source_id uuid,
  source_version int,
  similarity float,
  chunk_metadata jsonb
)
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
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
  WHERE v.tenant_id = public.current_tenant_id()
    AND c.tenant_id = public.current_tenant_id()
    AND s.tenant_id = public.current_tenant_id()
    AND v.classification = ANY(p_classifications)
    AND s.status = 'approved'
    AND (
      v.acl_user_ids IS NULL
      OR (auth.uid() IS NOT NULL AND auth.uid() = ANY(v.acl_user_ids))
    )
  ORDER BY v.embedding <=> query_embedding
  LIMIT match_count;
$$;
