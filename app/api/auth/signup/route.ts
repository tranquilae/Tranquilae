import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { supabaseLogger } from '@/lib/supabase-logger'
import { db } from '@/lib/database'

// Enhanced error logging function
function logDetailedError(error: any, context: string, request: NextRequest) {
  console.error(`❌ [SIGNUP ERROR] ${context}:`, {
    message: error.message,
    name: error.name,
    stack: error.stack,
    timestamp: new Date().toISOString(),
    ip: request.ip,
    userAgent: request.headers.get('user-agent')
  })
}

// Create Supabase client for Auth only (split architecture) with error handling
let supabaseAuth: any = null

try {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
              process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 
              process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
  
  if (!url || !key) {
    console.error('❌ Supabase configuration missing:', {
      url: !!url,
      key: !!key,
      env: process.env.NODE_ENV
    })
    throw new Error('Supabase configuration missing')
  }
  
  supabaseAuth = createClient(url, key, {
    auth: {
      autoRefreshToken: true,
      persistSession: false, // Don't persist on server
      detectSessionInUrl: false // Not needed on server
    }
  })
  
  console.log('✅ Supabase auth client created successfully')
} catch (error: any) {
  console.error('❌ Failed to create Supabase auth client:', error.message)
}

export async function POST(request: NextRequest) {
  // Check if Supabase client was created successfully
  if (!supabaseAuth) {
    console.error('❌ Supabase auth client not available')
    return NextResponse.json(
      { 
        error: 'Authentication service unavailable. Please check server configuration.',
        code: 'SUPABASE_CLIENT_ERROR'
      },
      { status: 503 }
    )
  }
  
  try {
    console.log('🔄 Processing signup request...')
    
    let requestData
    try {
      requestData = await request.json()
    } catch (parseError: any) {
      logDetailedError(parseError, 'JSON_PARSE_ERROR', request)
      return NextResponse.json(
        { error: 'Invalid request format', code: 'INVALID_JSON' },
        { status: 400 }
      )
    }
    
    const { email, password, firstName, lastName } = requestData
    
    console.log('🔎 Validating signup data:', {
      email: !!email,
      password: !!password,
      firstName: !!firstName,
      lastName: !!lastName
    })

    // Validate required fields
    if (!email || !password || !firstName || !lastName) {
      const missingFields = []
      if (!email) missingFields.push('email')
      if (!password) missingFields.push('password')
      if (!firstName) missingFields.push('firstName')
      if (!lastName) missingFields.push('lastName')
      
      console.log('❌ Missing required fields:', missingFields)
      
      try {
        await supabaseLogger.logSecurityEvent({
          event_type: 'SIGNUP',
          success: false,
          error: `Missing required fields: ${missingFields.join(', ')}`,
          ip_address: request.ip,
          user_agent: request.headers.get('user-agent') || undefined
        })
      } catch (logError) {
        console.warn('Failed to log validation error:', logError)
      }

      return NextResponse.json(
        { 
          error: `Missing required fields: ${missingFields.join(', ')}`,
          code: 'MISSING_FIELDS',
          missingFields
        },
        { status: 400 }
      )
    }

    console.log('🔒 Attempting Supabase Auth signup...')
    
    // Sign up user with Supabase Auth (auth only)
    let authData, authError
    try {
      const result = await supabaseAuth.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            full_name: `${firstName} ${lastName}`,
          },
          // Add redirect URL for email confirmation
          emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`
        }
      })
      
      authData = result.data
      authError = result.error
      
      console.log('📊 Supabase Auth Response:', {
        hasUser: !!authData?.user,
        hasSession: !!authData?.session,
        hasError: !!authError,
        errorMessage: authError?.message,
        userId: authData?.user?.id
      })
      
    } catch (signUpError: any) {
      logDetailedError(signUpError, 'SUPABASE_SIGNUP_EXCEPTION', request)
      
      try {
        await supabaseLogger.logSecurityEvent({
          event_type: 'SIGNUP',
          success: false,
          error: `Signup exception: ${signUpError.message}`,
          ip_address: request.ip,
          user_agent: request.headers.get('user-agent') || undefined
        })
      } catch (logError) {
        console.warn('Failed to log signup exception:', logError)
      }
      
      return NextResponse.json(
        { 
          error: 'Authentication service error. Please try again.',
          code: 'SUPABASE_SIGNUP_ERROR'
        },
        { status: 500 }
      )
    }

    if (authError) {
      console.error('❌ Supabase Auth Error:', {
        message: authError.message,
        status: authError.status,
        code: authError.__isAuthError ? 'AUTH_ERROR' : 'UNKNOWN_ERROR'
      })
      
      // Try to log security event, but don't fail signup if logging fails
      try {
        await supabaseLogger.logSecurityEvent({
          event_type: 'SIGNUP',
          success: false,
          error: authError.message,
          ip_address: request.ip,
          user_agent: request.headers.get('user-agent') || undefined,
          metadata: {
            errorStatus: authError.status,
            errorCode: authError.code
          }
        })
      } catch (logError) {
        console.warn('Failed to log security event:', logError)
      }

      // Handle rate limit errors specifically
      if (authError.message?.includes('rate limit') || authError.status === 429) {
        return NextResponse.json(
          { 
            error: 'Too many signup attempts. Please try again in a few minutes.',
            code: 'RATE_LIMIT_EXCEEDED',
            retryAfter: 3600, // 1 hour in seconds
            details: {
              message: 'Email sending rate limit exceeded. This resets every hour.',
              nextRetryTime: new Date(Date.now() + 3600000).toISOString()
            }
          },
          { 
            status: 429,
            headers: {
              'Retry-After': '3600',
              'X-RateLimit-Reset': Math.ceil(Date.now() / 1000 + 3600).toString()
            }
          }
        )
      }

      return NextResponse.json(
        { 
          error: authError.message,
          code: 'SUPABASE_AUTH_ERROR',
          details: {
            status: authError.status,
            originalCode: authError.code
          }
        },
        { status: 400 }
      )
    }

    // If user was created successfully
    if (authData.user) {
      try {
        // Create user profile in Neon DB (not Supabase)
        await db.createUser({
          id: authData.user.id,
          email: authData.user.email!,
          first_name: firstName,
          last_name: lastName,
          name: `${firstName} ${lastName}`,
          plan: 'explorer', // Default plan
          onboarding_complete: false
        })

      } catch (profileError: any) {
        console.error('❌ Error creating user profile in Neon DB:', {
          error: profileError.message,
          stack: profileError.stack,
          userId: authData.user.id,
          email: authData.user.email,
          name: `${firstName} ${lastName}`,
          timestamp: new Date().toISOString()
        })
        
        // Log the specific database error for debugging
        console.error('📊 Database Error Details:', profileError)
        
        // Don't fail the signup if profile creation fails
        // The auth user still exists and can be handled later
        // But we should track this as a critical issue
      }

      // Log successful signup (graceful failure if audit table missing)
      try {
        await supabaseLogger.logSecurityEvent({
          event_type: 'SIGNUP',
          user_id: authData.user.id,
          success: true,
          ip_address: request.ip,
          user_agent: request.headers.get('user-agent') || undefined,
          metadata: {
            email: authData.user.email,
            email_confirmed: authData.user.email_confirmed_at !== null
          }
        })
      } catch (logError) {
        console.warn('Failed to log successful signup event:', logError)
      }

      return NextResponse.json({
        success: true,
        user: {
          id: authData.user.id,
          email: authData.user.email,
          emailConfirmed: authData.user.email_confirmed_at !== null
        },
        session: authData.session
      })
    }

    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    )

  } catch (error: any) {
    console.error('Signup error:', error)
    
    try {
      await supabaseLogger.logSecurityEvent({
        event_type: 'SIGNUP',
        success: false,
        error: error.message,
        ip_address: request.ip,
        user_agent: request.headers.get('user-agent') || undefined
      })
    } catch (logError) {
      console.warn('Failed to log general error:', logError)
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
