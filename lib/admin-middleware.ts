/**
 * Admin Middleware for Role-Based Access Control
 * Provides authentication and authorization for admin panel routes
 */

import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getServerSession, checkAdminAccess } from './supabase';

export type UserRole = 'user' | 'admin' | 'super_admin';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
  status: 'active' | 'suspended';
}

export interface AdminContext {
  user: AuthenticatedUser;
  supabase: ReturnType<typeof createServerClient>;
}

/**
 * Create Supabase client with service role for admin operations (Updated JWT)
 */
export function createAdminSupabaseClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookies().get(name)?.value;
        },
      },
      auth: {
        // Service role doesn't need refresh
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false
      },
      global: {
        headers: {
          'X-Client-Info': 'tranquilae-admin-middleware@2024'
        }
      }
    }
  );
}

/**
 * Create Supabase client for authenticated admin user (Updated JWT)
 */
export function createAuthenticatedSupabaseClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookies().get(name)?.value;
        },
      },
      auth: {
        // Enable modern auth features
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce'
      },
      global: {
        headers: {
          'X-Client-Info': 'tranquilae-admin-auth@2024'
        }
      }
    }
  );
}

/**
 * Get current authenticated user with role information (Enhanced JWT)
 */
export async function getCurrentUser(supabase: ReturnType<typeof createServerClient>, request?: NextRequest): Promise<AuthenticatedUser | null> {
  try {
    // First try to get user via server session if request provided
    if (request) {
      const serverSession = await getServerSession(request);
      if (serverSession.user) {
        const profile = await getUserProfile(supabase, serverSession.user.id);
        if (profile) {
          return profile;
        }
      }
    }

    // Fallback to standard auth.getUser
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return null;
    }

    return await getUserProfile(supabase, user.id);
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

/**
 * Helper function to get user profile with JWT verification
 */
async function getUserProfile(supabase: ReturnType<typeof createServerClient>, userId: string): Promise<AuthenticatedUser | null> {
  try {
    // Use enhanced admin access check with JWT verification
    const hasAccess = await checkAdminAccess(userId);
    if (!hasAccess) {
      return null;
    }

    // Get user profile with role information
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('id, email, role, status')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      return null;
    }

    return {
      id: profile.id,
      email: profile.email,
      role: profile.role as UserRole,
      status: profile.status as 'active' | 'suspended',
    };
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
}

/**
 * Check if user has admin access (admin or super_admin)
 */
export function hasAdminAccess(user: AuthenticatedUser): boolean {
  return user.status === 'active' && ['admin', 'super_admin'].includes(user.role);
}

/**
 * Check if user has super admin access
 */
export function hasSuperAdminAccess(user: AuthenticatedUser): boolean {
  return user.status === 'active' && user.role === 'super_admin';
}

/**
 * Middleware wrapper for admin routes
 */
export function withAdminAuth(
  handler: (request: NextRequest, context: AdminContext) => Promise<NextResponse> | NextResponse,
  options: { requireSuperAdmin?: boolean } = {}
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      const supabase = createAuthenticatedSupabaseClient();
      const user = await getCurrentUser(supabase);

      if (!user) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }

      if (user.status === 'suspended') {
        return NextResponse.json(
          { error: 'Account suspended' },
          { status: 403 }
        );
      }

      const requiredAccess = options.requireSuperAdmin ? hasSuperAdminAccess(user) : hasAdminAccess(user);
      
      if (!requiredAccess) {
        // Log unauthorized access attempt
        await logSecurityEvent(supabase, 'admin_unauthorized_access', user.id, {
          attempted_route: request.nextUrl.pathname,
          user_role: user.role,
          required_role: options.requireSuperAdmin ? 'super_admin' : 'admin',
          ip_address: request.ip || request.headers.get('x-forwarded-for'),
        });

        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        );
      }

      // Log successful admin access
      await logSecurityEvent(supabase, 'admin_access_granted', user.id, {
        route: request.nextUrl.pathname,
        user_role: user.role,
        ip_address: request.ip || request.headers.get('x-forwarded-for'),
      });

      const context: AdminContext = { user, supabase };
      return await handler(request, context);
    } catch (error) {
      console.error('Admin middleware error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

/**
 * Log security events for admin panel
 */
async function logSecurityEvent(
  supabase: ReturnType<typeof createServerClient>,
  eventType: string,
  userId: string,
  details: Record<string, any>
) {
  try {
    await supabase.from('audit_logs').insert({
      event_type: eventType,
      admin_id: userId,
      event_data: details,
      ip_address: details.ip_address,
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to log security event:', error);
  }
}

/**
 * Log admin actions with full context
 */
export async function logAdminAction(
  supabase: ReturnType<typeof createServerClient>,
  action: string,
  adminId: string,
  targetUserId?: string,
  details: Record<string, any> = {},
  request?: NextRequest
) {
  try {
    const logData = {
      event_type: action,
      admin_id: adminId,
      user_id: targetUserId,
      event_data: {
        ...details,
        timestamp: new Date().toISOString(),
        user_agent: request?.headers.get('user-agent'),
      },
      ip_address: request?.ip || request?.headers.get('x-forwarded-for'),
      created_at: new Date().toISOString(),
    };

    await supabase.from('audit_logs').insert(logData);
  } catch (error) {
    console.error('Failed to log admin action:', error);
  }
}

/**
 * Validate admin session and check for lockout
 */
export async function validateAdminSession(
  supabase: ReturnType<typeof createServerClient>,
  userId: string
): Promise<{ valid: boolean; locked: boolean; lockoutEnd?: Date }> {
  try {
    // Check for active lockout
    const { data: session, error } = await supabase
      .from('admin_sessions')
      .select('failed_attempts, locked_until')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('Error checking admin session:', error);
      return { valid: false, locked: false };
    }

    if (!session) {
      return { valid: true, locked: false };
    }

    const now = new Date();
    const lockedUntil = session.locked_until ? new Date(session.locked_until) : null;

    if (lockedUntil && now < lockedUntil) {
      return {
        valid: false,
        locked: true,
        lockoutEnd: lockedUntil,
      };
    }

    return { valid: true, locked: false };
  } catch (error) {
    console.error('Error validating admin session:', error);
    return { valid: false, locked: false };
  }
}

/**
 * Record failed login attempt
 */
export async function recordFailedLogin(
  supabase: ReturnType<typeof createServerClient>,
  userId: string,
  ip: string
) {
  try {
    const adminSupabase = createAdminSupabaseClient();
    
    // Call the increment_failed_attempts function
    await adminSupabase.rpc('increment_failed_attempts', {
      user_uuid: userId
    });

    // Log the failed attempt
    await logSecurityEvent(supabase, 'admin_login_failed', userId, {
      ip_address: ip,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error recording failed login:', error);
  }
}

/**
 * Reset failed login attempts after successful login
 */
export async function resetFailedAttempts(
  supabase: ReturnType<typeof createServerClient>,
  userId: string
) {
  try {
    const adminSupabase = createAdminSupabaseClient();
    
    // Call the reset_failed_attempts function
    await adminSupabase.rpc('reset_failed_attempts', {
      user_uuid: userId
    });
  } catch (error) {
    console.error('Error resetting failed attempts:', error);
  }
}

/**
 * Create admin response with consistent error handling
 */
export function createAdminResponse<T>(
  data: T,
  status = 200
): NextResponse {
  return NextResponse.json(data, { status });
}

/**
 * Create admin error response
 */
export function createAdminError(
  message: string,
  status = 400,
  details?: Record<string, any>
): NextResponse {
  return NextResponse.json(
    {
      error: message,
      ...(details && { details }),
    },
    { status }
  );
}

/**
 * Rate limiting for admin endpoints
 */
const adminRateLimits = new Map<string, { count: number; resetTime: number }>();

export function checkAdminRateLimit(
  identifier: string,
  limit = 100,
  windowMs = 15 * 60 * 1000 // 15 minutes
): boolean {
  const now = Date.now();
  const current = adminRateLimits.get(identifier);

  if (!current || now > current.resetTime) {
    adminRateLimits.set(identifier, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (current.count >= limit) {
    return false;
  }

  current.count++;
  return true;
}

/**
 * Clean up expired rate limit entries
 */
export function cleanupRateLimits() {
  const now = Date.now();
  for (const [key, value] of adminRateLimits.entries()) {
    if (now > value.resetTime) {
      adminRateLimits.delete(key);
    }
  }
}

// Clean up rate limits every hour
setInterval(cleanupRateLimits, 60 * 60 * 1000);
