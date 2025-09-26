import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

// Get environment variables with proper fallbacks
function getSupabaseConfig() {
  const url = process.env['NEXT_PUBLIC_SUPABASE_URL']
  const anonKey = process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] ||
                  process.env['NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY'] ||
                  process.env['NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY']

  if (!url || !anonKey) {
    console.error('❌ Supabase Server Configuration Missing:', {
      url: !!url,
      anonKey: !!anonKey,
      env: process.env['NODE_ENV']
    })
    throw new Error('Missing Supabase configuration for server client')
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

  return { url, anonKey }
}

export const createClient = async (cookieStore?: Awaited<ReturnType<typeof cookies>>) => {
  const { url, anonKey } = getSupabaseConfig()
  
  // If no cookieStore is provided, get it
  const cookies_store = cookieStore || await cookies()

  return createServerClient(
    url,
    anonKey,
    {
      cookies: {
        getAll() {
          return cookies_store.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookies_store.set(name, value, options)
            })
          } catch (error) {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing user sessions.
            console.warn('Failed to set cookies in server component:', error)
          }
        },
      },
      auth: {
        // Enable automatic session refresh
        autoRefreshToken: true,
        persistSession: true,
        // Detect session in URL for auth callbacks
        detectSessionInUrl: true,
        // Use PKCE flow for better security
        flowType: 'pkce'
      }
    },
  );
};

// Alternative function for use in middleware and other contexts where cookies() might not be available
export const createClientWithRequest = (request: Request) => {
  const { url, anonKey } = getSupabaseConfig()
  
  const requestUrl = new URL(request.url)
  let supabaseResponse = new Response(null, {
    status: 200,
    headers: new Headers()
  })

  return createServerClient(
    url,
    anonKey,
    {
      cookies: {
        getAll() {
          const cookieHeader = request.headers.get('cookie')
          if (!cookieHeader) return []
          
          return cookieHeader.split(';').map(cookie => {
            const [name, value] = cookie.trim().split('=')
            return { name: name || '', value: decodeURIComponent(value || '') }
          }).filter(cookie => cookie.name !== '')
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.headers.append('Set-Cookie', `${name}=${value}; ${options ? Object.entries(options).map(([k, v]) => `${k}=${v}`).join('; ') : ''}`)
          })
        },
      },
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce'
      }
    },
  );
};
