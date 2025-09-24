import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'

// Generate simple, data-driven recommendations based on goals and recent health data
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { neon } = await import('@neondatabase/serverless')
    if (!process.env['DATABASE_URL']) return NextResponse.json({ recommendations: [] })
    const sql = neon(process.env['DATABASE_URL'])

    // Fetch goals
    const settings = await sql`SELECT * FROM user_settings WHERE user_id = ${user.id}`
    const s = settings[0] || {}

    // Recent hydration today
    const today = await sql`
      SELECT 
        COALESCE(SUM(CASE WHEN data_type = 'calories' AND timestamp >= date_trunc('day', NOW()) THEN value END), 0) AS cals_today,
        COALESCE(SUM(CASE WHEN data_type = 'exercise' AND timestamp >= NOW() - interval '1 day' THEN value END), 0) AS minutes_today
      FROM health_data_points WHERE user_id = ${user.id}
    `

    const week = await sql`
      SELECT 
        COALESCE(COUNT(CASE WHEN data_type = 'exercise' THEN 1 END), 0) AS workouts_week,
        COALESCE(SUM(CASE WHEN data_type = 'exercise' THEN value END), 0) AS minutes_week
      FROM health_data_points
      WHERE user_id = ${user.id} AND timestamp >= NOW() - interval '7 days'
    `

    const recs: any[] = []

    // Nutrition suggestion
    if ((s['daily_calorie_goal'] || 0) > 0) {
      const calsToday = Number(today?.[0]?.['cals_today'] || 0)
      if (calsToday < (s['daily_calorie_goal'] || 0) * 0.75) {
        recs.push({
          type: 'nutrition',
          title: 'Calorie intake behind',
          description: `You are at ${Math.round(calsToday)} / ${s['daily_calorie_goal']} kcal today. Consider a nutritious snack.`,
          priority: 'medium'
        })
      }
    }

    // Fitness suggestion
    const workoutsWeek = Number(week?.[0]?.['workouts_week'] || 0)
    if (workoutsWeek >= 4) {
      recs.push({
        type: 'fitness',
        title: 'Rest day recommended',
        description: 'You have trained 4+ times this week. Consider active recovery.',
        priority: 'low'
      })
    }

    return NextResponse.json({ recommendations: recs })
  } catch (e: any) {
    console.error('Recommendations API error:', e)
    return NextResponse.json({ recommendations: [] })
  }
}


