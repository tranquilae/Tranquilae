import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { supabaseAdmin, checkAdminAccess } from '@/lib/supabase'
import { logDatabaseEvent } from '@/lib/supabase-logger'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const isAdmin = await checkAdminAccess(user.id)
    if (!isAdmin) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get target user data
    const { data: targetUser } = await supabaseAdmin
      .from('users')
      .select('email')
      .eq('id', params.id)
      .single()

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Send password reset email using Supabase Auth admin API
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: targetUser.email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password`
      }
    })

    if (error) {
      console.error('Error generating password reset link:', error)
      return NextResponse.json({ 
        error: 'Failed to generate password reset link' 
      }, { status: 500 })
    }

    // Log the password reset action
    await logDatabaseEvent({
      table_name: 'users',
      operation: 'UPDATE',
      user_id: user.id,
      record_id: params.id,
      metadata: { 
        admin_action: 'password_reset_requested',
        target_user_email: targetUser.email,
        reset_link_generated: true
      },
      ip_address: request.headers.get('x-forwarded-for') || 'unknown',
      user_agent: request.headers.get('user-agent') || 'unknown'
    })

    return NextResponse.json({ 
      success: true,
      message: 'Password reset email sent successfully',
      // In development, you might want to return the link
      ...(process.env.NODE_ENV === 'development' && { 
        resetLink: data.properties?.action_link 
      })
    })

  } catch (error) {
    console.error('Password reset API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
