import { NextResponse } from 'next/server'
import { createClient as createServerSupabase } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const supabase = await createServerSupabase()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!process.env['DATABASE_URL']) {
      return NextResponse.json({ error: 'Server database not configured' }, { status: 500 })
    }

    const { neon } = await import('@neondatabase/serverless')
    const sql = neon(process.env['DATABASE_URL'])

    const totals = await sql`
      SELECT 
        COALESCE(SUM(CASE WHEN timestamp >= date_trunc('day', NOW()) THEN value END), 0) AS today,
        COALESCE(SUM(CASE WHEN timestamp >= NOW() - interval '7 days' THEN value END), 0) AS week,
        COALESCE(SUM(CASE WHEN timestamp >= NOW() - interval '30 days' THEN value END), 0) AS month
      FROM health_data_points
      WHERE user_id = ${user.id} AND data_type = 'calories'
    `

    const breakdownRows = await sql`
      SELECT date_trunc('day', timestamp) AS day, SUM(value) AS total
      FROM health_data_points
      WHERE user_id = ${user.id} AND data_type = 'calories' AND timestamp >= NOW() - interval '7 days'
      GROUP BY 1
      ORDER BY 1
    `

    return NextResponse.json({
      userId: user.id,
      totals: {
        today: Number(totals?.[0]?.['today'] ?? 0),
        week: Number(totals?.[0]?.['week'] ?? 0),
        month: Number(totals?.[0]?.['month'] ?? 0)
      },
      breakdown: breakdownRows.map((r: any) => ({ day: r['day'], total: Number(r['total']) }))
    })
  } catch (error: any) {
    console.error('Calories API error:', error)
    return NextResponse.json({ error: error?.message || 'Unknown error' }, { status: 500 })
  }
}


