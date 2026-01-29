-- Create interaction_logs table to record all AKIOR interactions (no UI history required)
CREATE TABLE IF NOT EXISTS public.interaction_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
  channel TEXT NOT NULL DEFAULT 'chat' CHECK (channel IN ('chat','voice','hud','public','unknown')),
  user_message TEXT NOT NULL,
  assistant_message TEXT NOT NULL,
  client_ip TEXT,
  country TEXT,
  region TEXT,
  city TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS (REQUIRED)
ALTER TABLE public.interaction_logs ENABLE ROW LEVEL SECURITY;

-- Policies: users can only access their own logs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'interaction_logs' AND policyname = 'interaction_logs_select_own'
  ) THEN
    CREATE POLICY "interaction_logs_select_own" ON public.interaction_logs
    FOR SELECT TO authenticated USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'interaction_logs' AND policyname = 'interaction_logs_insert_own'
  ) THEN
    CREATE POLICY "interaction_logs_insert_own" ON public.interaction_logs
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'interaction_logs' AND policyname = 'interaction_logs_delete_own'
  ) THEN
    CREATE POLICY "interaction_logs_delete_own" ON public.interaction_logs
    FOR DELETE TO authenticated USING (auth.uid() = user_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS interaction_logs_user_id_idx ON public.interaction_logs(user_id);
CREATE INDEX IF NOT EXISTS interaction_logs_created_at_idx ON public.interaction_logs(created_at DESC);