"use client"

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Clock, Utensils } from "lucide-react"
import { useState } from "react"
import { AddMealDialog } from "./add-meal-dialog"
import { useTodaysMeals, type Meal } from "@/hooks/use-dashboard-data"
import { Skeleton } from "@/components/ui/skeleton"

export function TodaysMeals() {
  const { meals, loading, error, addMeal } = useTodaysMeals()

  const [showAddMeal, setShowAddMeal] = useState(false)

  const handleAddMeal = async (newMeal: Omit<Meal, 'id' | 'user_id' | 'date'>) => {
    try {
      await addMeal(newMeal)
      setShowAddMeal(false)
    } catch (error) {
      console.error('Failed to add meal:', error)
    }
  }

  if (loading) {
    return (
      <Card className="glass-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-9 w-24" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </CardContent>
      </Card>
    )
  }

  const getMealTypeColor = (type: string) => {
    switch (type) {
      case "breakfast":
        return "bg-chart-1/20 text-chart-1"
      case "lunch":
        return "bg-chart-2/20 text-chart-2"
      case "dinner":
        return "bg-chart-3/20 text-chart-3"
      case "snack":
        return "bg-chart-4/20 text-chart-4"
      default:
        return "bg-muted/20 text-muted-foreground"
    }
  }

  return (
    <>
      <Card className="glass-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl font-semibold flex items-center">
            <Utensils className="mr-2 h-5 w-5 text-primary" />
            Today's Meals
          </CardTitle>
          <Button size="sm" className="bg-primary hover:bg-primary/90" onClick={() => setShowAddMeal(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Meal
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="text-center py-4 text-muted-foreground">
              <p className="text-sm">Unable to load meals</p>
            </div>
          )}
          
          {!error && meals.map((meal) => (
            <div key={meal.id} className="p-4 rounded-lg bg-muted/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Badge className={getMealTypeColor(meal.type)}>{meal.name}</Badge>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Clock className="mr-1 h-3 w-3" />
                    {meal.time}
                  </div>
                </div>
                <div className="text-lg font-semibold text-foreground">{meal.calories} cal</div>
              </div>

              <div className="space-y-2">
                {meal.foods.map((food, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-primary/60"></div>
                      <span className="text-foreground">{food.name}</span>
                      <span className="text-muted-foreground">({food.quantity})</span>
                    </div>
                    <span className="font-medium text-foreground">{food.calories} cal</span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {!error && meals.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Utensils className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>No meals logged today</p>
              <p className="text-sm">Start by adding your first meal</p>
            </div>
          )}
        </CardContent>
      </Card>

      <AddMealDialog
        open={showAddMeal}
        onOpenChange={setShowAddMeal}
        onAddMeal={handleAddMeal}
      />
    </>
  )
}
