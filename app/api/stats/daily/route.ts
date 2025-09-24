import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'

// Unified daily stats from health_data_points
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const url = new URL(request.url)
    const dateStr = url.searchParams.get('date') // YYYY-MM-DD

    const dayStart = dateStr ? new Date(dateStr + 'T00:00:00Z') : new Date(new Date().toDateString())
    const dayEnd = new Date(dayStart)
    dayEnd.setUTCDate(dayStart.getUTCDate() + 1)

    if (!process.env.DATABASE_URL) return NextResponse.json({ stats: {} })
    const { neon } = await import('@neondatabase/serverless')
    const sql = neon(process.env.DATABASE_URL)

    const s = await sql`
      SELECT 
        COALESCE(SUM(CASE WHEN data_type = 'calories' AND user_id = ${user.id} AND timestamp >= ${dayStart} AND timestamp < ${dayEnd} THEN value END), 0) AS calories,
        COALESCE(SUM(CASE WHEN data_type = 'steps' AND user_id = ${user.id} AND timestamp >= ${dayStart} AND timestamp < ${dayEnd} THEN value END), 0) AS steps,
        COALESCE(SUM(CASE WHEN data_type = 'exercise' AND user_id = ${user.id} AND timestamp >= ${dayStart} AND timestamp < ${dayEnd} THEN value END), 0) AS active_minutes,
        COALESCE(SUM(CASE WHEN data_type = 'burned' AND user_id = ${user.id} AND timestamp >= ${dayStart} AND timestamp < ${dayEnd} THEN value END), 0) AS burned,
        COALESCE(SUM(CASE WHEN data_type = 'water' AND user_id = ${user.id} AND timestamp >= ${dayStart} AND timestamp < ${dayEnd} THEN value END), 0) AS water,
        COALESCE(SUM(CASE WHEN data_type = 'sleep' AND user_id = ${user.id} AND timestamp >= ${dayStart} AND timestamp < ${dayEnd} THEN value END), 0) AS sleep
      FROM health_data_points
    `

    const stats = {
      dailyCalorieGoal: 0, // goals are fetched separately by hook
      consumedCalories: Number(s?.[0]?.calories || 0),
      burnedCalories: Number(s?.[0]?.burned || 0),
      steps: Number(s?.[0]?.steps || 0),
      stepsGoal: 0,
      waterGlasses: Number(s?.[0]?.water || 0),
      waterGoal: 0,
      sleepHours: Number(s?.[0]?.sleep || 0),
      sleepGoal: 0,
      activeMinutes: Number(s?.[0]?.active_minutes || 0),
      activeGoal: 0,
      macros: {
        carbs: { consumed: 0, goal: 0 },
        protein: { consumed: 0, goal: 0 },
        fat: { consumed: 0, goal: 0 },
      }
    }

    return NextResponse.json({ stats })
  } catch (e: any) {
    console.error('Daily stats error:', e)
    return NextResponse.json({ stats: {} })
  }
}

