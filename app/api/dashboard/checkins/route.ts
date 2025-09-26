import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { db } = await import('@/lib/database')
    const checkins = await db.listCheckins(user.id, 10)
    return NextResponse.json({ checkins })
  } catch (e: any) {
    console.error('Checkins GET error:', e)
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const mood = typeof body?.mood === 'string' ? body.mood : null
    const energy = Number.isFinite(body?.energy) ? Number(body.energy) : null

    const { db } = await import('@/lib/database')
    const created = await db.createCheckin(user.id, { mood, energy })
    return NextResponse.json(created)
  } catch (e: any) {
    console.error('Checkins POST error:', e)
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 })
  }
}


