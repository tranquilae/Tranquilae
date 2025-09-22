"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Play, Pause, SkipForward, Timer } from "lucide-react"
import { useState } from "react"

export function ActiveWorkout() {
  const [isActive, setIsActive] = useState(false)
  const [currentExercise, setCurrentExercise] = useState(0)

  const workout = {
    name: "Upper Body Strength",
    exercises: [
      { name: "Push-ups", sets: 3, reps: 12, rest: 60 },
      { name: "Pull-ups", sets: 3, reps: 8, rest: 90 },
      { name: "Bench Press", sets: 4, reps: 10, rest: 120 },
      { name: "Shoulder Press", sets: 3, reps: 12, rest: 60 },
      { name: "Bicep Curls", sets: 3, reps: 15, rest: 45 },
      { name: "Tricep Dips", sets: 3, reps: 12, rest: 60 },
    ],
  }

  const progress = ((currentExercise + 1) / workout.exercises.length) * 100

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Timer className="h-5 w-5" />
            {isActive ? "Active Workout" : "Ready to Start"}
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setIsActive(!isActive)} className="gap-2">
              {isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {isActive ? "Pause" : "Start"}
            </Button>
            <Button size="sm" variant="outline" className="gap-2 bg-transparent">
              <SkipForward className="h-4 w-4" />
              Skip
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Workout Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium">{workout.name}</span>
            <span className="text-muted-foreground">
              {currentExercise + 1} of {workout.exercises.length}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Current Exercise */}
        <div className="text-center space-y-4 p-6 rounded-lg bg-accent/20">
          <h2 className="text-2xl font-bold text-primary">{workout.exercises[currentExercise].name}</h2>
          <div className="flex justify-center gap-8 text-lg">
            <div className="text-center">
              <div className="font-bold text-foreground">{workout.exercises[currentExercise].sets}</div>
              <div className="text-sm text-muted-foreground">Sets</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-foreground">{workout.exercises[currentExercise].reps}</div>
              <div className="text-sm text-muted-foreground">Reps</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-foreground">{workout.exercises[currentExercise].rest}s</div>
              <div className="text-sm text-muted-foreground">Rest</div>
            </div>
          </div>
        </div>

        {/* Exercise List */}
        <div className="space-y-2">
          <h3 className="font-medium text-sm text-muted-foreground">Exercises</h3>
          {workout.exercises.map((exercise, index) => (
            <div
              key={index}
              className={`flex items-center justify-between p-2 rounded-lg transition-colors ${
                index === currentExercise
                  ? "bg-primary/10 border border-primary/20"
                  : index < currentExercise
                    ? "bg-green-500/10 border border-green-500/20"
                    : "hover:bg-accent/20"
              }`}
            >
              <span
                className={`font-medium ${
                  index === currentExercise
                    ? "text-primary"
                    : index < currentExercise
                      ? "text-green-600"
                      : "text-foreground"
                }`}
              >
                {exercise.name}
              </span>
              <span className="text-sm text-muted-foreground">
                {exercise.sets} × {exercise.reps}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
