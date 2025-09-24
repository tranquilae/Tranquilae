"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Utensils, Dumbbell, Brain, RefreshCw } from "lucide-react"

export function WeeklyPlan() {
  const [weeklyPlan, setWeeklyPlan] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setLoading(true)
        // Fetch user goal to seed calories
        const { fetchWithAuth } = await import('@/lib/api')
        const sres = await fetchWithAuth('/api/user/settings')
        let calories = 0
        if (sres.ok) {
          const s = await sres.json()
          calories = Number(s?.daily_calorie_goal || 0)
        }
        if (calories > 0) {
          const pres = await fetchWithAuth('/api/meals/plan', { method: 'POST', body: JSON.stringify({ calories }) })
          if (pres.ok) {
            const data = await pres.json()
            // Store raw plan, component renders a minimal list
            if (mounted) setWeeklyPlan(data?.plan ? [data.plan] : [])
          }
        }
      } finally {
        setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [])

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "workout":
        return Dumbbell
      case "meal":
        return Utensils
      case "mindfulness":
        return Brain
      default:
        return Calendar
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case "workout":
        return "bg-blue-500"
      case "meal":
        return "bg-green-500"
      case "mindfulness":
        return "bg-purple-500"
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
            AI-Generated Weekly Plan
          </div>
          <Button size="sm" variant="outline" className="gap-2 bg-transparent" onClick={async () => {
            try {
              const { fetchWithAuth } = await import('@/lib/api')
              const sres = await fetchWithAuth('/api/user/settings')
              let calories = 0
              if (sres.ok) { const s = await sres.json(); calories = Number(s?.daily_calorie_goal || 0) }
              if (calories > 0) {
                const pres = await fetchWithAuth('/api/meals/plan', { method: 'POST', body: JSON.stringify({ calories }) })
                if (pres.ok) {
                  const data = await pres.json()
                  setWeeklyPlan(data?.plan ? [data.plan] : [])
                }
              }
            } catch {}
          }}>
            <RefreshCw className="h-4 w-4" />
            Regenerate
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {loading && <div className="text-xs text-muted-foreground">Generating...</div>}
        {!loading && weeklyPlan.length === 0 && (
          <div className="text-xs text-muted-foreground">No plan yet. Set a daily calorie goal and click Regenerate.</div>
        )}
        {weeklyPlan.map((day, dayIndex) => (
          <div key={dayIndex} className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">{day.day}</h3>
              <span className="text-sm text-muted-foreground">{day.date}</span>
            </div>

            <div className="space-y-2">
              {day.activities.map((activity, actIndex) => {
                const Icon = getActivityIcon(activity.type)
                return (
                  <div
                    key={actIndex}
                    className="flex items-center gap-3 p-3 rounded-lg border border-border/50 hover:bg-accent/20 transition-colors"
                  >
                    <div className={`w-3 h-3 rounded-full ${getActivityColor(activity.type)}`} />
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{activity.title}</h4>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{activity.time}</span>
                        {activity.duration && (
                          <>
                            <span>•</span>
                            <span>{activity.duration}</span>
                          </>
                        )}
                        {activity.calories && (
                          <>
                            <span>•</span>
                            <span>{activity.calories} cal</span>
                          </>
                        )}
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs capitalize">
                      {activity.type}
                    </Badge>
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        {/* Plan Summary */}
        <div className="p-4 rounded-lg bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20">
          <h4 className="font-medium text-sm mb-2">This Week's Focus</h4>
          <p className="text-xs text-muted-foreground">
            Balanced approach with 3 strength sessions, 2 cardio workouts, daily mindfulness, and nutrition goals
            targeting 1800-2000 calories per day.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
