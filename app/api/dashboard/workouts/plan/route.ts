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

    // TODO: Implement planned workouts in database module
    // For now, return empty array to prevent build errors
    return NextResponse.json({ plan: [] })
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

    // TODO: Implement planned workouts in database module
    // For now, return a mock response to prevent build errors
    const mockWorkout = {
      id: Date.now().toString(),
      name,
      type,
      scheduled_at,
      duration_min,
      exercises,
      created_at: new Date().toISOString()
    }
    return NextResponse.json(mockWorkout)
  } catch (e: any) {
    console.error('Workouts plan POST error:', e)
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 })
  }
}


