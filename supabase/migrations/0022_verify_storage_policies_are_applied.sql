-- Verify storage policies exist
SELECT policyname, cmd, roles
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
AND (policyname LIKE '%kb_raw%' OR policyname LIKE '%kb_parsed%')
ORDER BY policyname;