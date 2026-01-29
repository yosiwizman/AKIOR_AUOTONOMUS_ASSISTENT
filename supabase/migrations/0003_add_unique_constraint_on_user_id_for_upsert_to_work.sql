-- Add unique constraint on user_id if it doesn't exist
ALTER TABLE public.agent_settings 
ADD CONSTRAINT agent_settings_user_id_unique UNIQUE (user_id);