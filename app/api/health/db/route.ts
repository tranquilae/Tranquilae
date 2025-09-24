import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    if (!process.env['DATABASE_URL']) {
      return NextResponse.json({
        ok: false,
        error: 'DATABASE_URL not configured',
      }, { status: 500 })
    }

    const { neon } = await import('@neondatabase/serverless')
    const sql = neon(process.env['DATABASE_URL'])

    const result = await sql`SELECT 1 as ok, NOW() as now`

    return NextResponse.json({
      ok: true,
      now: result?.[0]?.now ?? null,
      message: 'Database connection successful'
    })
  } catch (error: any) {
    console.error('Health DB error:', error)
    return NextResponse.json({ ok: false, error: error?.message || 'Unknown error' }, { status: 500 })
  }
}


