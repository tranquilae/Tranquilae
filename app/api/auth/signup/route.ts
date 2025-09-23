import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { supabaseLogger } from '@/lib/supabase-logger'
import { db } from '@/lib/database'

// Create Supabase client for Auth only (split architecture)
const supabaseAuth = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { email, password, firstName, lastName } = await request.json()

    // Validate required fields
    if (!email || !password || !firstName || !lastName) {
      await supabaseLogger.logSecurityEvent({
        event_type: 'SIGNUP',
        success: false,
        error: 'Missing required fields',
        ip_address: request.ip,
        user_agent: request.headers.get('user-agent') || undefined
      })

      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Sign up user with Supabase Auth (auth only)
    const { data: authData, error: authError } = await supabaseAuth.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          full_name: `${firstName} ${lastName}`,
        }
      }
    })

    if (authError) {
      await supabaseLogger.logSecurityEvent({
        event_type: 'SIGNUP',
        success: false,
        error: authError.message,
        ip_address: request.ip,
        user_agent: request.headers.get('user-agent') || undefined
      })

      return NextResponse.json(
        { error: authError.message },
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

      } catch (profileError) {
        console.error('Error creating user profile in Neon DB:', profileError)
        // Don't fail the signup if profile creation fails
        // The auth user still exists and can be handled later
      }

      // Log successful signup
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
    
    await supabaseLogger.logSecurityEvent({
      event_type: 'SIGNUP',
      success: false,
      error: error.message,
      ip_address: request.ip,
      user_agent: request.headers.get('user-agent') || undefined
    })

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
