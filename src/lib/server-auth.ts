/**
 * Server-side Authentication Utilities
 * Verifies JWT tokens from Authorization header for secure API routes
 */

import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create a Supabase client for auth verification (uses anon key, not service role)
function getSupabaseAuthClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ruftuoilatlzniuasoza.supabase.co';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1ZnR1b2lsYXRsem5pdWFzb3phIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2NjUxNzEsImV4cCI6MjA4NTI0MTE3MX0.JqPbHquY6lF6I2sYPoNLJjpvwP3aEvmIjAL4llk-hJ0';
  
  return createClient(url, anonKey, { 
    auth: { persistSession: false } 
  });
}

export interface AuthResult {
  userId: string;
  email?: string;
}

export interface AuthError {
  error: string;
  status: number;
}

/**
 * Verify the JWT token from the Authorization header
 * Returns the authenticated user's ID or an error
 */
export async function verifyAuth(request: NextRequest): Promise<AuthResult | AuthError> {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader) {
    return { error: 'Authorization header required', status: 401 };
  }
  
  if (!authHeader.startsWith('Bearer ')) {
    return { error: 'Invalid authorization format. Use: Bearer <token>', status: 401 };
  }
  
  const token = authHeader.slice(7); // Remove 'Bearer ' prefix
  
  if (!token) {
    return { error: 'Token is required', status: 401 };
  }
  
  try {
    const supabase = getSupabaseAuthClient();
    
    // Verify the token by getting the user
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error) {
      console.error('Auth verification error:', error.message);
      return { error: 'Invalid or expired token', status: 401 };
    }
    
    if (!user) {
      return { error: 'User not found', status: 401 };
    }
    
    return {
      userId: user.id,
      email: user.email,
    };
  } catch (err) {
    console.error('Auth verification exception:', err);
    return { error: 'Authentication failed', status: 500 };
  }
}

/**
 * Type guard to check if result is an error
 */
export function isAuthError(result: AuthResult | AuthError): result is AuthError {
  return 'error' in result;
}
