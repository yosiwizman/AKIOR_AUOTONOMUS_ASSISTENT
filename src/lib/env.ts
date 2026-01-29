/**
 * Environment Variable Validation
 * Enterprise-grade environment configuration
 */

// Client-side environment variables (exposed to browser)
export const clientEnv = {
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ruftuoilatlzniuasoza.supabase.co',
  SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1ZnR1b2lsYXRsem5pdWFzb3phIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2NjUxNzEsImV4cCI6MjA4NTI0MTE3MX0.JqPbHquY6lF6I2sYPoNLJjpvwP3aEvmIjAL4llk-hJ0',
} as const;

// Server-side environment variables (never exposed to browser)
export function getServerEnv() {
  return {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || clientEnv.SUPABASE_URL,
  };
}

// Check if OpenAI is configured
export function isOpenAIConfigured(): boolean {
  return !!process.env.OPENAI_API_KEY;
}

// Check if Supabase admin is configured
export function isSupabaseAdminConfigured(): boolean {
  return !!process.env.SUPABASE_SERVICE_ROLE_KEY;
}

// Validate required environment variables for a feature
export function validateEnv(required: string[]): { valid: boolean; missing: string[] } {
  const missing: string[] = [];
  
  for (const key of required) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }
  
  return {
    valid: missing.length === 0,
    missing,
  };
}
