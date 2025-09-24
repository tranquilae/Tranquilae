import React from 'react'
import { WorkoutPlanner } from "@/components/workout-planner"
import { ActiveWorkout } from "@/components/active-workout"
import { WorkoutHistory } from "@/components/workout-history"
import { ExerciseLibrary } from "@/components/exercise-library"

export default function WorkoutsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Workouts</h1>
          <p className="text-muted-foreground mt-1">Plan, track, and analyze your fitness journey</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main workout area */}
        <div className="lg:col-span-2 space-y-6">
          <ActiveWorkout />
          <WorkoutPlanner />
        </div>

        {/* Right sidebar */}
        <div className="space-y-6">
          <ExerciseLibrary />
          <WorkoutHistory />
        </div>
      </div>
    </div>
  )
}
