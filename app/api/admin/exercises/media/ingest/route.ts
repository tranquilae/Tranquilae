import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Server-side ingestion of workout video links with 1-level crawl
export async function POST(request: NextRequest) {
  try {
    const adminToken = request.headers.get('x-admin-token') || ''
    if (!process.env['ADMIN_IMPORT_TOKEN'] || adminToken !== process.env['ADMIN_IMPORT_TOKEN'])
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { seeds = [], maxDepth = 1, delayMs = 300, maxPages = 500 } = await request.json() || {}
    if (!Array.isArray(seeds) || seeds.length === 0)
      return NextResponse.json({ error: 'seeds required' }, { status: 400 })

    const visited = new Set<string>()
    const queue: Array<{ url: string, depth: number }> = []
    for (const s of seeds) queue.push({ url: s, depth: 0 })

    const pages: Array<{ url: string, title: string, videos: string[] }> = []

    const sameDomain = (base: URL, urlStr: string) => {
      try {
        const u = new URL(urlStr, base)
        return u.hostname === base.hostname
      } catch { return false }
    }

    const extractLinks = (base: URL, html: string) => {
      const links = new Set<string>()
      const reHref = /href=["']([^"'#?\s>]+)["']/gi
      let m
      while ((m = reHref.exec(html)) !== null) {
        const rel = m[1]
        if (!rel) continue
        try {
          const abs = new URL(rel, base).toString()
          if (sameDomain(base, abs)) links.add(abs)
        } catch {
          // Skip invalid URLs
          continue
        }
      }
      return Array.from(links)
    }

    const extractTitle = (html: string) => {
      const m = /<title>([^<]+)<\/title>/i.exec(html)
      return m && m[1] ? m[1].trim() : ''
    }

    const extractYouTube = (html: string) => {
      const links = new Set<string>()
      const reEmbed = /https:\/\/www\.youtube\.com\/embed\/([A-Za-z0-9_-]{5,})/g
      const reWatch = /https:\/\/www\.youtube\.com\/watch\?v=([A-Za-z0-9_-]{5,})/g
      let m
      while ((m = reEmbed.exec(html)) !== null) links.add(`https://www.youtube.com/embed/${m[1]}`)
      while ((m = reWatch.exec(html)) !== null) links.add(`https://www.youtube.com/embed/${m[1]}`)
      return Array.from(links)
    }

    while (queue.length && visited.size < maxPages) {
      const { url, depth } = queue.shift()!
      if (visited.has(url)) continue
      visited.add(url)
      try {
        const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 TranquilaeIngest' } })
        if (!res.ok) continue
        const html = await res.text()
        const base = new URL(url)
        const videos = extractYouTube(html)
        const title = extractTitle(html)
        if (videos.length) pages.push({ url, title, videos })
        if (depth < maxDepth) {
          const links = extractLinks(base, html)
          for (const l of links) queue.push({ url: l, depth: depth + 1 })
        }
        // politeness delay between fetches
        if (delayMs > 0) await new Promise(r => setTimeout(r, delayMs))
      } catch {
        if (delayMs > 0) await new Promise(r => setTimeout(r, delayMs))
      }
    }

    // Heuristic: derive names from page title (first word combo) or URL slug
    const toName = (pageUrl: string, title: string) => {
      if (title && title.length > 0) return title.split('|')[0]?.split('-').slice(0, 6).join(' ').replace(/\s+/g, ' ').trim()
      try {
        const u = new URL(pageUrl)
        const seg = u.pathname.split('/').filter(Boolean).pop() || ''
        return seg.replace(/[-_]+/g, ' ').trim() || pageUrl
      } catch { return pageUrl }
    }

    // Build unique items
    const items: Array<{ name:string; video_url:string }> = []
    const seen = new Set<string>()
    for (const p of pages) {
      const nameBase = toName(p.url, p.title) || 'Unknown'
      for (const v of p.videos) {
        const key = `${nameBase}::${v}`
        if (seen.has(key)) continue
        seen.add(key)
        items.push({ name: nameBase, video_url: v })
      }
    }

    // Upsert in DB
    const { db } = await import('@/lib/database')
    let saved = 0
    for (const it of items) {
      try { await db.upsertExerciseMedia(it.name, it.video_url); saved++ } catch {}
    }

    return NextResponse.json({ success: true, pages: pages.length, items: items.length, saved })
  } catch (e: any) {
    console.error('Ingest error:', e)
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 })
  }
}


