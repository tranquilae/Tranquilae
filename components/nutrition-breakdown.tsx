"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

export function NutritionBreakdown() {
  const macros = [
    { name: "Carbs", current: 180, goal: 275, unit: "g", color: "bg-blue-500" },
    { name: "Protein", current: 95, goal: 138, unit: "g", color: "bg-green-500" },
    { name: "Fat", current: 65, goal: 73, unit: "g", color: "bg-orange-500" },
    { name: "Fiber", current: 18, goal: 25, unit: "g", color: "bg-purple-500" },
  ]

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle>Nutrition Breakdown</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {macros.map((macro) => {
          const percentage = (macro.current / macro.goal) * 100
          return (
            <div key={macro.name} className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">{macro.name}</span>
                <span className="text-muted-foreground">
                  {macro.current}
                  {macro.unit} / {macro.goal}
                  {macro.unit}
                </span>
              </div>
              <Progress value={percentage} className="h-2" />
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
