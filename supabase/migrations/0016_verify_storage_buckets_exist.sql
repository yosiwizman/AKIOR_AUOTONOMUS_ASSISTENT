-- Verify buckets exist
SELECT id, name, public, file_size_limit, created_at
FROM storage.buckets
WHERE id IN ('kb-raw', 'kb-parsed');