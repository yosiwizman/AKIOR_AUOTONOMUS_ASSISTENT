-- Check if policies exist
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
  AND policyname LIKE 'kb_%'
ORDER BY policyname;