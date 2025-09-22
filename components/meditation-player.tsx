"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Play, Pause, SkipBack, SkipForward, Volume2 } from "lucide-react"
import { useState } from "react"

export function MeditationPlayer() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [selectedMeditation, setSelectedMeditation] = useState(0)

  const meditations = [
    {
      title: "Morning Mindfulness",
      duration: "10 min",
      category: "Focus",
      description: "Start your day with clarity and intention",
      totalSeconds: 600,
    },
    {
      title: "Stress Relief",
      duration: "15 min",
      category: "Relaxation",
      description: "Release tension and find calm",
      totalSeconds: 900,
    },
    {
      title: "Sleep Stories",
      duration: "20 min",
      category: "Sleep",
      description: "Gentle stories to help you drift off",
      totalSeconds: 1200,
    },
    {
      title: "Breathing Exercise",
      duration: "5 min",
      category: "Breathing",
      description: "Simple breathing techniques for instant calm",
      totalSeconds: 300,
    },
  ]

  const currentMeditation = meditations[selectedMeditation]
  const progress = (currentTime / currentMeditation.totalSeconds) * 100

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle>Guided Meditations</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Meditation */}
        <div className="text-center space-y-4 p-6 rounded-lg bg-gradient-to-br from-primary/10 to-secondary/10">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-foreground">{currentMeditation.title}</h2>
            <Badge variant="outline">{currentMeditation.category}</Badge>
            <p className="text-muted-foreground">{currentMeditation.description}</p>
          </div>

          {/* Progress */}
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{formatTime(currentTime)}</span>
              <span>{currentMeditation.duration}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-4">
            <Button size="sm" variant="outline">
              <SkipBack className="h-4 w-4" />
            </Button>
            <Button size="lg" onClick={() => setIsPlaying(!isPlaying)} className="rounded-full w-16 h-16">
              {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
            </Button>
            <Button size="sm" variant="outline">
              <SkipForward className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline">
              <Volume2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Meditation Library */}
        <div className="space-y-3">
          <h3 className="font-medium text-muted-foreground">Choose a Session</h3>
          {meditations.map((meditation, index) => (
            <div
              key={index}
              onClick={() => setSelectedMeditation(index)}
              className={`p-4 rounded-lg border cursor-pointer transition-all ${
                index === selectedMeditation ? "border-primary bg-primary/5" : "border-border/50 hover:bg-accent/20"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">{meditation.title}</h4>
                  <p className="text-sm text-muted-foreground">{meditation.description}</p>
                </div>
                <div className="text-right">
                  <Badge variant="outline" className="mb-1">
                    {meditation.category}
                  </Badge>
                  <p className="text-sm text-muted-foreground">{meditation.duration}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
