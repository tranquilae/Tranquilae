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
    const messages = await db.listAIMessages(user.id)
    const grokConfigured = !!(process.env.GROK_API_KEY || process.env.XAI_API_KEY)
    const openaiConfigured = !!process.env.OPENAI_API_KEY
    return NextResponse.json({ userId: user.id, messages, provider_status: { grokConfigured, openaiConfigured } })
  } catch (error: any) {
    console.error('AI Coach API error:', error)
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

    const grokConfigured = !!(process.env.GROK_API_KEY || process.env.XAI_API_KEY)
    const openaiConfigured = !!process.env.OPENAI_API_KEY
    if (!grokConfigured && !openaiConfigured) {
      return NextResponse.json({ error: 'No AI provider configured' }, { status: 501 })
    }
    const { content } = body || {}
    if (!content || typeof content !== 'string') {
      return NextResponse.json({ error: 'content is required' }, { status: 400 })
    }

    const { db } = await import('@/lib/database')
    const result = await db.addAIUserMessage(user.id, content)

    // Try Grok first (primary)
    let savedAssistant = false
    try {
      const grokKey = process.env.GROK_API_KEY || process.env.XAI_API_KEY
      if (grokKey) {
        const grokRes = await fetch('https://api.x.ai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${grokKey}`
          },
          body: JSON.stringify({
            model: 'grok-2-latest',
            messages: [
              { role: 'system', content: 'You are a helpful health coach.' },
              { role: 'user', content }
            ]
          })
        })
        if (grokRes.ok) {
          const data = await grokRes.json()
          const assistant = data?.choices?.[0]?.message?.content
          if (assistant && typeof assistant === 'string') {
            const { db } = await import('@/lib/database')
            // Save assistant directly
            const { neon } = await import('@neondatabase/serverless')
            const sql = neon(process.env.DATABASE_URL!)
            await sql`INSERT INTO ai_messages (conversation_id, role, content) VALUES (${result.conversation_id}, ${'assistant'}, ${assistant})`
            savedAssistant = true
          }
        }
      }
    } catch (aiErr) {
      console.warn('Grok call failed:', aiErr)
    }

    // Fallback to OpenAI if Grok not saved and we have budget
    if (!savedAssistant) {
      try {
        const openaiKey = process.env.OPENAI_API_KEY
        if (openaiKey) {
          // Check plan and budget
          const { db } = await import('@/lib/database')
          const userData = await db.getUserById(user.id)
          const plan = userData?.plan || 'explorer'
          const isExplorer = plan === 'explorer'
          const maxTokens = Number(process.env.OPENAI_MAX_TOKENS || 0)
          const monthlyBudget = Number(process.env.OPENAI_MONTHLY_BUDGET || 0)

          let withinBudget = true
          if (isExplorer && (maxTokens > 0 || monthlyBudget > 0)) {
            const usage = await db.getAIUsage(user.id, 'openai')
            const used = Number(usage?.tokens_used || 0)
            // We only enforce token limit here; cost budget could be mapped later
            withinBudget = used < maxTokens || maxTokens === 0
          }

          if (!isExplorer || withinBudget) {
            const oaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${openaiKey}`
              },
              body: JSON.stringify({
                model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
                messages: [
                  { role: 'system', content: 'You are a helpful health coach.' },
                  { role: 'user', content }
                ]
              })
            })
            if (oaiRes.ok) {
              const data = await oaiRes.json()
              const assistant = data?.choices?.[0]?.message?.content
              if (assistant && typeof assistant === 'string') {
                const tokens = Number(data?.usage?.total_tokens || Math.ceil((content.length + assistant.length) / 4))
                await db.addAIUsage(user.id, 'openai', tokens)
                const { neon } = await import('@neondatabase/serverless')
                const sql = neon(process.env.DATABASE_URL!)
                await sql`INSERT INTO ai_messages (conversation_id, role, content) VALUES (${result.conversation_id}, ${'assistant'}, ${assistant})`
                savedAssistant = true
              }
            }
          }
        }
      } catch (fbErr) {
        console.warn('OpenAI fallback failed:', fbErr)
      }
    }

    return NextResponse.json({ success: true, ...result })
  } catch (error: any) {
    console.error('AI Coach API POST error:', error)
    return NextResponse.json({ error: error?.message || 'Unknown error' }, { status: 500 })
  }
}

