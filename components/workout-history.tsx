"use client"

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, TrendingUp } from "lucide-react"

type LogItem = { id:string; name:string; date:string; duration_min?:number|null; calories?:number|null; type?:string|null }

export function WorkoutHistory() {
  const [history, setHistory] = React.useState<LogItem[]>([])
  const [badges, setBadges] = React.useState<string[]>([])

  React.useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await fetch('/api/dashboard/workouts/history', { cache: 'no-store' })
        if (res.ok) {
          const data = await res.json()
          if (mounted) {
            const list: LogItem[] = data.history || []
            setHistory(list)
            // Achievements: first logged workout, 5 workouts this week
            const badges: string[] = []
            if (list.length > 0) badges.push('First workout')
            const now = new Date()
            const weekAgo = new Date(now.getTime() - 7*24*3600*1000)
            const weekCount = list.filter(i => new Date(i.date) >= weekAgo).length
            if (weekCount >= 5) badges.push('5 workouts this week')
            setBadges(badges)
          }
        }
      } catch {}
    })()
    return () => { mounted = false }
  }, [])

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
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Recent Workouts
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {badges.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {badges.map((b,i) => (
              <span key={i} className="px-2 py-1 text-xs rounded-full bg-primary/10 border border-primary/20 text-primary">{b}</span>
            ))}
          </div>
        )}
        {history.length === 0 && <div className="text-xs text-muted-foreground">No workouts yet.</div>}
        {history.map((workout) => (
          <div key={workout.id} className="p-3 rounded-lg border border-border/50 hover:bg-accent/20 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-sm">{workout.name}</h4>
              <div className={`w-2 h-2 rounded-full ${getTypeColor(workout.type)}`} />
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {new Date(workout.date).toLocaleDateString()}
              </div>
              {workout.duration_min && (
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {workout.duration_min} min
                </div>
              )}
              {typeof workout.calories === 'number' && (
                <Badge variant="outline" className="text-xs">
                  {workout.calories} cal
                </Badge>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
