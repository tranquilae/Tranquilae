import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { db } = await import('@/lib/database')
    const settings = await db.getUserSettings(user.id)
    return NextResponse.json(settings || {
      user_id: user.id,
      daily_calorie_goal: 0,
      steps_goal: 0,
      water_goal: 0,
      sleep_goal: 0,
      active_minutes_goal: 0,
      macros_goal: { carbs: 0, protein: 0, fat: 0 }
    })
  } catch (e: any) {
    console.error('User settings GET error:', e)
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const allowed: any = {}
    const keys = ['daily_calorie_goal','steps_goal','water_goal','sleep_goal','active_minutes_goal','macros_goal']
    for (const k of keys) if (k in body) allowed[k] = body[k]

    const { db } = await import('@/lib/database')
    const updated = await db.upsertUserSettings(user.id, allowed)
    return NextResponse.json(updated)
  } catch (e: any) {
    console.error('User settings PATCH error:', e)
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 })
  }
}

