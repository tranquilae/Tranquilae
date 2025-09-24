"use client"

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, TrendingUp, TrendingDown, Minus } from "lucide-react"

interface FoodItem {
  name: string
  calories: number
  time: string
  type: "breakfast" | "lunch" | "dinner" | "snack"
  quantity: string
}

export function WhatYouAteBoard() {
  const todaysFoods: FoodItem[] = [
    { name: "Greek Yogurt", calories: 150, time: "8:30 AM", type: "breakfast", quantity: "1 cup" },
    { name: "Blueberries", calories: 80, time: "8:30 AM", type: "breakfast", quantity: "1/2 cup" },
    { name: "Granola", calories: 190, time: "8:30 AM", type: "breakfast", quantity: "1/4 cup" },
    { name: "Grilled Chicken Salad", calories: 350, time: "12:45 PM", type: "lunch", quantity: "1 serving" },
    { name: "Avocado", calories: 160, time: "12:45 PM", type: "lunch", quantity: "1/2 medium" },
    { name: "Olive Oil Dressing", calories: 140, time: "12:45 PM", type: "lunch", quantity: "2 tbsp" },
    { name: "Apple", calories: 95, time: "3:20 PM", type: "snack", quantity: "1 medium" },
    { name: "Almond Butter", calories: 85, time: "3:20 PM", type: "snack", quantity: "1 tbsp" },
  ]

  const getMealTypeColor = (type: string) => {
    switch (type) {
      case "breakfast":
        return "bg-chart-1/20 text-chart-1 border-chart-1/30"
      case "lunch":
        return "bg-chart-2/20 text-chart-2 border-chart-2/30"
      case "dinner":
        return "bg-chart-3/20 text-chart-3 border-chart-3/30"
      case "snack":
        return "bg-chart-4/20 text-chart-4 border-chart-4/30"
      default:
        return "bg-muted/20 text-muted-foreground border-muted/30"
    }
  }

  const getCalorieIndicator = (calories: number) => {
    if (calories > 200) return { icon: TrendingUp, color: "text-destructive" }
    if (calories < 100) return { icon: TrendingDown, color: "text-primary" }
    return { icon: Minus, color: "text-muted-foreground" }
  }

  const totalCalories = todaysFoods.reduce((sum, food) => sum + food.calories, 0)
  const averageCaloriesPerItem = Math.round(totalCalories / todaysFoods.length)

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="text-xl font-semibold flex items-center justify-between">
          <span>What You Ate Today</span>
          <div className="text-sm font-normal text-muted-foreground">
            {todaysFoods.length} items • {totalCalories} total calories
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-4 p-4 bg-muted/20 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">{todaysFoods.length}</div>
            <div className="text-xs text-muted-foreground">Food Items</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">{averageCaloriesPerItem}</div>
            <div className="text-xs text-muted-foreground">Avg Calories</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">4</div>
            <div className="text-xs text-muted-foreground">Meal Times</div>
          </div>
        </div>

        {/* Food timeline */}
        <div className="space-y-3">
          <h4 className="font-medium text-foreground">Food Timeline</h4>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {todaysFoods.map((food, index) => {
              const CalorieIcon = getCalorieIndicator(food.calories).icon
              const calorieColor = getCalorieIndicator(food.calories).color

              return (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border/50"
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground font-mono">{food.time}</span>
                    </div>
                    <Badge variant="outline" className={getMealTypeColor(food.type)}>
                      {food.type}
                    </Badge>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <div className="font-medium text-foreground">{food.name}</div>
                      <div className="text-xs text-muted-foreground">{food.quantity}</div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <CalorieIcon className={`h-4 w-4 ${calorieColor}`} />
                      <span className="font-semibold text-foreground">{food.calories}</span>
                      <span className="text-xs text-muted-foreground">cal</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Meal distribution */}
        <div className="space-y-3">
          <h4 className="font-medium text-foreground">Calorie Distribution</h4>
          <div className="space-y-2">
            {["breakfast", "lunch", "dinner", "snack"].map((mealType) => {
              const mealFoods = todaysFoods.filter((food) => food.type === mealType)
              const mealCalories = mealFoods.reduce((sum, food) => sum + food.calories, 0)
              const percentage = totalCalories > 0 ? (mealCalories / totalCalories) * 100 : 0

              if (mealCalories === 0) return null

              return (
                <div key={mealType} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className={getMealTypeColor(mealType)}>
                      {mealType}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {mealFoods.length} item{mealFoods.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-foreground w-16 text-right">{mealCalories} cal</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
