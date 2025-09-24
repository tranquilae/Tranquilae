export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr'
import { supabaseAdmin, checkAdminAccess } from '@/lib/supabase'
import { logSecurityEvent } from '@/lib/supabase-logger'

export async function GET(request: NextRequest) {
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
      await logSecurityEvent({
        event_type: 'UNAUTHORIZED_ACCESS',
        user_id: user.id,
        ip_address: request.headers.get('x-forwarded-for') || 'unknown',
        success: false,
        error: 'Attempted to access admin stats without privileges',
        metadata: { endpoint: '/api/admin/stats' }
      })
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Check if admin client is available
    if (!supabaseAdmin) {
      console.error('Supabase admin client not available')
      return NextResponse.json({ error: 'Admin operations not configured' }, { status: 503 })
    }

    // Use the Supabase function to get stats
    const { data: statsData, error: statsError } = await supabaseAdmin
      .rpc('get_admin_stats')

    if (statsError) {
      console.error('Error fetching admin stats:', statsError)
      return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
    }

    return NextResponse.json(statsData)

  } catch (error) {
    console.error('Admin stats API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


