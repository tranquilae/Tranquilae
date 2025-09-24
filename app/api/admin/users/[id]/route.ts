import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { supabaseAdmin, checkAdminAccess } from '@/lib/supabase'
import { logSecurityEvent, logDatabaseEvent } from '@/lib/supabase-logger'

// GET single user
export async function GET(
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
      await logSecurityEvent({
        event_type: 'UNAUTHORIZED_ACCESS',
        user_id: user.id,
        ip_address: request.headers.get('x-forwarded-for') || 'unknown',
        success: false,
        error: 'Attempted to access user details without admin privileges',
        metadata: { endpoint: `/api/admin/users/${params.id}` }
      })
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Check if admin client is available
    if (!supabaseAdmin) {
      console.error('Supabase admin client not available')
      return NextResponse.json({ error: 'Admin operations not configured' }, { status: 503 })
    }

    // Get user details including subscription info
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select(`
        id, 
        email, 
        name,
        role,
        plan,
        status,
        onboarding_complete,
        created_at,
        updated_at,
        last_sign_in_at,
        email_confirmed_at
      `)
      .eq('id', params.id)
      .single()

    if (userError) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get subscription data
    const { data: subscription } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('user_id', params.id)
      .single()

    // Log the access
    await logDatabaseEvent({
      table_name: 'users',
      operation: 'SELECT',
      user_id: user.id,
      record_id: params.id,
      metadata: { admin_action: 'view_user_details' },
      ip_address: request.headers.get('x-forwarded-for') || 'unknown',
      user_agent: request.headers.get('user-agent') || 'unknown'
    })

    return NextResponse.json({
      user: userData,
      subscription
    })

  } catch (error) {
    console.error('Get user API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update user
export async function PUT(
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

    // Check if admin client is available
    if (!supabaseAdmin) {
      console.error('Supabase admin client not available')
      return NextResponse.json({ error: 'Admin operations not configured' }, { status: 503 })
    }

    const body = await request.json()
    const { name, role, plan, status } = body

    // Get current user data for logging
    const { data: currentUser } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', params.id)
      .single()

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Prevent admins from modifying their own role or status
    if (params.id === user.id && (role !== currentUser.role || status !== currentUser.status)) {
      return NextResponse.json({ 
        error: 'Cannot modify your own role or status' 
      }, { status: 400 })
    }

    // Update user
    const updateData: any = { updated_at: new Date().toISOString() }
    if (name !== undefined) updateData.name = name
    if (role !== undefined) updateData.role = role
    if (plan !== undefined) updateData.plan = plan
    if (status !== undefined) updateData.status = status

    const { data: updatedUser, error: updateError } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating user:', updateError)
      return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
    }

    // Log the update
    await logDatabaseEvent({
      table_name: 'users',
      operation: 'UPDATE',
      user_id: user.id,
      record_id: params.id,
      old_data: currentUser,
      new_data: updatedUser,
      metadata: { 
        admin_action: 'update_user',
        updated_fields: Object.keys(updateData).filter(key => key !== 'updated_at')
      },
      ip_address: request.headers.get('x-forwarded-for') || 'unknown',
      user_agent: request.headers.get('user-agent') || 'unknown'
    })

    return NextResponse.json({ user: updatedUser })

  } catch (error) {
    console.error('Update user API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE user
export async function DELETE(
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

    // Check if user is super admin for deletions
    const superAdmins = process.env.SUPER_ADMIN_USER_IDS?.split(',') || []
    if (!superAdmins.includes(user.id)) {
      return NextResponse.json({ 
        error: 'Super admin privileges required for user deletion' 
      }, { status: 403 })
    }

    // Prevent self-deletion
    if (params.id === user.id) {
      return NextResponse.json({ 
        error: 'Cannot delete your own account' 
      }, { status: 400 })
    }

    // Check if admin client is available
    if (!supabaseAdmin) {
      console.error('Supabase admin client not available')
      return NextResponse.json({ error: 'Admin operations not configured' }, { status: 503 })
    }

    // Get user data before deletion for logging
    const { data: userToDelete } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', params.id)
      .single()

    if (!userToDelete) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Use the safe deletion function
    const { data, error } = await supabaseAdmin
      .rpc('admin_delete_user', { target_user_id: params.id })

    if (error) {
      console.error('Error deleting user:', error)
      return NextResponse.json({ 
        error: error.message || 'Failed to delete user' 
      }, { status: 500 })
    }

    // Log the deletion
    await logDatabaseEvent({
      table_name: 'users',
      operation: 'DELETE',
      user_id: user.id,
      record_id: params.id,
      old_data: userToDelete,
      metadata: { 
        admin_action: 'delete_user',
        deleted_user_email: userToDelete.email
      },
      ip_address: request.headers.get('x-forwarded-for') || 'unknown',
      user_agent: request.headers.get('user-agent') || 'unknown'
    })

    return NextResponse.json({ 
      success: true, 
      message: 'User deleted successfully' 
    })

  } catch (error) {
    console.error('Delete user API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
