import { NextResponse } from 'next/server'
import { createClient as createServerSupabase } from '@/utils/supabase/server'
import { headers } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createServerSupabase()
    const authHeader = (await headers()).get('authorization') || ''
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.substring(7)
      : undefined
    const { data: { user }, error: authError } = token
      ? await supabase.auth.getUser(token)
      : await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { db } = await import('@/lib/database')
    const sessions = await db.listMindfulnessSessions(user.id)

    // Summaries
    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const weekly = sessions.filter(s => new Date(s.started_at) >= weekAgo)
    const totalMinutesThisWeek = weekly.reduce((sum, s) => sum + (s.duration_minutes || 0), 0)

    return NextResponse.json({
      userId: user.id,
      summary: {
        totalSessionsThisWeek: weekly.length,
        totalMinutesThisWeek
      },
      sessions
    })
  } catch (error: any) {
    console.error('Mindfulness API error:', error)
    return NextResponse.json({ error: error?.message || 'Unknown error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabase()
    const authHeader = request.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.substring(7)
      : undefined
    const { data: { user }, error: authError } = token
      ? await supabase.auth.getUser(token)
      : await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { started_at = undefined, duration_minutes = 0, type = 'meditation', notes = null } = body || {}

    const { db } = await import('@/lib/database')
    const created = await db.createMindfulnessSession(user.id, { started_at: started_at ? new Date(started_at) : undefined, duration_minutes, type, notes })
    return NextResponse.json(created)
  } catch (error: any) {
    console.error('Mindfulness API POST error:', error)
    return NextResponse.json({ error: error?.message || 'Unknown error' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createServerSupabase()
    const authHeader = request.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.substring(7)
      : undefined
    const { data: { user }, error: authError } = token
      ? await supabase.auth.getUser(token)
      : await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const id = url.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

    const { db } = await import('@/lib/database')
    await db.deleteMindfulnessSession(user.id, id)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Mindfulness API DELETE error:', error)
    return NextResponse.json({ error: error?.message || 'Unknown error' }, { status: 500 })
  }
}

