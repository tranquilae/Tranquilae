"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Calendar, Clock, Dumbbell } from "lucide-react"

export function WorkoutPlanner() {
  const workoutPlan = [
    {
      day: "Today",
      date: "Dec 22",
      workout: "Upper Body Strength",
      duration: "45 min",
      exercises: 6,
      completed: false,
      type: "strength",
    },
    {
      day: "Tomorrow",
      date: "Dec 23",
      workout: "Cardio & Core",
      duration: "30 min",
      exercises: 4,
      completed: false,
      type: "cardio",
    },
    {
      day: "Monday",
      date: "Dec 24",
      workout: "Lower Body Strength",
      duration: "50 min",
      exercises: 7,
      completed: false,
      type: "strength",
    },
    {
      day: "Tuesday",
      date: "Dec 25",
      workout: "Yoga Flow",
      duration: "60 min",
      exercises: 8,
      completed: false,
      type: "yoga",
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
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Workout Plan
          </div>
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Create Plan
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {workoutPlan.map((workout, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-4 rounded-lg border border-border/50 hover:bg-accent/20 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className={`w-3 h-3 rounded-full ${getTypeColor(workout.type)}`} />
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold">{workout.workout}</h3>
                  <Badge variant="outline" className="text-xs">
                    {workout.type}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>
                    {workout.day}, {workout.date}
                  </span>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {workout.duration}
                  </div>
                  <div className="flex items-center gap-1">
                    <Dumbbell className="h-3 w-3" />
                    {workout.exercises} exercises
                  </div>
                </div>
              </div>
            </div>
            <Button size="sm" variant={index === 0 ? "default" : "outline"}>
              {index === 0 ? "Start Workout" : "View"}
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
