
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'memories' 
AND table_schema = 'public';
