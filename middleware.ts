import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkAdminAccess } from './lib/supabase';

// Rate limiting storage (in-memory, consider Redis for production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Rate limiting configuration
const RATE_LIMITS = {
  api: { requests: 100, window: 60 * 1000 }, // 100 requests per minute
  auth: { requests: 5, window: 5 * 60 * 1000 }, // 5 requests per 5 minutes
  checkout: { requests: 3, window: 60 * 1000 }, // 3 requests per minute
};

function getRateLimitKey(ip: string, path: string): string {
  return `${ip}:${path}`;
}

function isRateLimited(key: string, limit: { requests: number; window: number }): boolean {
  const now = Date.now();
  const stored = rateLimitStore.get(key);

  if (!stored || now > stored.resetTime) {
    // Reset or initialize
    rateLimitStore.set(key, { count: 1, resetTime: now + limit.window });
    return false;
  }

  if (stored.count >= limit.requests) {
    return true;
  }

  // Increment count
  stored.count++;
  return false;
}

async function verifyAuth(request: NextRequest): Promise<string | null> {
  try {
    // Get the session token from cookies
    const token = request.cookies.get('sb-access-token')?.value;
    
    if (!token) {
      return null;
    }

    // Verify with Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return null;
    }

    return user.id;
  } catch (error) {
    console.error('Auth verification error:', error);
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ip = request.ip || request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';

  // Security headers (additional to Next.js config)
  const response = NextResponse.next();
  
  // Add security headers to all responses
  response.headers.set('X-DNS-Prefetch-Control', 'off');
  response.headers.set('X-Download-Options', 'noopen');
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  
  // Rate limiting for API routes
  if (pathname.startsWith('/api/')) {
    let rateLimit = RATE_LIMITS.api;
    let rateLimitPath = 'api';

    // Special rate limits for specific endpoints
    if (pathname.startsWith('/api/auth/')) {
      rateLimit = RATE_LIMITS.auth;
      rateLimitPath = 'auth';
    } else if (pathname.startsWith('/api/checkout/')) {
      rateLimit = RATE_LIMITS.checkout;
      rateLimitPath = 'checkout';
    }

    const rateLimitKey = getRateLimitKey(ip, rateLimitPath);
    
    if (isRateLimited(rateLimitKey, rateLimit)) {
      return new NextResponse(
        JSON.stringify({
          error: 'Too many requests',
          retryAfter: Math.ceil(rateLimit.window / 1000)
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(Math.ceil(rateLimit.window / 1000)),
            'X-RateLimit-Limit': String(rateLimit.requests),
            'X-RateLimit-Remaining': '0',
          }
        }
      );
    }

    // Add rate limit headers to successful responses
    const stored = rateLimitStore.get(rateLimitKey);
    if (stored) {
      response.headers.set('X-RateLimit-Limit', String(rateLimit.requests));
      response.headers.set('X-RateLimit-Remaining', String(Math.max(0, rateLimit.requests - stored.count)));
      response.headers.set('X-RateLimit-Reset', String(Math.ceil(stored.resetTime / 1000)));
    }
  }

  // Protected routes requiring authentication
  const protectedRoutes = [
    '/dashboard',
    '/onboarding',
    '/account',
    '/settings'
  ];

  const protectedApiRoutes = [
    '/api/checkout',
    '/api/onboarding',
    '/api/user'
  ];

  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const isProtectedApiRoute = protectedApiRoutes.some(route => pathname.startsWith(route));

  if (isProtectedRoute || isProtectedApiRoute) {
    const userId = await verifyAuth(request);

    if (!userId) {
      if (isProtectedApiRoute) {
        // API routes return JSON error
        return new NextResponse(
          JSON.stringify({ error: 'Unauthorized', code: 'AUTH_REQUIRED' }),
          {
            status: 401,
            headers: {
              'Content-Type': 'application/json',
              'WWW-Authenticate': 'Bearer'
            }
          }
        );
      } else {
        // Web routes redirect to login
        const loginUrl = new URL('/auth/login', request.url);
        loginUrl.searchParams.set('redirectTo', pathname);
        return NextResponse.redirect(loginUrl);
      }
    }

    // Add user ID to headers for API routes
    if (isProtectedApiRoute) {
      response.headers.set('x-user-id', userId);
    }
  }

  // Webhook routes (bypass auth but verify source)
  if (pathname.startsWith('/api/webhooks/')) {
    // Add specific security headers for webhooks
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    
    // Add IP to headers for webhook logging
    response.headers.set('x-real-ip', ip);
  }

  // Admin routes with proper authentication and role checking
  if (pathname.startsWith('/admin')) {
    const userId = await verifyAuth(request);
    
    if (!userId) {
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('redirectTo', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Check if user has admin access
    const isAdmin = await checkAdminAccess(userId);
    if (!isAdmin) {
      return new NextResponse('Access Denied - Admin privileges required', { status: 403 });
    }

    // Add admin user ID to headers for API routes
    response.headers.set('x-admin-id', userId);
  }

  // Block certain file extensions for security
  const blockedExtensions = ['.env', '.git', '.log', '.backup'];
  const hasBlockedExtension = blockedExtensions.some(ext => pathname.endsWith(ext));
  
  if (hasBlockedExtension) {
    return new NextResponse('Not Found', { status: 404 });
  }

  // Add CSRF protection headers for state-changing operations
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
    const origin = request.headers.get('origin');
    const host = request.headers.get('host');
    
    // Check for CSRF (simple origin check)
    if (origin && host) {
      const originHost = new URL(origin).host;
      if (originHost !== host) {
        return new NextResponse('Forbidden', { status: 403 });
      }
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
