import { createClient } from '@supabase/supabase-js'

// JWT verification (will need to install jose package)
// npm install jose
let jwtVerify: any, SignJWT: any
try {
  const jose = require('jose')
  jwtVerify = jose.jwtVerify
  SignJWT = jose.SignJWT
} catch (error) {
  // Fallback if jose is not installed
  console.warn('jose package not found. Install with: npm install jose')
}

// Validate environment variables
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
}

if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable')
}

// Regular client for client-side operations with updated JWT config
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      // Enable automatic session refresh
      autoRefreshToken: true,
      persistSession: true,
      // Detect session in URL (for email confirmations, password resets)
      detectSessionInUrl: true,
      // Flow type for PKCE (more secure)
      flowType: 'pkce'
    },
    // Global options for better performance
    global: {
      headers: {
        'X-Client-Info': 'tranquilae@2024'
      }
    }
  }
)

// Admin client for server-side operations with service role key
// This should only be used in API routes and server components
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      // Disable auto refresh for service role (it doesn't expire)
      autoRefreshToken: false,
      persistSession: false,
      // Disable URL detection for server-side client
      detectSessionInUrl: false
    },
    // Global options
    global: {
      headers: {
        'X-Client-Info': 'tranquilae-admin@2024'
      }
    }
  }
)

// Types for admin operations
export interface AdminUser {
  id: string;
  email: string;
  name?: string;
  role?: 'admin' | 'super_admin' | 'user';
  plan: 'explorer' | 'pathfinder';
  onboarding_complete: boolean;
  status?: 'active' | 'suspended';
  created_at: string;
  updated_at: string;
  last_sign_in_at?: string;
  email_confirmed_at?: string;
}

export interface AdminSubscription {
  id: string;
  user_id: string;
  plan: 'explorer' | 'pathfinder';
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete';
  stripe_subscription_id?: string;
  stripe_customer_id?: string;
  trial_end?: string;
  current_period_start?: string;
  current_period_end?: string;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuditLogEntry {
  id: string;
  event_type: string;
  user_id?: string;
  admin_id?: string;
  table_name?: string;
  event_data: any;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

// JWT Token verification utility (for enhanced security)
const JWT_SECRET = process.env.SUPABASE_JWT_SECRET

if (!JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('SUPABASE_JWT_SECRET is required in production')
}

// Verify Supabase JWT token
export async function verifySupabaseJWT(token: string) {
  if (!jwtVerify || !JWT_SECRET) {
    console.warn('JWT verification not available. Install jose package.')
    return null
  }
  
  try {
    const secret = new TextEncoder().encode(JWT_SECRET)
    const { payload } = await jwtVerify(token, secret)
    return payload
  } catch (error) {
    console.error('JWT verification failed:', error)
    return null
  }
}

// Enhanced admin permission check with JWT verification
export async function checkAdminAccess(userId: string, token?: string): Promise<boolean> {
  try {
    // Additional JWT verification if token provided
    if (token) {
      const payload = await verifySupabaseJWT(token)
      if (!payload || payload.sub !== userId) {
        console.warn('JWT verification failed for admin access')
        return false
      }
    }

    // Check if user ID is in the allowed admin list from environment
    const allowedAdmins = process.env.ADMIN_USER_IDS?.split(',').map(id => id.trim()) || []
    const superAdmins = process.env.SUPER_ADMIN_USER_IDS?.split(',').map(id => id.trim()) || []
    
    if (allowedAdmins.includes(userId) || superAdmins.includes(userId)) {
      return true
    }

    // Fallback: Check user role in database
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error checking admin access:', error)
      return false
    }

    return user?.role === 'admin' || user?.role === 'super_admin'
  } catch (error) {
    console.error('Error in checkAdminAccess:', error)
    return false
  }
}

// Get user session and verify admin access with enhanced JWT verification
export async function getAdminSession(request?: Request) {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return { user: null, isAdmin: false, error: error?.message }
    }

    // Get JWT token for additional verification
    let token: string | undefined
    if (request) {
      const authHeader = request.headers.get('Authorization')
      token = authHeader?.replace('Bearer ', '')
    } else {
      // Try to get token from Supabase session
      const { data: { session } } = await supabase.auth.getSession()
      token = session?.access_token
    }

    const isAdmin = await checkAdminAccess(user.id, token)
    
    return { 
      user, 
      isAdmin,
      session: await supabase.auth.getSession(),
      token
    }
  } catch (error) {
    console.error('Error in getAdminSession:', error)
    return { user: null, isAdmin: false, error: 'Session verification failed' }
  }
}

// Server-side session verification for API routes
export async function getServerSession(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return { user: null, error: 'No authorization header' }
    }

    const token = authHeader.replace('Bearer ', '')
    
    // Verify with Supabase
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
    
    if (error || !user) {
      return { user: null, error: error?.message || 'Invalid token' }
    }

    // Additional JWT verification
    const jwtPayload = await verifySupabaseJWT(token)
    if (jwtPayload && jwtPayload.sub !== user.id) {
      return { user: null, error: 'Token mismatch' }
    }

    return { user, token, jwtPayload }
  } catch (error) {
    console.error('Error in getServerSession:', error)
    return { user: null, error: 'Session verification failed' }
  }
}
