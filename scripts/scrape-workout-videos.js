#!/usr/bin/env node

/**
 * Scrape workout video links from given URLs and produce a JSON file.
 * Usage:
 *   node scripts/scrape-workout-videos.js https://www.muscleandstrength.com/workout-routines https://www.fitnessblender.com/videos
 *
 * Notes:
 * - This scraper is simple and looks for YouTube links (watch or embed) present in the HTML.
 * - For pages that list many routines (like index pages), it will collect links on that page only.
 * - You can pass multiple page URLs. The result is saved to data/scraped-exercise-media.json
 */

const fs = require('fs')
const path = require('path')

async function fetchHtml(url) {
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 TranquilaeBot' } })
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`)
  return await res.text()
}

function extractYouTubeLinks(html) {
  const links = new Set()
  const reEmbed = /https:\/\/www\.youtube\.com\/embed\/([A-Za-z0-9_-]{5,})/g
  const reWatch = /https:\/\/www\.youtube\.com\/watch\?v=([A-Za-z0-9_-]{5,})/g
  let m
  while ((m = reEmbed.exec(html)) !== null) links.add(`https://www.youtube.com/embed/${m[1]}`)
  while ((m = reWatch.exec(html)) !== null) links.add(`https://www.youtube.com/embed/${m[1]}`)
  return Array.from(links)
}

;(async () => {
  try {
    const args = process.argv.slice(2)
    if (args.length === 0) {
      console.error('Please provide one or more URLs to scrape.')
      process.exit(1)
    }

    const results = []
    for (const url of args) {
      try {
        const html = await fetchHtml(url)
        const videos = extractYouTubeLinks(html)
        results.push({ url, videos })
        console.log(`Scraped ${videos.length} YouTube links from ${url}`)
      } catch (e) {
        console.warn(`Skipping ${url}: ${e.message}`)
      }
    }

    const outDir = path.join(process.cwd(), 'data')
    const outFile = path.join(outDir, 'scraped-exercise-media.json')
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })
    fs.writeFileSync(outFile, JSON.stringify(results, null, 2), 'utf-8')
    console.log(`Saved results to ${outFile}`)
  } catch (e) {
    console.error('Scrape error:', e)
    process.exit(1)
  }
})()

