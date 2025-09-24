"use client"

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Calendar, Clock, Dumbbell } from "lucide-react"

type PlanItem = { id:string; name:string; type?:string|null; scheduled_at?:string|null; duration_min?:number|null; exercises?: Array<{ name:string; sets:number; reps:number; rest:number }> }

export function WorkoutPlanner() {
  const [plan, setPlan] = React.useState<PlanItem[]>([])
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await fetch('/api/dashboard/workouts/plan', { cache: 'no-store' })
        if (res.ok) {
          const data = await res.json()
          if (mounted) setPlan(data.plan || [])
        }
      } catch {}
    })()
    return () => { mounted = false }
  }, [])

  const createQuick = async () => {
    try {
      setSaving(true)
      const res = await fetch('/api/dashboard/workouts/plan', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Quick Strength', type: 'strength', duration_min: 45, exercises: [
          { name: 'Push-ups', sets: 3, reps: 12, rest: 60 },
          { name: 'Pull-ups', sets: 3, reps: 8, rest: 90 },
        ] })
      })
      if (res.ok) {
        const created = await res.json()
        setPlan(prev => [created, ...prev])
      }
    } finally { setSaving(false) }
  }

  const getTypeColor = (type?: string|null) => {
    switch (type) {
      case "strength":
        return "bg-red-500"
      case "cardio":
        return "bg-blue-500"
      case "yoga":
        return "bg-green-500"
      default:
        return "bg-gray-500"
    }
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Workout Plan
          </div>
          <Button size="sm" className="gap-2" onClick={createQuick} disabled={saving}>
            <Plus className="h-4 w-4" />
            Quick Plan
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {plan.length === 0 && <div className="text-xs text-muted-foreground">No planned workouts yet.</div>}
        {plan.map((workout) => (
          <div
            key={workout.id}
            className="flex items-center justify-between p-4 rounded-lg border border-border/50 hover:bg-accent/20 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className={`w-3 h-3 rounded-full ${getTypeColor(workout.type)}`} />
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold">{workout.name}</h3>
                  <Badge variant="outline" className="text-xs">
                    {workout.type || 'custom'}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  {workout.scheduled_at && <span>{new Date(workout.scheduled_at).toLocaleString()}</span>}
                  {workout.duration_min && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {workout.duration_min} min
                    </div>
                  )}
                  {workout.exercises && (
                    <div className="flex items-center gap-1">
                      <Dumbbell className="h-3 w-3" />
                      {workout.exercises.length} exercises
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={async () => {
                // Log from plan (estimate calories by duration if present)
                const duration = workout.duration_min || 30
                const calories = Math.round(duration * 6)
                try {
                  await fetch('/api/dashboard/workouts/history', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: workout.name, date: new Date().toISOString(), duration_min: duration, calories, type: workout.type || 'custom' })
                  })
                } catch {}
              }}>Log</Button>
              <Button size="sm" variant="default">Start</Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
