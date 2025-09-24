import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { amount = 1 } = body || {}

    if (!process.env.DATABASE_URL) return NextResponse.json({ error: 'DB not configured' }, { status: 500 })
    const { neon } = await import('@neondatabase/serverless')
    const sql = neon(process.env.DATABASE_URL)

    await sql`INSERT INTO health_data_points (user_id, data_type, value, unit, timestamp, metadata) VALUES (${user.id}, ${'water'}, ${amount}, ${'glasses'}, ${new Date()}, ${JSON.stringify({ source: 'quick-log' })})`

    return NextResponse.json({ success: true })
  } catch (e: any) {
    console.error('Quick log water error:', e)
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 })
  }
}

