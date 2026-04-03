import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { decrypt } from '@/lib/encryption';

export function getSupabaseAdmin(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ruftuoilatlzniuasoza.supabase.co';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export function getSupabaseAuthed(token: string): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ruftuoilatlzniuasoza.supabase.co';
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1ZnR1b2lsYXRsem5pdWFzb3phIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2NjUxNzEsImV4cCI6MjA4NTI0MTE3MX0.JqPbHquY6lF6I2sYPoNLJjpvwP3aEvmIjAL4llk-hJ0';

  return createClient(url, anonKey, {
    auth: { persistSession: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
}

export function getDbClientForAuth(token: string): SupabaseClient {
  return getSupabaseAdmin() || getSupabaseAuthed(token);
}

export async function getAgentSettings(db: SupabaseClient, userId: string): Promise<{
  agent_name: string;
  personality_prompt: string;
  voice_id: string;
  voice_speed: number;
  openai_api_key: string | null;
}> {
  const { data, error } = await db.from('agent_settings').select('*').eq('user_id', userId).single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching agent settings:', error);
  }

  if (data) {
    let decryptedApiKey: string | null = null;
    if (data.openai_api_key) {
      decryptedApiKey = decrypt(data.openai_api_key);
    }

    return {
      agent_name: data.agent_name || 'AKIOR',
      personality_prompt:
        data.personality_prompt ||
        'You are AKIOR, a helpful and knowledgeable AI assistant. You are professional, concise, and friendly.',
      voice_id: data.voice_id || 'alloy',
      voice_speed: data.voice_speed || 1.0,
      openai_api_key: decryptedApiKey,
    };
  }

  return {
    agent_name: 'AKIOR',
    personality_prompt: 'You are AKIOR, a helpful and knowledgeable AI assistant.',
    voice_id: 'alloy',
    voice_speed: 1.0,
    openai_api_key: null,
  };
}