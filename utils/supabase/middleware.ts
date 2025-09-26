import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

// Get and validate environment variables
function getSupabaseConfig() {
  const url = process.env['NEXT_PUBLIC_SUPABASE_URL']
  const anonKey = process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] ||
                  process.env['NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY'] ||
                  process.env['NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY']

  if (!url || !anonKey) {
    console.error('❌ Supabase Middleware Configuration Missing:', {
      url: !!url,
      anonKey: !!anonKey,
      env: process.env['NODE_ENV']
    })
    throw new Error('Missing Supabase configuration for middleware client')
  }

  return { url, anonKey }
}

export const updateSession = async (request: NextRequest) => {
  const { url, anonKey } = getSupabaseConfig()

  // Create an unmodified response
  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    url,
    anonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Set cookies on the request
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
          })
          
          // Create a new response with updated cookies
          supabaseResponse = NextResponse.next({
            request,
          })
          
          // Set cookies on the response
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options)
          })
        },
      },
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false, // Usually disabled in middleware
        flowType: 'pkce'
      }
    },
  )

  // IMPORTANT: You *must* call getUser() or getSession() at least once
  // in the middleware to trigger the auth refresh process
  const { data: { user }, error } = await supabase.auth.getUser()

  // Log authentication status in development
  if (process.env['NODE_ENV'] === 'development') {
    console.log('🔐 Middleware Auth Check:', {
      hasUser: !!user,
      error: error?.message,
      path: request.nextUrl.pathname
    })
  }

  return { supabaseResponse, user, error }
}

// Alternative simpler function that just creates the client
export const createClient = (request: NextRequest) => {
  const { url, anonKey } = getSupabaseConfig()

  // Create an unmodified response
  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    url,
    anonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
          })
          
          supabaseResponse = NextResponse.next({
            request,
          })
          
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options)
          })
        },
      },
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
        flowType: 'pkce'
      }
    },
  )

  return { supabase, supabaseResponse }
}
