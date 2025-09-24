import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'

// Admin endpoint for managing exercise media overrides (simple example)
export async function GET() {
  try {
    const supabase = await createClient()
    // Attempt token auth first (for client fetches)
    const headers = (await import('next/headers')).headers
    const authHeader = (await headers()).get('authorization') || ''
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.substring(7)
      : undefined
    const { data: { user } } = token
      ? await supabase.auth.getUser(token)
      : await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { db } = await import('@/lib/database')
    const list = await db.listExerciseMedia()
    return NextResponse.json({ media: list })
  } catch (e: any) {
    console.error('Exercise media GET error:', e)
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
    const { data: { user } } = token
      ? await supabase.auth.getUser(token)
      : await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { name, video_url } = body || {}
    if (!name || !video_url) return NextResponse.json({ error: 'name and video_url required' }, { status: 400 })

    const { db } = await import('@/lib/database')
    const saved = await db.upsertExerciseMedia(name, video_url)
    return NextResponse.json(saved)
  } catch (e: any) {
    console.error('Exercise media POST error:', e)
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 })
  }
}


