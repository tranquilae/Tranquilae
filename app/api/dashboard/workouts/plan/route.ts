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
    const plan = await db.listPlannedWorkouts(user.id)
    return NextResponse.json({ plan })
  } catch (e: any) {
    console.error('Workouts plan GET error:', e)
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
    const { name, type = null, scheduled_at = null, duration_min = null, exercises = [] } = body || {}
    if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 })

    const { db } = await import('@/lib/database')
    const created = await db.createPlannedWorkout(user.id, { name, type, scheduled_at: scheduled_at ? new Date(scheduled_at) : null, duration_min, exercises })
    return NextResponse.json(created)
  } catch (e: any) {
    console.error('Workouts plan POST error:', e)
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 })
  }
}


