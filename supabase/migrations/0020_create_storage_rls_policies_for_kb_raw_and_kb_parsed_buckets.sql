-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "kb_raw_upload_policy" ON storage.objects;
DROP POLICY IF EXISTS "kb_raw_read_policy" ON storage.objects;
DROP POLICY IF EXISTS "kb_raw_update_policy" ON storage.objects;
DROP POLICY IF EXISTS "kb_raw_delete_policy" ON storage.objects;
DROP POLICY IF EXISTS "kb_parsed_upload_policy" ON storage.objects;
DROP POLICY IF EXISTS "kb_parsed_read_policy" ON storage.objects;
DROP POLICY IF EXISTS "kb_parsed_update_policy" ON storage.objects;
DROP POLICY IF EXISTS "kb_parsed_delete_policy" ON storage.objects;

-- KB-RAW BUCKET POLICIES
CREATE POLICY "kb_raw_upload_policy" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'kb-raw');

CREATE POLICY "kb_raw_read_policy" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'kb-raw' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "kb_raw_update_policy" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'kb-raw' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "kb_raw_delete_policy" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'kb-raw' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

-- KB-PARSED BUCKET POLICIES
CREATE POLICY "kb_parsed_upload_policy" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'kb-parsed');

CREATE POLICY "kb_parsed_read_policy" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'kb-parsed' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "kb_parsed_update_policy" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'kb-parsed' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "kb_parsed_delete_policy" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'kb-parsed' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);