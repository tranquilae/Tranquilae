import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

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

// Simplified admin check for Edge Runtime compatibility
async function checkAdminAccessInline(userId: string): Promise<boolean> {
  try {
    // Check if user ID is in the allowed admin list from environment
    const allowedAdmins = process.env.ADMIN_USER_IDS?.split(',').map(id => id.trim()) || [];
    const superAdmins = process.env.SUPER_ADMIN_USER_IDS?.split(',').map(id => id.trim()) || [];
    
    return allowedAdmins.includes(userId) || superAdmins.includes(userId);
  } catch (error) {
    console.error('Error in checkAdminAccess:', error);
    return false;
  }
}

async function verifyAuth(request: NextRequest, response: NextResponse): Promise<string | null> {
  try {
    // Create SSR client for middleware
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
                           process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!;
    
    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              request.cookies.set(name, value);
              response.cookies.set({ name, value, ...options });
            });
          },
        },
      }
    );

    // Get the current session
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Middleware - Session retrieval error:', error);
      return null;
    }

    if (!session || !session.user) {
      console.log('Middleware - No session found for path:', request.nextUrl.pathname);
      return null;
    }

    console.log('Middleware - Session found for user:', session.user.id, 'accessing:', request.nextUrl.pathname);
    return session.user.id;
  } catch (error) {
    console.error('Middleware - Auth verification error:', error);
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
    const userId = await verifyAuth(request, response);

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
        // Prevent redirect loops - if already coming from auth, allow through temporarily
        const referer = request.headers.get('referer');
        const isFromAuth = referer && (referer.includes('/auth/login') || referer.includes('/auth/callback'));
        
        if (isFromAuth) {
          console.log('Middleware - Allowing temporary access from auth flow for:', pathname);
          // Allow through but log it for debugging
          response.headers.set('x-temp-access', 'true');
        } else {
          // Web routes redirect to login
          console.log('Middleware - Redirecting to login, no session for:', pathname);
          const loginUrl = new URL('/auth/login', request.url);
          loginUrl.searchParams.set('redirectTo', pathname);
          return NextResponse.redirect(loginUrl);
        }
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
    const userId = await verifyAuth(request, response);
    
    if (!userId) {
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('redirectTo', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Check if user has admin access
    const isAdmin = await checkAdminAccessInline(userId);
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
