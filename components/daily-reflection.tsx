"use client"

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Heart, Smile, Meh, Frown, Sun } from "lucide-react"
import { fetchWithAuth } from '@/lib/api'

export function DailyReflection() {
  const [selectedMood, setSelectedMood] = React.useState<number | null>(null)
  const [selectedEnergy, setSelectedEnergy] = React.useState<number | null>(null)
  const [saving, setSaving] = React.useState(false)
  const [latestHighlight, setLatestHighlight] = React.useState<string | null>(null)
  const [streak, setStreak] = React.useState<number>(0)

  const moods = [
    { icon: Frown, label: "Struggling", color: "text-red-500" },
    { icon: Meh, label: "Okay", color: "text-yellow-500" },
    { icon: Smile, label: "Good", color: "text-green-500" },
    { icon: Heart, label: "Great", color: "text-pink-500" },
  ]

  const energyLevels = [
    { level: 1, label: "Low" },
    { level: 2, label: "Moderate" },
    { level: 3, label: "High" },
    { level: 4, label: "Energized" },
  ]

  // Load latest journal or check-in highlight and mindfulness streak
  React.useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        // Latest journal entry as highlight
        const j = await fetchWithAuth('/api/dashboard/journal')
        if (j.ok) {
          const data = await j.json()
          const entry = Array.isArray(data.entries) ? data.entries[0] : null
          if (mounted && entry?.content) setLatestHighlight(entry.content)
        }
      } catch {}
      try {
        // Streak based on mindfulness sessions
        const m = await fetchWithAuth('/api/dashboard/mindfulness')
        if (m.ok) {
          const md = await m.json()
          const sessions: Array<{ started_at: string }> = md.sessions || []
          const days = new Set(sessions.map(s => new Date(s.started_at).toISOString().slice(0,10)))
          // Compute current streak ending today
          let s = 0
          for (let i=0; i<30; i++) {
            const d = new Date(); d.setUTCDate(d.getUTCDate() - i)
            const key = d.toISOString().slice(0,10)
            if (days.has(key)) s++; else break
          }
          if (mounted) setStreak(s)
        }
      } catch {}
      if (mounted && !latestHighlight) setLatestHighlight(null)
    })()
    return () => { mounted = false }
  }, [])

  const save = async () => {
    if (selectedMood === null && selectedEnergy === null) return
    try {
      setSaving(true)
      const mood = selectedMood !== null && moods[selectedMood] ? moods[selectedMood].label : null
      const energy = selectedEnergy !== null && energyLevels[selectedEnergy] ? energyLevels[selectedEnergy].level : null
      await fetchWithAuth('/api/dashboard/checkins', {
        method: 'POST',
        body: JSON.stringify({ mood, energy })
      })
    } catch {}
    finally { setSaving(false) }
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sun className="h-5 w-5" />
          Daily Check-in
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Mood Tracker */}
        <div className="space-y-3">
          <h3 className="font-medium text-sm">How are you feeling?</h3>
          <div className="grid grid-cols-2 gap-2">
            {moods.map((mood, index) => {
              const Icon = mood.icon
              return (
                <button
                  key={index}
                  onClick={() => setSelectedMood(index)}
                  className={`p-3 text-left rounded-lg border transition-all ${
                    selectedMood === index ? "border-primary bg-primary/5" : "border-border/50 hover:bg-accent/20"
                  }`}
                >
                  <div className="flex flex-col items-center gap-1">
                    <Icon className={`h-6 w-6 ${mood.color}`} />
                    <span className="text-xs">{mood.label}</span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Energy Level */}
        <div className="space-y-3">
          <h3 className="font-medium text-sm">Energy Level</h3>
          <div className="grid grid-cols-4 gap-1">
            {energyLevels.map((energy, index) => (
              <button
                key={index}
                onClick={() => setSelectedEnergy(index)}
                className={`p-2 rounded-lg border transition-all ${
                  selectedEnergy === index ? "border-primary bg-primary/5" : "border-border/50 hover:bg-accent/20"
                }`}
              >
                <div className="text-center">
                  <div
                    className={`h-2 rounded-full mb-1 ${selectedEnergy === index ? "bg-primary" : "bg-muted"}`}
                    style={{ width: `${(energy.level / 4) * 100}%` }}
                  />
                  <span className="text-xs">{energy.label}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Quick Reflection */}
        <div className="space-y-3">
          <h3 className="font-medium text-sm">Today's Highlight</h3>
          <div className="p-3 rounded-lg bg-accent/10 border border-border/50">
            {latestHighlight ? (
              <p className="text-sm text-muted-foreground italic">{latestHighlight}</p>
            ) : (
              <p className="text-xs text-muted-foreground">No highlight yet.</p>
            )}
          </div>
        </div>

        {/* Streak */}
        <div className="text-center p-4 rounded-lg bg-gradient-to-r from-primary/10 to-secondary/10">
          <div className="text-2xl font-bold text-primary">{streak}</div>
          <p className="text-sm text-muted-foreground">Day Mindfulness Streak</p>
        </div>

        <Button className="w-full" onClick={save} disabled={saving}>Save Reflection</Button>
      </CardContent>
    </Card>
  )
}
