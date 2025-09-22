"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Plus, Target, Calendar, CheckCircle } from "lucide-react"
import { useState } from "react"

export function GoalTracker() {
  const [goals, setGoals] = useState([
    {
      id: 1,
      title: "Lose 10 pounds",
      category: "Health",
      progress: 60,
      target: 10,
      current: 6,
      unit: "lbs",
      deadline: "Mar 15",
      status: "active",
    },
    {
      id: 2,
      title: "Meditate daily for 30 days",
      category: "Mindfulness",
      progress: 70,
      target: 30,
      current: 21,
      unit: "days",
      deadline: "Jan 31",
      status: "active",
    },
    {
      id: 3,
      title: "Run 5K without stopping",
      category: "Fitness",
      progress: 40,
      target: 5,
      current: 2,
      unit: "km",
      deadline: "Feb 28",
      status: "active",
    },
    {
      id: 4,
      title: "Read 12 books this year",
      category: "Personal",
      progress: 100,
      target: 12,
      current: 12,
      unit: "books",
      deadline: "Dec 31",
      status: "completed",
    },
  ])

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Health":
        return "bg-green-500"
      case "Fitness":
        return "bg-blue-500"
      case "Mindfulness":
        return "bg-purple-500"
      case "Personal":
        return "bg-orange-500"
      default:
        return "bg-gray-500"
    }
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            My Goals
          </div>
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            New Goal
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {goals.map((goal) => (
          <div key={goal.id} className="p-4 rounded-lg border border-border/50 hover:bg-accent/20 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold">{goal.title}</h3>
                  {goal.status === "completed" && <CheckCircle className="h-4 w-4 text-green-500" />}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className={`w-2 h-2 rounded-full ${getCategoryColor(goal.category)}`} />
                  <span>{goal.category}</span>
                  <Calendar className="h-3 w-3 ml-2" />
                  <span>{goal.deadline}</span>
                </div>
              </div>
              <Badge variant={goal.status === "completed" ? "default" : "secondary"}>
                {goal.status === "completed" ? "Completed" : "Active"}
              </Badge>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span className="text-muted-foreground">
                  {goal.current} / {goal.target} {goal.unit}
                </span>
              </div>
              <Progress value={goal.progress} className="h-2" />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
