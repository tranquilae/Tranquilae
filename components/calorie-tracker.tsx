"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Plus, Camera, Search } from "lucide-react"
import { useState } from "react"

export function CalorieTracker() {
  const [dailyGoal] = useState(2200)
  const [consumed] = useState(1650)
  const [burned] = useState(320)

  const remaining = dailyGoal - consumed + burned
  const progressPercentage = (consumed / dailyGoal) * 100

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Daily Calorie Goal
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="gap-2 bg-transparent">
              <Camera className="h-4 w-4" />
              Scan
            </Button>
            <Button size="sm" variant="outline" className="gap-2 bg-transparent">
              <Search className="h-4 w-4" />
              Search
            </Button>
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Add Food
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Calorie Progress */}
        <div className="text-center space-y-4">
          <div className="text-4xl font-bold text-primary">{remaining}</div>
          <p className="text-muted-foreground">Calories Remaining</p>
          <Progress value={progressPercentage} className="h-3" />
        </div>

        {/* Calorie Breakdown */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="space-y-1">
            <div className="text-2xl font-semibold text-foreground">{dailyGoal}</div>
            <p className="text-sm text-muted-foreground">Goal</p>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-semibold text-green-600">{consumed}</div>
            <p className="text-sm text-muted-foreground">Food</p>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-semibold text-blue-600">{burned}</div>
            <p className="text-sm text-muted-foreground">Exercise</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
