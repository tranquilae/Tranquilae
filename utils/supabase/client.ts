import { createBrowserClient } from "@supabase/ssr";

// Get and validate environment variables
function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
                  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
                  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!url || !anonKey) {
    console.error('❌ Supabase Client Configuration Missing:', {
      url: !!url,
      anonKey: !!anonKey,
      env: process.env.NODE_ENV
    })
    throw new Error('Missing Supabase configuration for browser client')
  }

  // Validate URL format
  if (!url.includes('.supabase.co')) {
    console.error('❌ Invalid Supabase URL format:', url)
    throw new Error('Invalid Supabase URL format')
  }

  // Validate key format
  if (!anonKey.startsWith('eyJ') && !anonKey.startsWith('sb_')) {
    console.error('❌ Invalid Supabase key format')
    throw new Error('Invalid Supabase anon key format')
  }

  // Log success in development
  if (process.env.NODE_ENV === 'development') {
    console.log('✅ Supabase browser client configured successfully')
  }

  return { url, anonKey }
}

// Create and cache the client
let supabaseClient: ReturnType<typeof createBrowserClient> | null = null

export const createClient = () => {
  // Return cached client if it exists
  if (supabaseClient) {
    return supabaseClient
  }

  const { url, anonKey } = getSupabaseConfig()

  try {
    supabaseClient = createBrowserClient(
      url,
      anonKey,
      {
        auth: {
          // Enable automatic session refresh
          autoRefreshToken: true,
          // Persist session in browser storage
          persistSession: true,
          // Detect session in URL for auth callbacks
          detectSessionInUrl: true,
          // Use PKCE flow for better security
          flowType: 'pkce',
          // Custom storage key to avoid conflicts
          storageKey: 'tranquilae-auth-token'
        },
        // Global configuration
        global: {
          headers: {
            'X-Client-Info': 'tranquilae-browser@2024'
          }
        }
      }
    )

    // Log successful creation in development
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Supabase browser client created successfully')
    }

    return supabaseClient
  } catch (error: any) {
    console.error('❌ Failed to create Supabase browser client:', error.message)
    throw new Error(`Supabase browser client creation failed: ${error.message}`)
  }
}

// Helper function to get the current session
export const getSession = async () => {
  const client = createClient()
  try {
    const { data: { session }, error } = await client.auth.getSession()
    if (error) {
      console.error('❌ Failed to get session:', error.message)
      return null
    }
    return session
  } catch (error: any) {
    console.error('❌ Session retrieval error:', error.message)
    return null
  }
}

// Helper function to get the current user
export const getUser = async () => {
  const client = createClient()
  try {
    const { data: { user }, error } = await client.auth.getUser()
    if (error) {
      console.error('❌ Failed to get user:', error.message)
      return null
    }
    return user
  } catch (error: any) {
    console.error('❌ User retrieval error:', error.message)
    return null
  }
}
