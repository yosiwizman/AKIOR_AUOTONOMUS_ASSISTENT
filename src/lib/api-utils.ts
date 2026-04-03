/**
 * API Utilities
 * Enterprise-grade API helpers for consistent error handling
 */

import { NextResponse } from 'next/server';

// Standard API error response
export interface ApiError {
  error: string;
  code?: string;
  details?: unknown;
}

// Standard API success response
export interface ApiSuccess<T = unknown> {
  data: T;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
  };
}

// Create error response
export function apiError(
  message: string,
  status: number = 500,
  code?: string,
  details?: unknown
): NextResponse<ApiError> {
  const responseBody: ApiError = { error: message };
  
  if (code) {
    responseBody.code = code;
  }
  
  if (details) {
    responseBody.details = details;
  }
  
  return NextResponse.json(responseBody, { status });
}

// Create success response
export function apiSuccess<T>(
  data: T,
  status: number = 200,
  meta?: ApiSuccess['meta']
): NextResponse<ApiSuccess<T>> {
  const responseBody: ApiSuccess<T> = { data };
  
  if (meta) {
    responseBody.meta = meta;
  }
  
  return NextResponse.json(responseBody, { status });
}

// Validate UUID format
export function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

// Sanitize string input
export function sanitizeString(str: string, maxLength: number = 10000): string {
  return str.trim().slice(0, maxLength);
}

// Rate limiter class for more sophisticated rate limiting
export class RateLimiter {
  private store = new Map<string, { count: number; resetTime: number }>();
  private readonly limit: number;
  private readonly windowMs: number;

  constructor(limit: number = 60, windowMs: number = 60000) {
    this.limit = limit;
    this.windowMs = windowMs;
  }

  check(identifier: string): { allowed: boolean; remaining: number; resetIn: number } {
    const now = Date.now();
    const record = this.store.get(identifier);

    // Clean up old entries periodically
    if (this.store.size > 10000) {
      this.cleanup();
    }

    if (!record || now > record.resetTime) {
      this.store.set(identifier, { count: 1, resetTime: now + this.windowMs });
      return { allowed: true, remaining: this.limit - 1, resetIn: this.windowMs };
    }

    if (record.count >= this.limit) {
      return { 
        allowed: false, 
        remaining: 0, 
        resetIn: record.resetTime - now 
      };
    }

    record.count++;
    return { 
      allowed: true, 
      remaining: this.limit - record.count, 
      resetIn: record.resetTime - now 
    };
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, value] of this.store.entries()) {
      if (now > value.resetTime) {
        this.store.delete(key);
      }
    }
  }
}

// Global rate limiter instance
export const globalRateLimiter = new RateLimiter(60, 60000);

// Extract client IP from request
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }
  
  return 'unknown';
}

// Retry wrapper for external API calls
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error | undefined;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Don't retry on client errors (4xx)
      if (lastError.message.includes('4')) {
        throw lastError;
      }
      
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs * (attempt + 1)));
      }
    }
  }
  
  throw lastError;
}

// Timeout wrapper for async operations
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage: string = 'Operation timed out'
): Promise<T> {
  let timeoutId: NodeJS.Timeout;
  
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(errorMessage)), timeoutMs);
  });
  
  try {
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timeoutId!);
    return result;
  } catch (error) {
    clearTimeout(timeoutId!);
    throw error;
  }
}