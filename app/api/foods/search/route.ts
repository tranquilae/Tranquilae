import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const query = (searchParams.get('query') || '').trim()
    if (!query) return NextResponse.json({ error: 'query is required' }, { status: 400 })

    const appId = process.env['EDAMAM_FOOD_APP_ID']
    const appKey = process.env['EDAMAM_FOOD_APP_KEY']
    if (!appId || !appKey) {
      return NextResponse.json({ error: 'Edamam Food API not configured' }, { status: 500 })
    }

    const url = new URL('https://api.edamam.com/api/food-database/v2/parser')
    url.searchParams.set('app_id', String(appId))
    url.searchParams.set('app_key', String(appKey))
    url.searchParams.set('ingr', query)
    url.searchParams.set('page', '0')

    const res = await fetch(url, { method: 'GET', headers: { 'Accept': 'application/json' }, cache: 'no-store' })
    if (!res.ok) {
      const text = await res.text()
      return NextResponse.json({ error: 'Edamam error', details: text }, { status: res.status })
    }
    const data = await res.json()
    return NextResponse.json({ results: data })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 })
  }
}


