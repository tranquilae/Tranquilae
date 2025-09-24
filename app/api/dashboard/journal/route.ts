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
    const entries = await db.listJournalEntries(user.id)
    return NextResponse.json({ entries })
  } catch (e: any) {
    console.error('Journal GET error:', e)
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
    const { content, prompt = null, mood = null } = body || {}
    if (!content || typeof content !== 'string') {
      return NextResponse.json({ error: 'content is required' }, { status: 400 })
    }
    const { db } = await import('@/lib/database')
    const created = await db.createJournalEntry(user.id, { content, prompt, mood })
    return NextResponse.json(created)
  } catch (e: any) {
    console.error('Journal POST error:', e)
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 })
  }
}


