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
        error: 'Attempted to access admin activity logs without privileges',
        metadata: { endpoint: '/api/admin/activity/recent' }
      })
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get recent audit logs
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Admin client not available' }, { status: 503 })
    }
    
    const { data: activityData, error: activityError } = await supabaseAdmin
      .from('audit_logs')
      .select('id, event_type, user_id, event_data, created_at')
      .order('created_at', { ascending: false })
      .limit(20)

    if (activityError) {
      console.error('Error fetching recent activity:', activityError)
      return NextResponse.json({ error: 'Failed to fetch activity' }, { status: 500 })
    }

    return NextResponse.json(activityData || [])

  } catch (error) {
    console.error('Admin activity API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


