'use client';

/**
 * Hook for making authenticated API calls
 * Automatically includes the Authorization header with the user's JWT token
 */

import { useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';

interface FetchOptions extends RequestInit {
  skipAuth?: boolean;
}

export function useAuthFetch() {
  const { session } = useAuth();

  const authFetch = useCallback(async (url: string, options: FetchOptions = {}) => {
    const { skipAuth, headers: customHeaders, ...restOptions } = options;
    
    const headers: HeadersInit = {
      ...customHeaders,
    };

    // Add Authorization header if we have a session and auth is not skipped
    if (!skipAuth && session?.access_token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${session.access_token}`;
    }

    return fetch(url, {
      ...restOptions,
      headers,
    });
  }, [session]);

  return { authFetch };
}

/**
 * Get auth headers for use outside of React components
 * This is useful for hooks that need to make API calls
 */
export function getAuthHeaders(accessToken: string | undefined): HeadersInit {
  const headers: HeadersInit = {};
  
  if (accessToken) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${accessToken}`;
  }
  
  return headers;
}
