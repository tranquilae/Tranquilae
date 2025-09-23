import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { supabaseLogger } from '@/lib/supabase-logger'

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

    // Sign up user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
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
      // Create user profile in users table
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: authData.user.email,
          first_name: firstName,
          last_name: lastName,
          full_name: `${firstName} ${lastName}`,
          plan: 'explorer', // Default plan
          onboarding_complete: false,
          role: 'user',
          status: 'active'
        })

      if (profileError) {
        console.error('Error creating user profile:', profileError)
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
