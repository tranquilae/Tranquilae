import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { supabaseLogger } from '@/lib/supabase-logger'

// Create server-side Supabase client
const supabase = createClient(
  process.env['NEXT_PUBLIC_SUPABASE_URL']!,
  process.env['SUPABASE_SECRET_KEY'] || process.env['SUPABASE_SERVICE_ROLE_KEY']!
)

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    // Validate required fields
    if (!email || !password) {
      await supabaseLogger.logSecurityEvent({
        event_type: 'LOGIN',
        success: false,
        error: 'Missing email or password',
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown'
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
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown',
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
      // Update last sign in timestamp in users table (Supabase)
      try {
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
      } catch (updateErr) {
        console.warn('Failed to update last sign in (non-critical):', updateErr)
      }

      // Check onboarding status from Neon database
      let redirectTo = '/dashboard'; // Default
      let onboardingComplete = false;
      
      try {
        // Check if DATABASE_URL is configured
        if (!process.env['DATABASE_URL']) {
          console.warn('⚠️ DATABASE_URL not configured - skipping onboarding check')
          console.log('🎯 DATABASE_URL missing - defaulting to onboarding')
          redirectTo = '/onboarding'
          onboardingComplete = false
        } else {
          const { db } = await import('@/lib/database')
          let userData = await db.getUserById(authData.user.id)
          
          console.log('🔍 Login: Checking onboarding status for user:', authData.user.id)
          console.log('📊 Login: User data from Neon:', userData ? { onboardingComplete: userData.onboarding_complete } : 'Not found')
          
          if (!userData) {
            try {
              userData = await db.createUser({ id: authData.user.id, email: authData.user.email || '', name: authData.user.email?.split('@')[0] || '', onboarding_complete: false })
              console.log('🆕 Created minimal profile during login')
            } catch (createErr) {
              console.warn('Could not auto-create profile during login:', createErr)
            }
          }
          
          if (userData && userData.onboarding_complete === true) {
            console.log('✅ Login: User has completed onboarding - redirect to dashboard')
            redirectTo = '/dashboard'
            onboardingComplete = true
          } else {
            console.log('🎯 Login: User needs onboarding or profile not found - redirect to onboarding')
            redirectTo = '/onboarding'
            onboardingComplete = false
          }
        }
      } catch (dbError) {
        console.error('❌ Database error checking onboarding status:', dbError)
        console.log('🎯 Login: Defaulting to onboarding due to DB error')
        redirectTo = '/onboarding'
        onboardingComplete = false
      }

      // Log successful login
      try {
        await supabaseLogger.logSecurityEvent({
          event_type: 'LOGIN',
          user_id: authData.user.id,
          success: true,
          ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
          user_agent: request.headers.get('user-agent') || 'unknown',
          metadata: {
            email: authData.user.email,
            email_confirmed: authData.user.email_confirmed_at !== null,
            onboarding_complete: onboardingComplete,
            redirect_to: redirectTo
          }
        })
      } catch (logError) {
        console.warn('Failed to log login event:', logError)
      }

      return NextResponse.json({
        success: true,
        user: {
          id: authData.user.id,
          email: authData.user.email,
          emailConfirmed: authData.user.email_confirmed_at !== null,
          onboardingComplete
        },
        session: authData.session,
        redirectTo
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
      ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      user_agent: request.headers.get('user-agent') || 'unknown'
    })

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

