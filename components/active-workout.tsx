"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Play, Pause, SkipForward, Timer } from "lucide-react"
import React, { useEffect, useState } from "react"
import { fetchWithAuth } from '@/lib/api'

const DEMO_VIDEOS: Record<string, string> = {
  'Push-ups': 'https://www.youtube.com/embed/IODxDxX7oi4',
  'Pull-ups': 'https://www.youtube.com/embed/eGo4IYlbE5g',
  'Bench Press': 'https://www.youtube.com/embed/rT7DgCr-3pg',
  'Shoulder Press': 'https://www.youtube.com/embed/qEwKCR5JCog',
  'Bicep Curls': 'https://www.youtube.com/embed/ykJmrZ5v0Oo',
  'Tricep Dips': 'https://www.youtube.com/embed/6kALZikXxLc'
}

function useExerciseMediaOverrides() {
  const [overrides, setOverrides] = React.useState<Record<string, string>>({})
  React.useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await fetchWithAuth('/api/admin/exercises/media')
        if (res.ok) {
          const data = await res.json()
          const map: Record<string, string> = {}
          ;(data.media || []).forEach((m: any) => { if (m.name && m.video_url) map[m.name] = m.video_url })
          if (mounted) setOverrides(map)
        }
      } catch {}
    })()
    return () => { mounted = false }
  }, [])
  return overrides
}

export function ActiveWorkout() {
  const [isActive, setIsActive] = useState(false)
  const [currentExercise, setCurrentExercise] = useState(0)
  const [currentSet, setCurrentSet] = useState(1)
  const [restRemaining, setRestRemaining] = useState<number | null>(null)
  const [sessionStart, setSessionStart] = useState<number | null>(null)

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
  const overrides = useExerciseMediaOverrides()
  const currentName = workout.exercises[currentExercise].name
  const videoSrc = overrides[currentName] || DEMO_VIDEOS[currentName] || 'https://www.youtube.com/embed/dQw4w9WgXcQ'

  // Rest timer
  useEffect(() => {
    if (restRemaining === null) return
    if (restRemaining <= 0) { setRestRemaining(null); return }
    const t = setTimeout(() => setRestRemaining((r) => (r ?? 1) - 1), 1000)
    return () => clearTimeout(t)
  }, [restRemaining])

  const startNextSet = () => {
    const ex = workout.exercises[currentExercise]
    if (currentSet < ex.sets) {
      setCurrentSet(currentSet + 1)
      setRestRemaining(ex.rest)
    } else {
      // next exercise
      if (currentExercise < workout.exercises.length - 1) {
        setCurrentExercise(currentExercise + 1)
        setCurrentSet(1)
        setRestRemaining(workout.exercises[currentExercise + 1].rest)
      }
    }
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Timer className="h-5 w-5" />
            {isActive ? "Active Workout" : "Ready to Start"}
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => { if (!isActive) { setSessionStart(sessionStart ?? Date.now()); } setIsActive(!isActive) }} className="gap-2">
              {isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {isActive ? "Pause" : "Start"}
            </Button>
            <Button size="sm" variant="outline" className="gap-2 bg-transparent" onClick={() => {
              if (currentExercise < workout.exercises.length - 1) {
                setCurrentExercise(currentExercise + 1)
                setCurrentSet(1)
                setRestRemaining(workout.exercises[currentExercise + 1].rest)
              }
            }}>
              <SkipForward className="h-4 w-4" />
              Skip
            </Button>
            <Button size="sm" className="gap-2" onClick={async () => {
              // Auto-detect duration and calories
              const durationMin = sessionStart ? Math.max(1, Math.round((Date.now() - sessionStart) / 60000)) : 30
              // Simple estimation (strength ~6 kcal/min)
              const estCalories = Math.round(durationMin * 6)
              try {
                const { fetchWithAuth } = await import('@/lib/api')
                await fetchWithAuth('/api/dashboard/workouts/history', {
                  method: 'POST',
                  body: JSON.stringify({ name: workout.name, date: new Date().toISOString(), duration_min: durationMin, calories: estCalories, type: 'strength' })
                })
              } catch {}
            }}>
              Log Workout
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
              <div className="font-bold text-foreground">{currentSet} / {workout.exercises[currentExercise].sets}</div>
              <div className="text-sm text-muted-foreground">Set</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-foreground">{workout.exercises[currentExercise].reps}</div>
              <div className="text-sm text-muted-foreground">Reps</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-foreground">{restRemaining !== null ? restRemaining : workout.exercises[currentExercise].rest}s</div>
              <div className="text-sm text-muted-foreground">Rest</div>
            </div>
          </div>

          <div className="flex justify-center">
            <Button size="sm" onClick={startNextSet} className="gap-2">Complete Set</Button>
          </div>
        </div>

        {/* Demo Video */}
        <div className="rounded-lg overflow-hidden border">
          <iframe
            key={workout.exercises[currentExercise].name}
            width="100%"
            height="315"
            src={videoSrc}
            title="Exercise demonstration"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
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
