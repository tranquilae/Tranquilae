import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// GET /api/workouts/calories?activity=running&duration=30&weight=70
export async function GET(req: Request) {
  try {
    const key = process.env['APININJAS_API_KEY']
    if (!key) return NextResponse.json({ error: 'API Ninjas not configured' }, { status: 500 })

    const { searchParams } = new URL(req.url)
    const activity = (searchParams.get('activity') || '').trim()
    const duration = Number(searchParams.get('duration') || 0) // minutes
    const weight = Number(searchParams.get('weight') || 0)     // kg (if supported)

    if (!activity || !duration) {
      return NextResponse.json({ error: 'activity and duration are required' }, { status: 400 })
    }

    const apiUrl = new URL('https://api.api-ninjas.com/v1/caloriesburned')
    apiUrl.searchParams.set('activity', activity)
    if (duration) apiUrl.searchParams.set('duration', String(duration))
    if (weight) apiUrl.searchParams.set('weight', String(weight))

    const res = await fetch(apiUrl, {
      headers: { 'X-Api-Key': key, 'Accept': 'application/json' },
      cache: 'no-store'
    })
    if (!res.ok) {
      const text = await res.text()
      return NextResponse.json({ error: 'API Ninjas error', details: text }, { status: res.status })
    }
    const data = await res.json()
    return NextResponse.json({ results: data })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 })
  }
}


