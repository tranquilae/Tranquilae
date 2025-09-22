import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { supabaseAdmin, checkAdminAccess } from '@/lib/supabase'
import { logSecurityEvent, logDatabaseEvent } from '@/lib/supabase-logger'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
        error: 'Attempted to access users list without admin privileges',
        metadata: { endpoint: '/api/admin/users' }
      })
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const role = searchParams.get('role') || 'all'
    const plan = searchParams.get('plan') || 'all'
    const status = searchParams.get('status') || 'all'
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build query
    let query = supabaseAdmin
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

    // Apply filters
    if (search) {
      query = query.or(`email.ilike.%${search}%,name.ilike.%${search}%`)
    }
    
    if (role !== 'all') {
      query = query.eq('role', role)
    }
    
    if (plan !== 'all') {
      query = query.eq('plan', plan)
    }
    
    if (status !== 'all') {
      query = query.eq('status', status)
    }

    // Apply pagination and ordering
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data: users, error: usersError, count } = await query

    if (usersError) {
      console.error('Error fetching users:', usersError)
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }

    // Also get total count for pagination
    const { count: totalCount, error: countError } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true })

    // Log the database access
    await logDatabaseEvent({
      table_name: 'users',
      operation: 'SELECT',
      user_id: user.id,
      metadata: {
        admin_action: 'list_users',
        filters: { search, role, plan, status },
        result_count: users?.length || 0
      },
      ip_address: request.headers.get('x-forwarded-for') || 'unknown',
      user_agent: request.headers.get('user-agent') || 'unknown'
    })

    return NextResponse.json({
      users: users || [],
      pagination: {
        total: totalCount || 0,
        offset,
        limit,
        hasMore: (users?.length || 0) === limit
      }
    })

  } catch (error) {
    console.error('Admin users API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
