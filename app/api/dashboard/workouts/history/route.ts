import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { headers } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createClient()
    const authHeader = (await headers()).get('authorization') || ''
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.substring(7)
      : undefined
    const { data: { user }, error } = token
      ? await supabase.auth.getUser(token)
      : await supabase.auth.getUser()
    if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { db } = await import('@/lib/database')
    const history = await db.listWorkoutHistory(user.id)
    return NextResponse.json({ history })
  } catch (e: any) {
    console.error('Workouts history GET error:', e)
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const authHeader = request.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.substring(7)
      : undefined
    const { data: { user }, error } = token
      ? await supabase.auth.getUser(token)
      : await supabase.auth.getUser()
    if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    let { name, date, duration_min = null, calories = null, type = null } = body || {}
    if (!name || !date) return NextResponse.json({ error: 'name and date are required' }, { status: 400 })

    // Auto-estimate calories if missing
    if (calories == null && duration_min != null) {
      const rate = type === 'cardio' ? 10 : type === 'yoga' ? 4 : 6
      calories = Math.round(Number(duration_min) * rate)
    }

    const { db } = await import('@/lib/database')
    const created = await db.logWorkout(user.id, { name, date: new Date(date), duration_min, calories, type })
    return NextResponse.json(created)
  } catch (e: any) {
    console.error('Workouts history POST error:', e)
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 })
  }
}

