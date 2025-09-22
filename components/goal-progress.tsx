"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { TrendingUp, Award, Target } from "lucide-react"

export function GoalProgress() {
  const overallProgress = 67
  const completedGoals = 3
  const activeGoals = 5
  const totalGoals = 8

  const recentAchievements = [
    {
      title: "Read 12 books",
      date: "Dec 20",
      category: "Personal",
    },
    {
      title: "30-day meditation streak",
      date: "Dec 15",
      category: "Mindfulness",
    },
    {
      title: "Lost 5 pounds",
      date: "Dec 10",
      category: "Health",
    },
  ]

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Goal Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Progress */}
        <div className="text-center space-y-3">
          <div className="text-3xl font-bold text-primary">{overallProgress}%</div>
          <p className="text-sm text-muted-foreground">Overall Progress</p>
          <Progress value={overallProgress} className="h-3" />
        </div>

        {/* Goal Stats */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="space-y-1">
            <div className="text-xl font-semibold text-green-600">{completedGoals}</div>
            <p className="text-xs text-muted-foreground">Completed</p>
          </div>
          <div className="space-y-1">
            <div className="text-xl font-semibold text-blue-600">{activeGoals}</div>
            <p className="text-xs text-muted-foreground">Active</p>
          </div>
          <div className="space-y-1">
            <div className="text-xl font-semibold text-foreground">{totalGoals}</div>
            <p className="text-xs text-muted-foreground">Total</p>
          </div>
        </div>

        {/* Recent Achievements */}
        <div className="space-y-3">
          <h3 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
            <Award className="h-4 w-4" />
            Recent Achievements
          </h3>
          {recentAchievements.map((achievement, index) => (
            <div key={index} className="flex items-center gap-3 p-2 rounded-lg bg-accent/10">
              <Award className="h-4 w-4 text-yellow-500" />
              <div className="flex-1">
                <p className="text-sm font-medium">{achievement.title}</p>
                <p className="text-xs text-muted-foreground">
                  {achievement.category} • {achievement.date}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* This Week's Focus */}
        <div className="p-4 rounded-lg bg-gradient-to-r from-primary/10 to-secondary/10">
          <div className="flex items-center gap-2 mb-2">
            <Target className="h-4 w-4 text-primary" />
            <h3 className="font-medium text-sm">This Week's Focus</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Complete 5 workout sessions and maintain daily meditation practice
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
