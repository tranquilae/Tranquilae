export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr'
import { checkAdminAccess } from '@/lib/supabase'
import { logSecurityEvent } from '@/lib/supabase-logger'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
        },
      }
    )

    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      await logSecurityEvent({
        event_type: 'UNAUTHORIZED_ACCESS',
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown',
        success: false,
        error: 'No valid session',
        metadata: { endpoint: '/api/admin/auth/check' }
      })

      return NextResponse.json(
        { error: 'Unauthorized', isAdmin: false },
        { status: 401 }
      )
    }

    const isAdmin = await checkAdminAccess(user.id)
    
    if (!isAdmin) {
      await logSecurityEvent({
        event_type: 'UNAUTHORIZED_ACCESS',
        user_id: user.id,
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown',
        success: false,
        error: 'Insufficient privileges - admin access required',
        metadata: { endpoint: '/api/admin/auth/check' }
      })

      return NextResponse.json(
        { error: 'Access denied', isAdmin: false },
        { status: 403 }
      )
    }

    // Get user role from environment or database
    const allowedAdmins = process.env.ADMIN_USER_IDS?.split(',') || []
    const superAdmins = process.env.SUPER_ADMIN_USER_IDS?.split(',') || []
    
    let role = 'admin'
    if (superAdmins.includes(user.id)) {
      role = 'super_admin'
    }

    return NextResponse.json({
      isAdmin: true,
      role,
      user: {
        id: user.id,
        email: user.email,
        last_sign_in_at: user.last_sign_in_at
      }
    })

  } catch (error) {
    console.error('Admin auth check error:', error)
    
    await logSecurityEvent({
      event_type: 'UNAUTHORIZED_ACCESS',
      ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      user_agent: request.headers.get('user-agent') || 'unknown',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      metadata: { endpoint: '/api/admin/auth/check' }
    })

    return NextResponse.json(
      { error: 'Internal server error', isAdmin: false },
      { status: 500 }
    )
  }
}

