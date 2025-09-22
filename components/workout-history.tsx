"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, TrendingUp } from "lucide-react"

export function WorkoutHistory() {
  const recentWorkouts = [
    {
      name: "Full Body HIIT",
      date: "Dec 20",
      duration: "35 min",
      calories: 420,
      type: "cardio",
    },
    {
      name: "Leg Day",
      date: "Dec 18",
      duration: "55 min",
      calories: 380,
      type: "strength",
    },
    {
      name: "Morning Yoga",
      date: "Dec 17",
      duration: "45 min",
      calories: 180,
      type: "yoga",
    },
    {
      name: "Upper Body",
      date: "Dec 15",
      duration: "50 min",
      calories: 350,
      type: "strength",
    },
  ]

  const getTypeColor = (type: string) => {
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
        {recentWorkouts.map((workout, index) => (
          <div key={index} className="p-3 rounded-lg border border-border/50 hover:bg-accent/20 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-sm">{workout.name}</h4>
              <div className={`w-2 h-2 rounded-full ${getTypeColor(workout.type)}`} />
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {workout.date}
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {workout.duration}
              </div>
              <Badge variant="outline" className="text-xs">
                {workout.calories} cal
              </Badge>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
