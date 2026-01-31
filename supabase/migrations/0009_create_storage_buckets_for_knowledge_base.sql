-- Create storage buckets for knowledge base documents
-- kb-raw: stores original uploaded files
-- kb-parsed: stores parsed text content

-- Create kb-raw bucket for original files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'kb-raw',
  'kb-raw',
  false,
  15728640, -- 15MB limit
  ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'text/markdown', 'application/octet-stream']
)
ON CONFLICT (id) DO NOTHING;

-- Create kb-parsed bucket for parsed text
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'kb-parsed',
  'kb-parsed',
  false,
  15728640, -- 15MB limit
  ARRAY['text/plain']
)
ON CONFLICT (id) DO NOTHING;

-- Note: RLS policies for storage.objects need to be created through the Supabase Dashboard
-- or using a database connection with proper permissions.
-- See STORAGE_POLICIES.sql for the policy definitions.
