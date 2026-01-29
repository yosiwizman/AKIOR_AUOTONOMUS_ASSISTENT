'use client';

/**
 * Authentication Context
 * Enterprise-grade auth state management with error handling
 */

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { Session, User, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  error: string | null;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  isLoading: true,
  error: null,
  signOut: async () => {},
  refreshSession: async () => {},
  clearError: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Handle auth errors
  const handleAuthError = useCallback((err: AuthError | Error) => {
    console.error('Auth error:', err);
    const message = err instanceof AuthError 
      ? err.message 
      : 'An authentication error occurred';
    setError(message);
  }, []);

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          handleAuthError(error);
          return;
        }

        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
        }
      } catch (err) {
        if (mounted) {
          handleAuthError(err instanceof Error ? err : new Error('Failed to initialize auth'));
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
        setError(null);

        // Handle specific auth events
        switch (event) {
          case 'SIGNED_OUT':
            // Clear any cached data
            break;
          case 'TOKEN_REFRESHED':
            // Session was refreshed
            break;
          case 'USER_UPDATED':
            // User data was updated
            break;
          case 'PASSWORD_RECOVERY':
            // Password recovery initiated
            break;
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [handleAuthError]);

  // Sign out
  const signOut = useCallback(async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        handleAuthError(error);
        return;
      }

      setSession(null);
      setUser(null);
    } catch (err) {
      handleAuthError(err instanceof Error ? err : new Error('Failed to sign out'));
    } finally {
      setIsLoading(false);
    }
  }, [handleAuthError]);

  // Refresh session
  const refreshSession = useCallback(async () => {
    try {
      const { data: { session }, error } = await supabase.auth.refreshSession();
      
      if (error) {
        handleAuthError(error);
        return;
      }

      setSession(session);
      setUser(session?.user ?? null);
    } catch (err) {
      handleAuthError(err instanceof Error ? err : new Error('Failed to refresh session'));
    }
  }, [handleAuthError]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return (
    <AuthContext.Provider value={{ 
      session, 
      user, 
      isLoading, 
      error,
      signOut, 
      refreshSession,
      clearError,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};
