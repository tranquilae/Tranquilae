"use client"

import React, { useEffect, useRef, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

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

  const fetchSessions = async () => {
    const res = await fetch('/api/dashboard/mindfulness', { cache: 'no-store' })
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
    const res = await fetch('/api/dashboard/mindfulness', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ duration_minutes: minutes, type, notes: notes || null })
    })
    if (res.ok) {
      setNotes('')
      setType('meditation')
      fetchSessions()
    }
  }
  const remove = async (id: string) => {
    const res = await fetch(`/api/dashboard/mindfulness?id=${id}`, { method: 'DELETE' })
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

