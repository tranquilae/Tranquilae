"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { TrendingUp, Clock, Target, Award } from "lucide-react"

export function MindfulnessStats() {
  const stats = [
    {
      label: "This Week",
      value: "45 min",
      target: "60 min",
      progress: 75,
      icon: Clock,
    },
    {
      label: "Sessions",
      value: "12",
      target: "15",
      progress: 80,
      icon: Target,
    },
    {
      label: "Streak",
      value: "7 days",
      target: "10 days",
      progress: 70,
      icon: Award,
    },
  ]

  const weeklyData = [
    { day: "Mon", minutes: 10 },
    { day: "Tue", minutes: 15 },
    { day: "Wed", minutes: 0 },
    { day: "Thu", minutes: 20 },
    { day: "Fri", minutes: 5 },
    { day: "Sat", minutes: 25 },
    { day: "Sun", minutes: 15 },
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
        {/* Weekly Stats */}
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
                  {stat.value} / {stat.target}
                </span>
              </div>
              <Progress value={stat.progress} className="h-2" />
            </div>
          )
        })}

        {/* Weekly Chart */}
        <div className="space-y-3">
          <h3 className="font-medium text-sm text-muted-foreground">This Week</h3>
          <div className="flex items-end justify-between gap-1 h-20">
            {weeklyData.map((day, index) => (
              <div key={index} className="flex flex-col items-center gap-1 flex-1">
                <div className="w-full bg-primary rounded-t-sm" style={{ height: `${(day.minutes / 25) * 100}%` }} />
                <span className="text-xs text-muted-foreground">{day.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Achievements */}
        <div className="space-y-2">
          <h3 className="font-medium text-sm text-muted-foreground">Recent Achievements</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2 p-2 rounded-lg bg-accent/10">
              <Award className="h-4 w-4 text-yellow-500" />
              <span className="text-sm">7-day streak!</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-accent/10">
              <Target className="h-4 w-4 text-green-500" />
              <span className="text-sm">First meditation completed</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
