"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Plus } from "lucide-react"
import { useState } from "react"

export function ExerciseLibrary() {
  const [searchQuery, setSearchQuery] = useState("")

  const exercises = [
    { name: "Push-ups", category: "Chest", difficulty: "Beginner" },
    { name: "Squats", category: "Legs", difficulty: "Beginner" },
    { name: "Deadlifts", category: "Back", difficulty: "Intermediate" },
    { name: "Burpees", category: "Full Body", difficulty: "Advanced" },
    { name: "Plank", category: "Core", difficulty: "Beginner" },
    { name: "Pull-ups", category: "Back", difficulty: "Intermediate" },
  ]

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Beginner":
        return "bg-green-500"
      case "Intermediate":
        return "bg-yellow-500"
      case "Advanced":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle>Exercise Library</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search exercises..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="space-y-2 max-h-64 overflow-y-auto">
          {exercises.map((exercise, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-2 rounded-lg hover:bg-accent/20 transition-colors"
            >
              <div className="flex-1">
                <p className="font-medium text-sm">{exercise.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {exercise.category}
                  </Badge>
                  <div className={`w-2 h-2 rounded-full ${getDifficultyColor(exercise.difficulty)}`} />
                  <span className="text-xs text-muted-foreground">{exercise.difficulty}</span>
                </div>
              </div>
              <Plus className="h-4 w-4 text-muted-foreground hover:text-foreground cursor-pointer" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
