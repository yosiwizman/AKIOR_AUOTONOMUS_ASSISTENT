/**
 * Rate Limiting
 * 
 * Production: Uses Upstash Redis for distributed rate limiting
 * Development: Falls back to in-memory rate limiting
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// In-memory fallback for development
const inMemoryStore = new Map<string, { count: number; resetAt: number }>();

// Initialize Redis client if credentials are available
let redis: Redis | null = null;
let ratelimit: Ratelimit | null = null;

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });

  ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(20, '1 m'), // 20 requests per minute
    analytics: true,
    prefix: 'akior:ratelimit',
  });

  console.log('[rate-limit] Using Upstash Redis for distributed rate limiting');
} else {
  console.log('[rate-limit] Using in-memory rate limiting (development mode)');
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  reset?: number;
}

/**
 * Check rate limit for an identifier (IP address or user ID)
 */
export async function checkRateLimit(identifier: string): Promise<RateLimitResult> {
  // Use Redis-based rate limiting if available
  if (ratelimit) {
    try {
      const result = await ratelimit.limit(identifier);
      
      return {
        allowed: result.success,
        remaining: result.remaining,
        reset: result.reset,
      };
    } catch (error) {
      console.error('[rate-limit] Redis error, falling back to in-memory:', error);
      // Fall through to in-memory
    }
  }

  // In-memory fallback
  return checkRateLimitInMemory(identifier);
}

/**
 * In-memory rate limiting (for development or fallback)
 */
function checkRateLimitInMemory(identifier: string): RateLimitResult {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 20;

  const entry = inMemoryStore.get(identifier);

  if (!entry || now > entry.resetAt) {
    // New window
    inMemoryStore.set(identifier, {
      count: 1,
      resetAt: now + windowMs,
    });

    return {
      allowed: true,
      remaining: maxRequests - 1,
      reset: now + windowMs,
    };
  }

  if (entry.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      reset: entry.resetAt,
    };
  }

  entry.count++;
  inMemoryStore.set(identifier, entry);

  return {
    allowed: true,
    remaining: maxRequests - entry.count,
    reset: entry.resetAt,
  };
}

/**
 * Clean up old entries from in-memory store (called periodically)
 */
export function cleanupInMemoryStore(): void {
  if (ratelimit) return; // Skip if using Redis

  const now = Date.now();
  for (const [key, entry] of inMemoryStore.entries()) {
    if (now > entry.resetAt) {
      inMemoryStore.delete(key);
    }
  }
}

// Clean up every 5 minutes
if (!ratelimit) {
  setInterval(cleanupInMemoryStore, 5 * 60 * 1000);
}

/**
 * Check if Redis rate limiting is available
 */
export function isRedisRateLimitingAvailable(): boolean {
  return !!ratelimit;
}