import { NextResponse } from 'next/server'
import { createClient as createServerSupabase } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createServerSupabase()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { db } = await import('@/lib/database')
    const notes = await db.listNotes(user.id)
    return NextResponse.json({ userId: user.id, notes })
  } catch (error: any) {
    console.error('Notes API error:', error)
    return NextResponse.json({ error: error?.message || 'Unknown error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabase()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title = null, content, tags = [] } = body || {}
    if (!content || typeof content !== 'string') {
      return NextResponse.json({ error: 'content is required' }, { status: 400 })
    }

    const { db } = await import('@/lib/database')
    const note = await db.createNote(user.id, { title, content, tags })
    return NextResponse.json(note)
  } catch (error: any) {
    console.error('Notes API POST error:', error)
    return NextResponse.json({ error: error?.message || 'Unknown error' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createServerSupabase()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, title = undefined, content = undefined, tags = undefined } = body || {}
    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    const { db } = await import('@/lib/database')
    const updated = await db.updateNote(user.id, id, { title, content, tags })
    return NextResponse.json(updated)
  } catch (error: any) {
    console.error('Notes API PATCH error:', error)
    return NextResponse.json({ error: error?.message || 'Unknown error' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createServerSupabase()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const id = url.searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    const { db } = await import('@/lib/database')
    await db.deleteNote(user.id, id)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Notes API DELETE error:', error)
    return NextResponse.json({ error: error?.message || 'Unknown error' }, { status: 500 })
  }
}

