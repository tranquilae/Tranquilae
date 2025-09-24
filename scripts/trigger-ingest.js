#!/usr/bin/env node

/**
 * Trigger server-side ingestion of workout media.
 * Requires env:
 *   SITE_URL (e.g. https://your-app.vercel.app)
 *   ADMIN_IMPORT_TOKEN (must match server env on Vercel)
 */

const SITE_URL = process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL
const TOKEN = process.env.ADMIN_IMPORT_TOKEN

if (!SITE_URL || !TOKEN) {
  console.error('SITE_URL and ADMIN_IMPORT_TOKEN are required env vars')
  process.exit(1)
}

const DEFAULT_SEEDS = [
  'https://www.muscleandstrength.com/workout-routines',
  'https://www.fitnessblender.com/videos?focus[]=1&focus[]=2&focus[]=3&focus[]=4'
]

;(async () => {
  try {
    const res = await fetch(`${SITE_URL}/api/admin/exercises/media/ingest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Token': TOKEN,
      },
      body: JSON.stringify({ seeds: DEFAULT_SEEDS, maxDepth: 2 })
    })
    const body = await res.text()
    console.log('Ingest status:', res.status)
    console.log(body)
    if (!res.ok) process.exit(1)
  } catch (e) {
    console.error('Ingest trigger failed:', e)
    process.exit(1)
  }
})()

