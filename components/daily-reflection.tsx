"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Heart, Smile, Meh, Frown, Sun } from "lucide-react"
import { useState } from "react"

export function DailyReflection() {
  const [selectedMood, setSelectedMood] = useState<number | null>(null)
  const [selectedEnergy, setSelectedEnergy] = useState<number | null>(null)

  const moods = [
    { icon: Frown, label: "Struggling", color: "text-red-500" },
    { icon: Meh, label: "Okay", color: "text-yellow-500" },
    { icon: Smile, label: "Good", color: "text-green-500" },
    { icon: Heart, label: "Great", color: "text-pink-500" },
  ]

  const energyLevels = [
    { level: 1, label: "Low" },
    { level: 2, label: "Moderate" },
    { level: 3, label: "High" },
    { level: 4, label: "Energized" },
  ]

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sun className="h-5 w-5" />
          Daily Check-in
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Mood Tracker */}
        <div className="space-y-3">
          <h3 className="font-medium text-sm">How are you feeling?</h3>
          <div className="grid grid-cols-2 gap-2">
            {moods.map((mood, index) => {
              const Icon = mood.icon
              return (
                <button
                  key={index}
                  onClick={() => setSelectedMood(index)}
                  className={`p-3 rounded-lg border transition-all ${
                    selectedMood === index ? "border-primary bg-primary/5" : "border-border/50 hover:bg-accent/20"
                  }`}
                >
                  <div className="flex flex-col items-center gap-1">
                    <Icon className={`h-6 w-6 ${mood.color}`} />
                    <span className="text-xs">{mood.label}</span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Energy Level */}
        <div className="space-y-3">
          <h3 className="font-medium text-sm">Energy Level</h3>
          <div className="grid grid-cols-4 gap-1">
            {energyLevels.map((energy, index) => (
              <button
                key={index}
                onClick={() => setSelectedEnergy(index)}
                className={`p-2 rounded-lg border transition-all ${
                  selectedEnergy === index ? "border-primary bg-primary/5" : "border-border/50 hover:bg-accent/20"
                }`}
              >
                <div className="text-center">
                  <div
                    className={`h-2 rounded-full mb-1 ${selectedEnergy === index ? "bg-primary" : "bg-muted"}`}
                    style={{ width: `${(energy.level / 4) * 100}%` }}
                  />
                  <span className="text-xs">{energy.label}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Quick Reflection */}
        <div className="space-y-3">
          <h3 className="font-medium text-sm">Today's Highlight</h3>
          <div className="p-3 rounded-lg bg-accent/10 border border-border/50">
            <p className="text-sm text-muted-foreground italic">
              "Completed a 15-minute meditation and felt more centered throughout the day."
            </p>
          </div>
        </div>

        {/* Streak */}
        <div className="text-center p-4 rounded-lg bg-gradient-to-r from-primary/10 to-secondary/10">
          <div className="text-2xl font-bold text-primary">7</div>
          <p className="text-sm text-muted-foreground">Day Mindfulness Streak</p>
        </div>

        <Button className="w-full">Save Reflection</Button>
      </CardContent>
    </Card>
  )
}
