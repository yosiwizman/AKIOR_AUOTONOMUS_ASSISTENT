
-- Create storage buckets for knowledge base
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('kb-raw', 'kb-raw', false, 52428800, NULL),
  ('kb-parsed', 'kb-parsed', false, 52428800, NULL)
ON CONFLICT (id) DO NOTHING;
