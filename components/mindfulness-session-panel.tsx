"use client"

import React, { useEffect, useRef, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { fetchWithAuth } from '@/lib/api'
import { Slider } from '@/components/ui/slider'

interface Session {
  id: string
  started_at: string
  duration_minutes: number
  type: string
  notes: string | null
}

export function MindfulnessSessionPanel() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [running, setRunning] = useState(false)
  const [startTime, setStartTime] = useState<number | null>(null)
  const [elapsed, setElapsed] = useState(0) // seconds
  const [type, setType] = useState('meditation')
  const [notes, setNotes] = useState('')
  const timerRef = useRef<any>(null)

  // Simple audio player (user can paste any URL). No prefilled tracks.
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [audioUrl, setAudioUrl] = useState<string>('')
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState<number>(0.7)

  const fetchSessions = async () => {
    const res = await fetchWithAuth('/api/dashboard/mindfulness')
    if (res.ok) {
      const data = await res.json()
      setSessions(data.sessions || [])
    }
  }

  useEffect(() => { fetchSessions() }, [])

  useEffect(() => {
    if (running) {
      timerRef.current = setInterval(() => {
        if (startTime) setElapsed(Math.floor((Date.now() - startTime) / 1000))
      }, 1000)
    } else if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [running, startTime])

  const start = () => {
    setStartTime(Date.now())
    setElapsed(0)
    setRunning(true)
  }
  const stop = async () => {
    setRunning(false)
    const minutes = Math.max(1, Math.round(elapsed / 60))
    const res = await fetchWithAuth('/api/dashboard/mindfulness', {
      method: 'POST',
      body: JSON.stringify({ duration_minutes: minutes, type, notes: notes || null })
    })
    if (res.ok) {
      setNotes('')
      setType('meditation')
      fetchSessions()
    }
  }
  const remove = async (id: string) => {
    const res = await fetchWithAuth(`/api/dashboard/mindfulness?id=${id}`, { method: 'DELETE' })
    if (res.ok) fetchSessions()
  }

  const mm = Math.floor(elapsed / 60).toString().padStart(2, '0')
  const ss = (elapsed % 60).toString().padStart(2, '0')

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle>Mindfulness Sessions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="text-3xl font-mono">{mm}:{ss}</div>
          {!running ? (
            <Button onClick={start}>Start</Button>
          ) : (
            <Button variant="destructive" onClick={stop}>Stop & Save</Button>
          )}
        </div>

        {/* Minimal audio player */}
        <div className="space-y-2 p-3 rounded-lg bg-accent/20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
            <div className="md:col-span-2 space-y-1">
              <Label>Audio URL (paste any mindfulness track)</Label>
              <Input
                placeholder="https://.../track.mp3"
                value={audioUrl}
                onChange={(e) => setAudioUrl(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={() => {
                if (!audioRef.current || !audioUrl) return
                audioRef.current.src = audioUrl
                audioRef.current.volume = volume
                audioRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false))
              }}>Play</Button>
              <Button size="sm" variant="outline" onClick={() => { if (audioRef.current) { audioRef.current.pause(); setIsPlaying(false) }}}>Pause</Button>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Label className="text-sm">Volume</Label>
            <Slider defaultValue={[70]} value={[Math.round(volume*100)]} onValueChange={(v) => {
              const val = (v?.[0] ?? 70)/100
              setVolume(val)
              if (audioRef.current) audioRef.current.volume = val
            }} className="w-48" />
          </div>
          <audio ref={audioRef} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label>Type</Label>
            <Input value={type} onChange={(e) => setType(e.target.value)} placeholder="e.g., meditation" />
          </div>
          <div className="space-y-1">
            <Label>Notes</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="optional" />
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="font-medium text-sm text-muted-foreground">Recent</h3>
          {sessions.length === 0 && (
            <div className="text-xs text-muted-foreground">No sessions yet.</div>
          )}
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {sessions.map(s => (
              <div key={s.id} className="p-2 rounded-lg border flex items-center justify-between">
                <div className="text-sm">
                  <div>{new Date(s.started_at).toLocaleString()} • {s.type}</div>
                  <div className="text-muted-foreground">{s.duration_minutes} min{s.duration_minutes === 1 ? '' : 's'}{s.notes ? ` • ${s.notes}` : ''}</div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => remove(s.id)}>Delete</Button>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

