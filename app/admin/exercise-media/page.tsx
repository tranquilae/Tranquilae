"use client"

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function ExerciseMediaAdmin() {
  const [media, setMedia] = useState<Array<{ name:string; video_url:string }>>([])
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [saving, setSaving] = useState(false)

  const load = async () => {
    const res = await fetch('/api/admin/exercises/media', { cache: 'no-store' })
    if (res.ok) {
      const data = await res.json()
      setMedia(data.media || [])
    }
  }

  useEffect(() => { load() }, [])

  const save = async () => {
    if (!name || !url) return
    try {
      setSaving(true)
      const res = await fetch('/api/admin/exercises/media', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, video_url: url })
      })
      if (res.ok) {
        setName(''); setUrl('');
        await load()
      }
    } finally { setSaving(false) }
  }

  return (
    <div className="space-y-6">
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Exercise Media Overrides</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Input placeholder="Exercise name (e.g., Squats)" value={name} onChange={(e) => setName(e.target.value)} />
            <Input placeholder="YouTube embed URL" value={url} onChange={(e) => setUrl(e.target.value)} />
            <Button onClick={save} disabled={saving}>Save</Button>
          </div>
          <div className="space-y-2">
            {media.map((m) => (
              <div key={m.name} className="p-2 rounded-lg border flex items-center justify-between">
                <div>
                  <div className="font-medium">{m.name}</div>
                  <div className="text-xs text-muted-foreground break-all">{m.video_url}</div>
                </div>
                <a className="text-xs underline" href={m.video_url} target="_blank" rel="noreferrer">Open</a>
              </div>
            ))}
            {media.length === 0 && <div className="text-xs text-muted-foreground">No overrides yet.</div>}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

