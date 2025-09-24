import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const url = new URL(request.url)
    const date = url.searchParams.get('date') || new Date().toISOString().split('T')[0]

    const { db } = await import('@/lib/database')
    const meals = await db.listMealsByDate(user.id, date)
    return NextResponse.json({ meals })
  } catch (e: any) {
    console.error('Meals GET error:', e)
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { name, time = null, type, calories, foods = [], date = new Date().toISOString().split('T')[0] } = body || {}

    if (!name || !type || typeof calories !== 'number') {
      return NextResponse.json({ error: 'name, type and calories are required' }, { status: 400 })
    }

    const { db } = await import('@/lib/database')
    const created = await db.addMeal(user.id, { name, time, type, calories, foods, date })

    // Also record calories into health_data_points for daily stats
    try {
      const { neon } = await import('@neondatabase/serverless')
      const sql = neon(process.env.DATABASE_URL!)
      await sql`INSERT INTO health_data_points (user_id, integration_id, data_type, value, unit, timestamp, metadata)
        VALUES (${user.id}, ${null}, ${'calories'}, ${calories}, ${'kcal'}, ${new Date().toISOString()}, ${JSON.stringify({ source: 'meal' })})`
    } catch (dpErr) {
      console.warn('Failed to insert health_data_points for meal:', dpErr)
    }

    return NextResponse.json(created)
  } catch (e: any) {
    console.error('Meals POST error:', e)
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 })
  }
}

