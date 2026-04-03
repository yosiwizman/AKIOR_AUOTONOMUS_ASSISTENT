-- Update bucket file size limits to 50MB to match the upload route
UPDATE storage.buckets 
SET file_size_limit = 52428800 -- 50MB in bytes
WHERE id IN ('kb-raw', 'kb-parsed');