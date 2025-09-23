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
      
        try {
          await supabaseLogger.logSecurityEvent({
            event_type: 'AUTH_CALLBACK',
            success: false,
            error: `${error}: ${errorDescription}`,
            ip_address: request.ip,
            user_agent: request.headers.get('user-agent') || undefined
          })
        } catch (logError) {
          console.warn('Failed to log auth callback error:', logError)
        }

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
        
        try {
          await supabaseLogger.logSecurityEvent({
            event_type: 'AUTH_CALLBACK',
            success: false,
            error: exchangeError.message,
            ip_address: request.ip,
            user_agent: request.headers.get('user-agent') || undefined
          })
        } catch (logError) {
          console.warn('Failed to log code exchange error:', logError)
        }

        return NextResponse.redirect(
          new URL(`/auth/login?error=${encodeURIComponent('Authentication failed')}`, request.url)
        )
      }

      if (data.user) {
        // Log successful authentication
        try {
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
        } catch (logError) {
          console.warn('Failed to log successful auth callback:', logError)
        }

        // Determine redirect destination
        let redirectPath = '/dashboard'

        // Check if user has completed onboarding (using Neon DB, not Supabase)
        try {
          // Import database here to avoid module loading issues
          const { db } = await import('@/lib/database')
          
          const userData = await db.getUserById(data.user.id)
          
          if (userData && !userData.onboarding_complete) {
            redirectPath = '/onboarding'
          } else if (!userData) {
            // User doesn't exist in Neon - redirect to onboarding to create profile
            redirectPath = '/onboarding'
          }
        } catch (dbError) {
          console.warn('Could not check onboarding status from Neon DB:', dbError)
          // Default to onboarding if we can't check
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
    
    try {
      await supabaseLogger.logSecurityEvent({
        event_type: 'AUTH_CALLBACK',
        success: false,
        error: error.message,
        ip_address: request.ip,
        user_agent: request.headers.get('user-agent') || undefined
      })
    } catch (logError) {
      console.warn('Failed to log general auth callback error:', logError)
    }

    return NextResponse.redirect(
      new URL('/auth/login?error=' + encodeURIComponent('Authentication error'), request.url)
    )
  }
}
