-- Create storage buckets for knowledge base
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('kb-raw', 'kb-raw', false, 52428800, NULL),
  ('kb-parsed', 'kb-parsed', false, 52428800, NULL)
ON CONFLICT (id) DO NOTHING;

-- Note: Storage RLS policies need to be created via Supabase Dashboard
-- Go to Storage > Policies and create the following policies:
--
-- For kb-raw bucket:
-- 1. Policy name: "Authenticated users can upload to kb-raw"
--    Operation: INSERT
--    Target roles: authenticated
--    Policy definition: bucket_id = 'kb-raw'
--
-- 2. Policy name: "Authenticated users can read from kb-raw"
--    Operation: SELECT
--    Target roles: authenticated
--    Policy definition: bucket_id = 'kb-raw'
--
-- 3. Policy name: "Authenticated users can update kb-raw"
--    Operation: UPDATE
--    Target roles: authenticated
--    Policy definition: bucket_id = 'kb-raw'
--
-- 4. Policy name: "Authenticated users can delete from kb-raw"
--    Operation: DELETE
--    Target roles: authenticated
--    Policy definition: bucket_id = 'kb-raw'
--
-- Repeat the same 4 policies for kb-parsed bucket (replace 'kb-raw' with 'kb-parsed')
