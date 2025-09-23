import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { supabaseLogger } from '@/lib/supabase-logger'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    // Validate required fields
    if (!email || !password) {
      await supabaseLogger.logSecurityEvent({
        event_type: 'LOGIN',
        success: false,
        error: 'Missing email or password',
        ip_address: request.ip,
        user_agent: request.headers.get('user-agent') || undefined
      })

      return NextResponse.json(
        { error: 'Missing email or password' },
        { status: 400 }
      )
    }

    // Sign in user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (authError) {
      await supabaseLogger.logSecurityEvent({
        event_type: 'LOGIN',
        success: false,
        error: authError.message,
        ip_address: request.ip,
        user_agent: request.headers.get('user-agent') || undefined,
        metadata: {
          email: email
        }
      })

      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      )
    }

    // If user signed in successfully
    if (authData.user && authData.session) {
      // Update last sign in timestamp in users table
      const { error: updateError } = await supabase
        .from('users')
        .update({
          last_sign_in_at: new Date().toISOString()
        })
        .eq('id', authData.user.id)

      if (updateError) {
        console.error('Error updating last sign in:', updateError)
        // Don't fail the login if the update fails
      }

      // Log successful login
      await supabaseLogger.logSecurityEvent({
        event_type: 'LOGIN',
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
      { error: 'Failed to sign in' },
      { status: 500 }
    )

  } catch (error: any) {
    console.error('Login error:', error)
    
    await supabaseLogger.logSecurityEvent({
      event_type: 'LOGIN',
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
