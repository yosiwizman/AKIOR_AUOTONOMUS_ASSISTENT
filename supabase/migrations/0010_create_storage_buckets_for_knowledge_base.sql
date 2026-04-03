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