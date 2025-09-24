"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Plus, Target, TrendingUp, Flame } from "lucide-react"
import { useDailyStats } from "@/hooks/use-dashboard-data"
import { Skeleton } from "@/components/ui/skeleton"

export function CalorieOverview() {
  const { stats, loading, error } = useDailyStats()
  
  if (loading) {
    return (
      <Card className="glass-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-9 w-24" />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-2">
            <Skeleton className="h-12 w-20 mx-auto" />
            <Skeleton className="h-4 w-40 mx-auto" />
          </div>
          <Skeleton className="h-3 w-full" />
          <div className="grid grid-cols-3 gap-4">
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
          </div>
        </CardContent>
      </Card>
    )
  }
  
  if (error || !stats) {
    return (
      <Card className="glass-card">
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">Unable to load calorie data</p>
        </CardContent>
      </Card>
    )
  }

  const { dailyCalorieGoal: dailyGoal, consumedCalories: consumed, burnedCalories: burned, macros } = stats
  const remaining = dailyGoal - consumed + burned
  const progressPercentage = Math.min((consumed / dailyGoal) * 100, 100)

  return (
    <Card className="glass-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl font-semibold flex items-center">
          <Flame className="mr-2 h-5 w-5 text-primary" />
          Daily Calories
        </CardTitle>
        <Button size="sm" className="bg-primary hover:bg-primary/90">
          <Plus className="mr-2 h-4 w-4" />
          Add Food
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main calorie display */}
        <div className="text-center space-y-2">
          <div className="text-4xl font-bold text-foreground">{remaining > 0 ? remaining : 0}</div>
          <p className="text-muted-foreground">
            {remaining > 0 ? "Calories remaining" : "Over goal by " + Math.abs(remaining)}
          </p>
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span>{Math.round(progressPercentage)}%</span>
          </div>
          <Progress
            value={progressPercentage}
            className="h-3"
            style={{
              background: "rgba(107, 163, 104, 0.2)",
            }}
          />
        </div>

        {/* Calorie breakdown */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 rounded-lg bg-accent/20">
            <Target className="h-5 w-5 mx-auto mb-2 text-primary" />
            <div className="text-2xl font-semibold text-foreground">{dailyGoal}</div>
            <div className="text-xs text-muted-foreground">Goal</div>
          </div>
          <div className="text-center p-4 rounded-lg bg-secondary/20">
            <div className="text-2xl font-semibold text-foreground">{consumed}</div>
            <div className="text-xs text-muted-foreground">Consumed</div>
          </div>
          <div className="text-center p-4 rounded-lg bg-primary/20">
            <TrendingUp className="h-5 w-5 mx-auto mb-2 text-primary" />
            <div className="text-2xl font-semibold text-foreground">{burned}</div>
            <div className="text-xs text-muted-foreground">Burned</div>
          </div>
        </div>

        {/* Macros breakdown */}
        <div className="space-y-3">
          <h4 className="font-medium text-foreground">Macronutrients</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Carbs</span>
              <div className="flex items-center space-x-2">
                <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-chart-1 rounded-full transition-all duration-300" 
                    style={{ width: `${Math.min((macros.carbs.consumed / macros.carbs.goal) * 100, 100)}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium">{macros.carbs.consumed}g</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Protein</span>
              <div className="flex items-center space-x-2">
                <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-chart-2 rounded-full transition-all duration-300" 
                    style={{ width: `${Math.min((macros.protein.consumed / macros.protein.goal) * 100, 100)}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium">{macros.protein.consumed}g</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Fat</span>
              <div className="flex items-center space-x-2">
                <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-chart-3 rounded-full transition-all duration-300" 
                    style={{ width: `${Math.min((macros.fat.consumed / macros.fat.goal) * 100, 100)}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium">{macros.fat.consumed}g</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
