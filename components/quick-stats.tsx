"use client"

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, Droplets, Moon, Footprints } from "lucide-react"
import { useDailyStats } from "@/hooks/use-dashboard-data"
import { Skeleton } from "@/components/ui/skeleton"

export function QuickStats() {
  const { stats, loading, error } = useDailyStats()
  
  if (loading) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-lg">
              <div className="flex items-center space-x-3">
                <Skeleton className="h-8 w-8 rounded-lg" />
                <div>
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-3 w-16 mt-1" />
                </div>
              </div>
              <div className="text-right">
                <Skeleton className="h-4 w-8" />
                <Skeleton className="h-1.5 w-16 mt-1" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }
  
  if (error || !stats) {
    return (
      <Card className="glass-card">
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground text-sm">Unable to load stats</p>
        </CardContent>
      </Card>
    )
  }

  const quickStats = [
    {
      title: "Steps",
      value: stats.steps.toLocaleString(),
      goal: stats.stepsGoal.toLocaleString(),
      icon: Footprints,
      color: "text-primary",
      progress: Math.min((stats.steps / stats.stepsGoal) * 100, 100),
    },
    {
      title: "Water",
      value: stats.waterGlasses.toString(),
      goal: `${stats.waterGoal} glasses`,
      icon: Droplets,
      color: "text-secondary",
      progress: Math.min((stats.waterGlasses / stats.waterGoal) * 100, 100),
    },
    {
      title: "Sleep",
      value: `${stats.sleepHours}h`,
      goal: `${stats.sleepGoal}h`,
      icon: Moon,
      color: "text-accent",
      progress: Math.min((stats.sleepHours / stats.sleepGoal) * 100, 100),
    },
    {
      title: "Active",
      value: `${stats.activeMinutes}min`,
      goal: `${stats.activeGoal}min`,
      icon: Activity,
      color: "text-chart-4",
      progress: Math.min((stats.activeMinutes / stats.activeGoal) * 100, 100),
    },
  ]

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Today's Progress</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {quickStats.map((stat, index) => (
          <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg bg-background/50`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
              <div>
                <div className="font-medium text-foreground">{stat.value}</div>
                <div className="text-xs text-muted-foreground">of {stat.goal}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-foreground">{stat.progress}%</div>
              <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden mt-1">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-300"
                  style={{ width: `${stat.progress}%` }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
