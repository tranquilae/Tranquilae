import { NextResponse } from 'next/server'
import { createClient as createServerSupabase } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
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

    // Use health_data_points with data_type = 'exercise'
    const weekSummary = await sql`
      SELECT 
        COUNT(*)::int AS entries,
        COALESCE(SUM(value), 0) AS total_minutes
      FROM health_data_points
      WHERE user_id = ${user.id} 
        AND data_type = 'exercise' 
        AND timestamp >= NOW() - interval '7 days'
    `

    const recent = await sql`
      SELECT timestamp, value, unit, metadata 
      FROM health_data_points
      WHERE user_id = ${user.id} AND data_type = 'exercise'
      ORDER BY timestamp DESC
      LIMIT 10
    `

    return NextResponse.json({
      userId: user.id,
      summary: {
        totalWorkoutsThisWeek: Number(weekSummary?.[0]?.entries ?? 0),
        totalMinutesThisWeek: Number(weekSummary?.[0]?.total_minutes ?? 0)
      },
      workouts: recent.map((r: any) => ({
        timestamp: r.timestamp,
        minutes: Number(r.value),
        unit: r.unit,
        metadata: r.metadata || null
      }))
    })
  } catch (error: any) {
    console.error('Workouts API error:', error)
    return NextResponse.json({ error: error?.message || 'Unknown error' }, { status: 500 })
  }
}


