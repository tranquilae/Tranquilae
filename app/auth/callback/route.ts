import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { supabaseLogger } from '@/lib/supabase-logger'

export async function GET(request: NextRequest) {
  try {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    const redirectTo = requestUrl.searchParams.get('redirect_to')
    const error = requestUrl.searchParams.get('error')
    const errorDescription = requestUrl.searchParams.get('error_description')

    // Handle authentication errors
    if (error) {
      console.error('Auth callback error:', error, errorDescription)
      
      await supabaseLogger.logSecurityEvent({
        event_type: 'AUTH_CALLBACK',
        success: false,
        error: `${error}: ${errorDescription}`,
        ip_address: request.ip,
        user_agent: request.headers.get('user-agent') || undefined
      })

      // Redirect to login with error
      return NextResponse.redirect(
        new URL(`/auth/login?error=${encodeURIComponent(errorDescription || error)}`, request.url)
      )
    }

    // Handle successful authentication
    if (code) {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      // Exchange code for session
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

      if (exchangeError) {
        console.error('Code exchange error:', exchangeError)
        
        await supabaseLogger.logSecurityEvent({
          event_type: 'AUTH_CALLBACK',
          success: false,
          error: exchangeError.message,
          ip_address: request.ip,
          user_agent: request.headers.get('user-agent') || undefined
        })

        return NextResponse.redirect(
          new URL(`/auth/login?error=${encodeURIComponent('Authentication failed')}`, request.url)
        )
      }

      if (data.user) {
        // Log successful authentication
        await supabaseLogger.logSecurityEvent({
          event_type: 'AUTH_CALLBACK',
          user_id: data.user.id,
          success: true,
          ip_address: request.ip,
          user_agent: request.headers.get('user-agent') || undefined,
          metadata: {
            email: data.user.email,
            email_confirmed: data.user.email_confirmed_at !== null,
            redirect_to: redirectTo
          }
        })

        // Determine redirect destination
        let redirectPath = '/dashboard'

        // Check if user has completed onboarding
        const { data: userData } = await supabase
          .from('users')
          .select('onboarding_complete')
          .eq('id', data.user.id)
          .single()

        if (userData && !userData.onboarding_complete) {
          redirectPath = '/onboarding'
        }

        // Use custom redirect if provided
        if (redirectTo) {
          try {
            const redirectUrl = new URL(redirectTo, request.url)
            // Only allow redirects to the same domain for security
            if (redirectUrl.hostname === new URL(request.url).hostname) {
              redirectPath = redirectUrl.pathname + redirectUrl.search
            }
          } catch (e) {
            // Invalid redirect URL, use default
          }
        }

        return NextResponse.redirect(new URL(redirectPath, request.url))
      }
    }

    // No code parameter, redirect to login
    return NextResponse.redirect(new URL('/auth/login', request.url))

  } catch (error: any) {
    console.error('Auth callback error:', error)
    
    await supabaseLogger.logSecurityEvent({
      event_type: 'AUTH_CALLBACK',
      success: false,
      error: error.message,
      ip_address: request.ip,
      user_agent: request.headers.get('user-agent') || undefined
    })

    return NextResponse.redirect(
      new URL('/auth/login?error=' + encodeURIComponent('Authentication error'), request.url)
    )
  }
}
