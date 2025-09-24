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

    const body = await request.json()
    const { newEmail } = body

    if (!newEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      return NextResponse.json({ error: 'Valid email address required' }, { status: 400 })
    }

    // Check if admin client is available
    if (!supabaseAdmin) {
      console.error('Supabase admin client not available')
      return NextResponse.json({ error: 'Admin operations not configured' }, { status: 503 })
    }

    // Get current user data
    const { data: currentUser } = await supabaseAdmin
      .from('users')
      .select('email')
      .eq('id', params.id)
      .single()

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if new email is already in use
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', newEmail)
      .single()

    if (existingUser) {
      return NextResponse.json({ 
        error: 'Email address is already in use' 
      }, { status: 409 })
    }

    // Update user email using Supabase Auth admin API
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      params.id,
      { 
        email: newEmail,
        email_confirm: true // Auto-confirm the email change
      }
    )

    if (error) {
      console.error('Error updating user email:', error)
      return NextResponse.json({ 
        error: 'Failed to update email address' 
      }, { status: 500 })
    }

    // Update email in users table as well
    const { error: dbError } = await supabaseAdmin
      .from('users')
      .update({ 
        email: newEmail,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)

    if (dbError) {
      console.error('Error updating email in users table:', dbError)
    }

    // Log the email change
    await logDatabaseEvent({
      table_name: 'users',
      operation: 'UPDATE',
      user_id: user.id,
      record_id: params.id,
      old_data: { email: currentUser.email },
      new_data: { email: newEmail },
      metadata: { 
        admin_action: 'change_user_email',
        old_email: currentUser.email,
        new_email: newEmail
      },
      ip_address: request.headers.get('x-forwarded-for') || 'unknown',
      user_agent: request.headers.get('user-agent') || 'unknown'
    })

    return NextResponse.json({ 
      success: true,
      message: 'Email address updated successfully',
      user: data.user
    })

  } catch (error) {
    console.error('Change email API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
