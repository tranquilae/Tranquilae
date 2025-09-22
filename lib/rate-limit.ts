import { NextRequest } from 'next/server';

interface RateLimitResult {
  success: boolean;
  remaining?: number;
  reset?: number;
}

// In-memory store for rate limiting (use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Simple rate limiting implementation
 * In production, use Redis or a dedicated rate limiting service
 */
export async function rateLimit(
  request: NextRequest,
  identifier: string,
  maxRequests: number = 10,
  windowSeconds: number = 60
): Promise<RateLimitResult> {
  // Get client IP or user ID for rate limiting
  const clientIP = request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   request.ip || 
                   'unknown';

  const key = `${identifier}:${clientIP}`;
  const now = Date.now();
  const windowMs = windowSeconds * 1000;

  const existing = rateLimitStore.get(key);

  if (!existing || now > existing.resetTime) {
    // First request or window expired
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + windowMs
    });

    return {
      success: true,
      remaining: maxRequests - 1,
      reset: now + windowMs
    };
  }

  if (existing.count >= maxRequests) {
    // Rate limit exceeded
    return {
      success: false,
      remaining: 0,
      reset: existing.resetTime
    };
  }

  // Increment count
  existing.count++;
  rateLimitStore.set(key, existing);

  return {
    success: true,
    remaining: maxRequests - existing.count,
    reset: existing.resetTime
  };
}

/**
 * Clean up expired rate limit entries
 * Should be called periodically in production
 */
export function cleanupRateLimitStore() {
  const now = Date.now();
  
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

// Auto-cleanup every 5 minutes
if (typeof window === 'undefined') {
  setInterval(cleanupRateLimitStore, 5 * 60 * 1000);
}
