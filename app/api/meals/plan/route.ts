import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const calories = Number(body?.calories || 0)
    if (!calories) return NextResponse.json({ error: 'calories is required' }, { status: 400 })

    const appId = process.env.EDAMAM_MEAL_APP_ID
    const appKey = process.env.EDAMAM_MEAL_APP_KEY
    if (!appId || !appKey) {
      return NextResponse.json({ error: 'Edamam Meal Planner not configured' }, { status: 500 })
    }

    // NOTE: Replace endpoint/params according to your Edamam plan & docs
    const url = new URL('https://api.edamam.com/api/meal-planner/v1/plan')
    url.searchParams.set('app_id', String(appId))
    url.searchParams.set('app_key', String(appKey))

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ calories }),
      cache: 'no-store'
    })

    if (!res.ok) {
      const text = await res.text()
      return NextResponse.json({ error: 'Edamam planner error', details: text }, { status: res.status })
    }
    const data = await res.json()
    return NextResponse.json({ plan: data })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 })
  }
}

