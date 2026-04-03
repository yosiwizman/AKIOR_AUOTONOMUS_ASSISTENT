-- Drop existing policies if they exist
DROP POLICY IF EXISTS "kb_raw_upload_policy" ON storage.objects;
DROP POLICY IF EXISTS "kb_raw_read_policy" ON storage.objects;
DROP POLICY IF EXISTS "kb_raw_update_policy" ON storage.objects;
DROP POLICY IF EXISTS "kb_raw_delete_policy" ON storage.objects;
DROP POLICY IF EXISTS "kb_parsed_upload_policy" ON storage.objects;
DROP POLICY IF EXISTS "kb_parsed_read_policy" ON storage.objects;
DROP POLICY IF EXISTS "kb_parsed_update_policy" ON storage.objects;
DROP POLICY IF EXISTS "kb_parsed_delete_policy" ON storage.objects;

-- RLS Policy: Authenticated users can upload to kb-raw bucket
CREATE POLICY "kb_raw_upload_policy" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'kb-raw');

-- RLS Policy: Authenticated users can read their own files in kb-raw
CREATE POLICY "kb_raw_read_policy" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'kb-raw' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

-- RLS Policy: Authenticated users can update their own files in kb-raw
CREATE POLICY "kb_raw_update_policy" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'kb-raw' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

-- RLS Policy: Authenticated users can delete their own files in kb-raw
CREATE POLICY "kb_raw_delete_policy" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'kb-raw' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

-- RLS Policy: Authenticated users can upload to kb-parsed bucket
CREATE POLICY "kb_parsed_upload_policy" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'kb-parsed');

-- RLS Policy: Authenticated users can read their own files in kb-parsed
CREATE POLICY "kb_parsed_read_policy" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'kb-parsed' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

-- RLS Policy: Authenticated users can update their own files in kb-parsed
CREATE POLICY "kb_parsed_update_policy" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'kb-parsed' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

-- RLS Policy: Authenticated users can delete their own files in kb-parsed
CREATE POLICY "kb_parsed_delete_policy" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'kb-parsed' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);