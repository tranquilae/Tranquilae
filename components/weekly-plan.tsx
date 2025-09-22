"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Utensils, Dumbbell, Brain, RefreshCw } from "lucide-react"

export function WeeklyPlan() {
  const weeklyPlan = [
    {
      day: "Monday",
      date: "Dec 23",
      activities: [
        { type: "workout", title: "Upper Body Strength", time: "7:00 AM", duration: "45 min" },
        { type: "meal", title: "Protein-rich breakfast", time: "8:00 AM", calories: 420 },
        { type: "mindfulness", title: "Morning meditation", time: "6:30 AM", duration: "10 min" },
      ],
    },
    {
      day: "Tuesday",
      date: "Dec 24",
      activities: [
        { type: "workout", title: "Cardio & Core", time: "7:00 AM", duration: "30 min" },
        { type: "meal", title: "Mediterranean lunch", time: "12:30 PM", calories: 580 },
        { type: "mindfulness", title: "Evening reflection", time: "8:00 PM", duration: "15 min" },
      ],
    },
    {
      day: "Wednesday",
      date: "Dec 25",
      activities: [
        { type: "workout", title: "Yoga Flow", time: "8:00 AM", duration: "60 min" },
        { type: "meal", title: "Holiday balanced meal", time: "1:00 PM", calories: 650 },
        { type: "mindfulness", title: "Gratitude practice", time: "7:00 PM", duration: "10 min" },
      ],
    },
  ]

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
          <Button size="sm" variant="outline" className="gap-2 bg-transparent">
            <RefreshCw className="h-4 w-4" />
            Regenerate
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
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
