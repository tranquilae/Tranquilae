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
          const logEvent: any = {
            event_type: 'LOGIN',
            success: false,
            error: `${error}: ${errorDescription}`
          };
          
          const ipAddress = request.headers.get('x-forwarded-for');
          if (ipAddress) logEvent.ip_address = ipAddress;
          
          const userAgent = request.headers.get('user-agent');
          if (userAgent) logEvent.user_agent = userAgent;
          
          await supabaseLogger.logSecurityEvent(logEvent);
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
        process.env['NEXT_PUBLIC_SUPABASE_URL']!,
        process.env['NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY'] || process.env['NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'] || process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!
      )

      // Exchange code for session
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

      if (exchangeError) {
        console.error('Code exchange error:', exchangeError)
        
        try {
          const logEvent: any = {
            event_type: 'LOGIN',
            success: false,
            error: exchangeError.message
          };
          
          const ipAddress = request.headers.get('x-forwarded-for');
          if (ipAddress) logEvent.ip_address = ipAddress;
          
          const userAgent = request.headers.get('user-agent');
          if (userAgent) logEvent.user_agent = userAgent;
          
          await supabaseLogger.logSecurityEvent(logEvent);
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
          const logEvent: any = {
            event_type: 'LOGIN',
            user_id: data.user.id,
            success: true,
            metadata: {
              email: data.user.email,
              email_confirmed: data.user.email_confirmed_at !== null,
              redirect_to: redirectTo
            }
          };
          
          const ipAddress = request.headers.get('x-forwarded-for');
          if (ipAddress) logEvent.ip_address = ipAddress;
          
          const userAgent = request.headers.get('user-agent');
          if (userAgent) logEvent.user_agent = userAgent;
          
          await supabaseLogger.logSecurityEvent(logEvent);
        } catch (logError) {
          console.warn('Failed to log successful auth callback:', logError)
        }

        // Determine redirect destination
        let redirectPath = '/dashboard'

        // Check if user has completed onboarding (using Neon DB, not Supabase)
        try {
          // Check if DATABASE_URL is configured
          if (!process.env['DATABASE_URL']) {
            console.warn('⚠️ DATABASE_URL not configured - skipping onboarding check')
            console.log('🎯 DATABASE_URL missing - defaulting to onboarding')
            redirectPath = '/onboarding'
          } else {
            // Import database here to avoid module loading issues
            const { db } = await import('@/lib/database')
            
            console.log('🔍 Checking onboarding status for user:', data.user.id)
            let userData = await db.getUserById(data.user.id)
            console.log('📊 User data from Neon:', userData ? { onboardingComplete: userData.onboarding_complete } : 'Not found')
            
            if (!userData) {
              // Auto-create minimal profile to prevent loops
              try {
                const userCreateData: any = { id: data.user.id, email: data.user.email || '', onboarding_complete: false };
                const userName = data.user.email?.split('@')[0];
                if (userName) userCreateData.name = userName;
                userData = await db.createUser(userCreateData);
                console.log('🆕 Created minimal profile during auth callback')
              } catch (createErr) {
                console.warn('Could not auto-create profile:', createErr)
              }
            }
            
            if (userData && userData.onboarding_complete === true) {
              console.log('✅ User has completed onboarding - redirecting to dashboard')
              redirectPath = '/dashboard'
            } else {
              console.log('🎯 User needs onboarding or profile not found - redirecting to onboarding')
              redirectPath = '/onboarding'
            }
          }
        } catch (dbError) {
          console.error('❌ Database error checking onboarding status:', dbError)
          console.log('🎯 Defaulting to onboarding due to DB error')
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
      const logEvent: any = {
        event_type: 'LOGIN',
        success: false,
        error: error.message
      };
      
      const ipAddress = request.headers.get('x-forwarded-for');
      if (ipAddress) logEvent.ip_address = ipAddress;
      
      const userAgent = request.headers.get('user-agent');
      if (userAgent) logEvent.user_agent = userAgent;
      
      await supabaseLogger.logSecurityEvent(logEvent);
    } catch (logError) {
      console.warn('Failed to log general auth callback error:', logError)
    }

    return NextResponse.redirect(
      new URL('/auth/login?error=' + encodeURIComponent('Authentication error'), request.url)
    )
  }
}

