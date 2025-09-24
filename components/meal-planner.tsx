"use client"

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Clock } from "lucide-react"

export function MealPlanner() {
  const meals = [
    {
      name: "Breakfast",
      time: "8:00 AM",
      calories: 420,
      items: ["Oatmeal with berries", "Greek yogurt", "Coffee"],
      completed: true,
    },
    {
      name: "Lunch",
      time: "12:30 PM",
      calories: 650,
      items: ["Grilled chicken salad", "Quinoa", "Olive oil dressing"],
      completed: true,
    },
    {
      name: "Snack",
      time: "3:00 PM",
      calories: 180,
      items: ["Apple", "Almonds"],
      completed: false,
    },
    {
      name: "Dinner",
      time: "7:00 PM",
      calories: 580,
      items: ["Salmon", "Roasted vegetables", "Brown rice"],
      completed: false,
    },
  ]

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Today's Meal Plan
          <Button size="sm" variant="outline" className="gap-2 bg-transparent">
            <Plus className="h-4 w-4" />
            Plan Meals
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {meals.map((meal, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-4 rounded-lg border border-border/50 hover:bg-accent/20 transition-colors"
          >
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="font-semibold">{meal.name}</h3>
                <Badge variant={meal.completed ? "default" : "secondary"}>
                  {meal.completed ? "Completed" : "Planned"}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <Clock className="h-4 w-4" />
                {meal.time}
                <span>•</span>
                <span>{meal.calories} cal</span>
              </div>
              <div className="text-sm text-muted-foreground">{meal.items.join(" • ")}</div>
            </div>
            <Button size="sm" variant="ghost">
              {meal.completed ? "Edit" : "Log"}
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
