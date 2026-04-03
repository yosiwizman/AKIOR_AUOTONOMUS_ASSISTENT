-- Check if there's a unique constraint on user_id
SELECT constraint_name, constraint_type 
FROM information_schema.table_constraints 
WHERE table_name = 'agent_settings' AND table_schema = 'public';