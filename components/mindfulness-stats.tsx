"use client"

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { TrendingUp, Clock, Target } from "lucide-react"

export function MindfulnessStats() {
  const [summary, setSummary] = React.useState<{ totalSessionsThisWeek:number; totalMinutesThisWeek:number }>({ totalSessionsThisWeek: 0, totalMinutesThisWeek: 0 })
  const [weekly, setWeekly] = React.useState<Array<{ day:string; minutes:number }>>([])
  const [badges, setBadges] = React.useState<string[]>([])

  React.useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await fetch('/api/dashboard/mindfulness', { cache: 'no-store' })
        if (res.ok) {
          const data = await res.json()
          const sessions: Array<{ started_at:string; duration_minutes:number }> = data.sessions || []
          // Build last 7 days histogram
          const labels = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
          const byDay = new Array(7).fill(0)
          const now = new Date()
          for (const s of sessions) {
            const d = new Date(s.started_at)
            const diff = Math.floor((now.getTime() - d.getTime()) / (24*3600*1000))
            if (diff >= 0 && diff < 7) {
              const idx = d.getDay()
              byDay[idx] += Number(s.duration_minutes || 0)
            }
          }
          const week = labels.map((label, idx) => ({ day: label, minutes: byDay[idx] }))
          if (mounted) {
            setWeekly(week)
            setSummary({ totalSessionsThisWeek: data.summary?.totalSessionsThisWeek || 0, totalMinutesThisWeek: data.summary?.totalMinutesThisWeek || 0 })
            // Achievements
            const uniqueDays = new Set(sessions.map(s => new Date(s.started_at).toISOString().slice(0,10)))
            const totalSessions = sessions.length
            const b: string[] = []
            if (totalSessions > 0) b.push('First session')
            // Compute current streak ending today
            let streak = 0
            for (let i=0; i<30; i++) {
              const d = new Date(); d.setUTCDate(d.getUTCDate() - i)
              const key = d.toISOString().slice(0,10)
              if (uniqueDays.has(key)) streak++; else break
            }
            if (streak >= 3) b.push('3-day streak')
            if (streak >= 7) b.push('7-day streak')
            setBadges(b)
          }
        }
      } catch {}
    })()
    return () => { mounted = false }
  }, [])

  const stats = [
    { label: 'This Week', value: `${summary.totalMinutesThisWeek} min`, target: '—', progress: 0, icon: Clock },
    { label: 'Sessions', value: `${summary.totalSessionsThisWeek}`, target: '—', progress: 0, icon: Target },
  ]

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{stat.label}</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {stat.value}{stat.target !== '—' ? ` / ${stat.target}` : ''}
                </span>
              </div>
              {stat.progress > 0 && <Progress value={stat.progress} className="h-2" />}
            </div>
          )
        })}

        {badges.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {badges.map((b, i) => (
              <span key={i} className="px-2 py-1 text-xs rounded-full bg-primary/10 border border-primary/20 text-primary">{b}</span>
            ))}
          </div>
        )}

        <div className="space-y-3">
          <h3 className="font-medium text-sm text-muted-foreground">This Week</h3>
          <div className="flex items-end justify-between gap-1 h-20">
            {weekly.map((day, index) => (
              <div key={index} className="flex flex-col items-center gap-1 flex-1">
                <div className="w-full bg-primary rounded-t-sm" style={{ height: `${Math.min(100, (day.minutes / Math.max(1, Math.max(...weekly.map(d=>d.minutes)))) * 100)}%` }} />
                <span className="text-xs text-muted-foreground">{day.day}</span>
              </div>
            ))}
            {weekly.length === 0 && (
              <div className="text-xs text-muted-foreground">No sessions this week.</div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
