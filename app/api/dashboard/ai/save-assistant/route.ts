import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'

// Internal endpoint to save assistant message (used after provider call)
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { conversation_id, content } = await request.json()
    if (!conversation_id || !content) {
      return NextResponse.json({ error: 'conversation_id and content required' }, { status: 400 })
    }

    const { neon } = await import('@neondatabase/serverless')
    if (!process.env['DATABASE_URL']) return NextResponse.json({ error: 'DB not configured' }, { status: 500 })
    const sql = neon(process.env['DATABASE_URL'])

    // Verify conversation belongs to user
    const conv = await sql`SELECT id FROM ai_conversations WHERE id = ${conversation_id} AND user_id = ${user.id}`
    if (!conv || !conv[0]) return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })

    const inserted = await sql`INSERT INTO ai_messages (conversation_id, role, content) VALUES (${conversation_id}, ${'assistant'}, ${content}) RETURNING id`
    const insertedRow = inserted[0];
    if (!insertedRow) {
      return NextResponse.json({ error: 'Failed to insert message' }, { status: 500 });
    }
    return NextResponse.json({ success: true, message_id: insertedRow['id'] })
  } catch (e: any) {
    console.error('Save assistant message error:', e)
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 })
  }
}


