"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, Droplets, Moon, Footprints } from "lucide-react"

export function QuickStats() {
  const stats = [
    {
      title: "Steps",
      value: "8,432",
      goal: "10,000",
      icon: Footprints,
      color: "text-primary",
      progress: 84,
    },
    {
      title: "Water",
      value: "6",
      goal: "8 glasses",
      icon: Droplets,
      color: "text-secondary",
      progress: 75,
    },
    {
      title: "Sleep",
      value: "7.5h",
      goal: "8h",
      icon: Moon,
      color: "text-accent",
      progress: 94,
    },
    {
      title: "Active",
      value: "45min",
      goal: "60min",
      icon: Activity,
      color: "text-chart-4",
      progress: 75,
    },
  ]

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Today's Progress</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {stats.map((stat, index) => (
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
