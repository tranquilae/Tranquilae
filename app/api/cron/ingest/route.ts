import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const site = process.env['NEXT_PUBLIC_SITE_URL']
    const token = process.env['ADMIN_IMPORT_TOKEN']
    if (!site || !token) return NextResponse.json({ error: 'Missing env' }, { status: 500 })

    const seedsEnv = process.env['ADMIN_INGEST_SEEDS'] || ''
    const seeds = seedsEnv
      ? seedsEnv.split(',').map(s => s.trim()).filter(Boolean)
      : [
          'https://www.muscleandstrength.com/workout-routines',
          'https://www.fitnessblender.com/videos?focus[]=1&focus[]=2&focus[]=3&focus[]=4'
        ]

    const depth = Number(process.env['ADMIN_INGEST_DEPTH'] || 2)
    const delayMs = Number(process.env['ADMIN_INGEST_DELAY_MS'] || 300)
    const maxPages = Number(process.env['ADMIN_INGEST_MAXPAGES'] || 500)

    const res = await fetch(`${site}/api/admin/exercises/media/ingest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Token': token,
      },
      body: JSON.stringify({ seeds, maxDepth: depth, delayMs, maxPages })
    })

    const data = await res.json().catch(() => ({}))
    return NextResponse.json({ status: res.status, data })
  } catch (e: any) {
    console.error('Cron ingest error:', e)
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 })
  }
}


