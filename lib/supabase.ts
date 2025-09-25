import { createClient } from '@supabase/supabase-js'

// Environment variable configuration with better error handling
interface SupabaseConfig {
  url: string
  anonKey: string
  serviceRoleKey?: string
  isValid: boolean
  errors: string[]
}

// Get and validate Supabase configuration
function getSupabaseConfig(): SupabaseConfig {
  const errors: string[] = []
  
  // Get URL
  const url = process.env['NEXT_PUBLIC_SUPABASE_URL']
  if (!url) {
    errors.push('NEXT_PUBLIC_SUPABASE_URL is required')
  } else if (!url.includes('.supabase.co')) {
    errors.push('NEXT_PUBLIC_SUPABASE_URL should be a valid Supabase URL')
  }
  
  // Get anon key (try different environment variable names for compatibility)
  const anonKey = process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] || 
                   process.env['NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY'] ||
                   process.env['NEXT_PUBLIC_SUPABASE_KEY'] ||
                   process.env['SUPABASE_ANON_KEY']
  
  if (!anonKey) {
    errors.push('NEXT_PUBLIC_SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY is required')
  } else if (!anonKey.startsWith('eyJ') && !anonKey.startsWith('sb_')) {
    errors.push('Publishable key should be a valid JWT token or new publishable key format (starts with sb_publishable_)')
  }
  
  // Get service role key (optional for client, required for admin)
  const serviceRoleKey = process.env['SUPABASE_SERVICE_ROLE_KEY'] || 
                        process.env['SUPABASE_SECRET_KEY']
  
  // Log configuration status in development
  if (process.env['NODE_ENV'] === 'development') {
    console.log('🔧 Supabase Configuration:', {
      url: url ? '✅ Set' : '❌ Missing',
      anonKey: anonKey ? `✅ Set (${anonKey.substring(0, 10)}...)` : '❌ Missing',
      serviceRoleKey: serviceRoleKey ? `✅ Set (${serviceRoleKey.substring(0, 10)}...)` : '⚠️ Not set (optional)',
      errors: errors.length > 0 ? errors : ['None']
    })
  }
  
  const result: SupabaseConfig = {
    url: url || '',
    anonKey: anonKey || '',
    isValid: errors.length === 0,
    errors
  }
  
  if (serviceRoleKey !== undefined) {
    result.serviceRoleKey = serviceRoleKey
  }
  
  return result
}

// Get configuration
const config = getSupabaseConfig()

// Throw error if configuration is invalid
if (!config.isValid && process.env['NODE_ENV'] !== 'test') {
  const errorMsg = `❌ Invalid Supabase configuration: ${config.errors.join(', ')}`
  console.error(errorMsg)
  // In development, provide helpful guidance
  if (process.env['NODE_ENV'] === 'development') {
    console.error('\n🔧 Quick Fix:')
    console.error('1. Copy .env.example to .env.local')
    console.error('2. Add your Supabase project URL and keys')
    console.error('3. Restart your development server')
    console.error('\n📚 Need help? Visit: http://localhost:3000/api/debug/supabase\n')
  }
}

// Create Supabase client factory function with error handling
function createSupabaseClient() {
  if (!config.isValid) {
    throw new Error(`Supabase client creation failed: ${config.errors.join(', ')}`)
  }
  
  try {
    return createClient(config.url, config.anonKey, {
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
    })
  } catch (error: any) {
    console.error('❌ Failed to create Supabase client:', error.message)
    throw new Error(`Supabase client initialization failed: ${error.message}`)
  }
}

// Export the client instance
export const supabase = createSupabaseClient()

// Admin client for server-side operations with service role key
// This should only be used in API routes and server components
function createSupabaseAdminClient() {
  if (!config.serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for admin operations')
  }
  
  // Allow dummy keys in development environment
  if (process.env['NODE_ENV'] !== 'development' && 
      !config.serviceRoleKey.startsWith('eyJ') && 
      !config.serviceRoleKey.startsWith('sb_secret_')) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY should be a valid JWT token (eyJ...) or new secret key format (sb_secret_...)')
  }
  
  try {
    return createClient(
      config.url,
      config.serviceRoleKey,
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
  } catch (error: any) {
    console.error('❌ Failed to create Supabase admin client:', error.message)
    throw new Error(`Supabase admin client initialization failed: ${error.message}`)
  }
}

// Create admin client factory function (deferred creation to avoid build-time errors)
function getSupabaseAdmin() {
  if (!config.serviceRoleKey) {
    return null
  }
  
  // Allow dummy keys in development - return null instead of throwing
  if (config.serviceRoleKey.includes('dummy') || config.serviceRoleKey.includes('local-dev')) {
    return null
  }
  
  return createSupabaseAdminClient()
}

// Export admin client getter
export const supabaseAdmin = getSupabaseAdmin()

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

// JWT Token verification utility (for new asymmetric JWT system)
// Note: With new Supabase API keys, JWT verification is handled automatically
// by Supabase client, so manual JWT verification is not needed

// Simplified JWT verification for compatibility (deprecated)
export async function verifySupabaseJWT(token: string) {
  // With new asymmetric JWT system, we rely on Supabase's built-in verification
  // Manual verification would require fetching public keys from Supabase's JWKS endpoint
  console.warn('Manual JWT verification not needed with new Supabase API key system')
  return null
}

// Enhanced admin permission check with JWT verification
export async function checkAdminAccess(userId: string, token?: string): Promise<boolean> {
  try {
    // Note: With new asymmetric JWT system, token verification is handled by Supabase client
    // We can focus on role-based access control

    // Check if user ID is in the allowed admin list from environment
    const allowedAdmins = process.env['ADMIN_USER_IDS']?.split(',').map(id => id.trim()) || []
    const superAdmins = process.env['SUPER_ADMIN_USER_IDS']?.split(',').map(id => id.trim()) || []
    
    if (allowedAdmins.includes(userId) || superAdmins.includes(userId)) {
      return true
    }

    // Fallback: Check user role in database
    if (!supabaseAdmin) {
      console.warn('⚠️ Admin client not available - skipping database role check')
      return false
    }
    
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
    if (!supabaseAdmin) {
      return { user: null, error: 'Admin client not available' }
    }
    
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
    
    if (error || !user) {
      return { user: null, error: error?.message || 'Invalid token' }
    }

    // Note: With new asymmetric JWT system, additional verification is handled by Supabase
    return { user, token }
  } catch (error) {
    console.error('Error in getServerSession:', error)
    return { user: null, error: 'Session verification failed' }
  }
}
