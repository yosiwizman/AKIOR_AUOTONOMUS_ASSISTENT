-- Verify buckets were created
SELECT id, name, public, file_size_limit 
FROM storage.buckets 
WHERE id IN ('kb-raw', 'kb-parsed');