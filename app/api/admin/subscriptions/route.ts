export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr'
import { supabaseAdmin, checkAdminAccess } from '@/lib/supabase'
import { logSecurityEvent, logDatabaseEvent } from '@/lib/supabase-logger'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

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
        error: 'Attempted to access subscriptions list without admin privileges',
        metadata: { endpoint: '/api/admin/subscriptions' }
      })
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'all'
    const plan = searchParams.get('plan') || 'all'
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build query - join with users to get user details
    let query = supabaseAdmin
      .from('subscriptions')
      .select(`
        *,
        users!inner(
          id,
          name,
          email,
          plan,
          created_at
        )
      `)

    // Apply filters
    if (status !== 'all') {
      query = query.eq('status', status)
    }
    
    if (plan !== 'all') {
      query = query.eq('plan', plan)
    }

    // Apply pagination and ordering
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data: subscriptions, error: subscriptionsError } = await query

    if (subscriptionsError) {
      console.error('Error fetching subscriptions:', subscriptionsError)
      return NextResponse.json({ error: 'Failed to fetch subscriptions' }, { status: 500 })
    }

    // Get total count for pagination
    const { count: totalCount } = await supabaseAdmin
      .from('subscriptions')
      .select('*', { count: 'exact', head: true })

    // Transform data to match expected format
    const transformedSubscriptions = subscriptions?.map(sub => ({
      id: sub.id,
      user_id: sub.user_id,
      user_name: sub.users?.name || 'No name',
      user_email: sub.users?.email,
      plan: sub.plan,
      status: sub.status,
      stripe_subscription_id: sub.stripe_subscription_id,
      stripe_customer_id: sub.stripe_customer_id,
      trial_end: sub.trial_end,
      current_period_start: sub.current_period_start,
      current_period_end: sub.current_period_end,
      cancel_at_period_end: sub.cancel_at_period_end,
      created_at: sub.created_at,
      updated_at: sub.updated_at
    })) || []

    // Log the database access
    await logDatabaseEvent({
      table_name: 'subscriptions',
      operation: 'SELECT',
      user_id: user.id,
      metadata: {
        admin_action: 'list_subscriptions',
        filters: { status, plan },
        result_count: transformedSubscriptions.length
      },
      ip_address: request.headers.get('x-forwarded-for') || 'unknown',
      user_agent: request.headers.get('user-agent') || 'unknown'
    })

    return NextResponse.json({
      subscriptions: transformedSubscriptions,
      pagination: {
        total: totalCount || 0,
        offset,
        limit,
        hasMore: (transformedSubscriptions.length) === limit
      }
    })

  } catch (error) {
    console.error('Admin subscriptions API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

