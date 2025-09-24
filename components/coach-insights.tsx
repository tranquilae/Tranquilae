"use client"

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { TrendingUp, Target, Award, Calendar } from "lucide-react"

export function CoachInsights() {
  const insights = [
    {
      title: "Weekly Progress",
      value: "78%",
      description: "You're ahead of schedule this week",
      progress: 78,
      trend: "up",
    },
    {
      title: "Consistency Score",
      value: "9.2/10",
      description: "Excellent habit formation",
      progress: 92,
      trend: "up",
    },
    {
      title: "Goal Completion",
      value: "4/6",
      description: "2 goals remaining this month",
      progress: 67,
      trend: "stable",
    },
  ]

  const weeklyStats = [
    { day: "Mon", completed: 85 },
    { day: "Tue", completed: 92 },
    { day: "Wed", completed: 78 },
    { day: "Thu", completed: 88 },
    { day: "Fri", completed: 95 },
    { day: "Sat", completed: 82 },
    { day: "Sun", completed: 90 },
  ]

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Coach Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Key Metrics */}
        {insights.map((insight, index) => (
          <div key={index} className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{insight.title}</span>
              <span className="text-sm font-bold text-primary">{insight.value}</span>
            </div>
            <Progress value={insight.progress} className="h-2" />
            <p className="text-xs text-muted-foreground">{insight.description}</p>
          </div>
        ))}

        {/* Weekly Activity Chart */}
        <div className="space-y-3">
          <h3 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            This Week's Activity
          </h3>
          <div className="flex items-end justify-between gap-1 h-16">
            {weeklyStats.map((day, index) => (
              <div key={index} className="flex flex-col items-center gap-1 flex-1">
                <div className="w-full bg-primary rounded-t-sm" style={{ height: `${day.completed}%` }} />
                <span className="text-xs text-muted-foreground">{day.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Achievement */}
        <div className="p-3 rounded-lg bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/20">
          <div className="flex items-center gap-2 mb-1">
            <Award className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-green-700">Achievement Unlocked!</span>
          </div>
          <p className="text-xs text-green-600">7-day consistency streak - keep it up!</p>
        </div>

        {/* Next Milestone */}
        <div className="p-3 rounded-lg bg-accent/10 border border-border/50">
          <div className="flex items-center gap-2 mb-1">
            <Target className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Next Milestone</span>
          </div>
          <p className="text-xs text-muted-foreground">Complete 3 more workouts to reach your monthly fitness goal</p>
        </div>
      </CardContent>
    </Card>
  )
}
