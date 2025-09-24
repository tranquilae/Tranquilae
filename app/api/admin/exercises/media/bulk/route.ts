import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const items: Array<{ name:string; video_url:string }> = Array.isArray(body) ? body : []
    if (items.length === 0) return NextResponse.json({ error: 'No items provided' }, { status: 400 })

    const { db } = await import('@/lib/database')
    const saved: any[] = []
    for (const it of items) {
      if (!it.name || !it.video_url) continue
      const s = await db.upsertExerciseMedia(it.name, it.video_url)
      saved.push(s)
    }
    return NextResponse.json({ success: true, saved })
  } catch (e: any) {
    console.error('Exercise media BULK POST error:', e)
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 })
  }
}


