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
      process.env['NEXT_PUBLIC_SUPABASE_URL']!,
      process.env['NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY'] || process.env['NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'] || process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!,
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
    const { action, reason } = body // action: 'suspend' or 'activate'

    if (!action || !['suspend', 'activate'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    // Prevent suspending own account
    if (params.id === user.id) {
      return NextResponse.json({ 
        error: 'Cannot suspend your own account' 
      }, { status: 400 })
    }

    // Check if admin client is available
    if (!supabaseAdmin) {
      console.error('Supabase admin client not available')
      return NextResponse.json({ error: 'Admin operations not configured' }, { status: 503 })
    }

    // Get current user data
    const { data: currentUser } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', params.id)
      .single()

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const newStatus = action === 'suspend' ? 'suspended' : 'active'

    // Update user status
    const { data: updatedUser, error: updateError } = await supabaseAdmin
      .from('users')
      .update({ 
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating user status:', updateError)
      return NextResponse.json({ error: 'Failed to update user status' }, { status: 500 })
    }

    // Log the action
    await logDatabaseEvent({
      table_name: 'users',
      operation: 'UPDATE',
      user_id: user.id,
      record_id: params.id,
      old_data: { status: currentUser.status },
      new_data: { status: newStatus },
      metadata: { 
        admin_action: `${action}_user`,
        reason: reason || 'No reason provided',
        target_user_email: currentUser.email
      },
      ip_address: request.headers.get('x-forwarded-for') || 'unknown',
      user_agent: request.headers.get('user-agent') || 'unknown'
    })

    return NextResponse.json({ 
      success: true,
      user: updatedUser,
      message: `User ${action === 'suspend' ? 'suspended' : 'activated'} successfully`
    })

  } catch (error) {
    console.error('Suspend/activate user API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
