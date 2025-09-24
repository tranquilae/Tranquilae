"use client"

import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Minus, Search } from "lucide-react"
import { useState } from "react"

interface Food {
  name: string
  calories: number
  quantity: string
}

interface AddMealDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddMeal: (meal: {
    name: string
    time: string
    calories: number
    type: "breakfast" | "lunch" | "dinner" | "snack"
    foods: Food[]
  }) => void
}

export function AddMealDialog({ open, onOpenChange, onAddMeal }: AddMealDialogProps) {
  const [mealType, setMealType] = useState<"breakfast" | "lunch" | "dinner" | "snack">("breakfast")
  const [mealName, setMealName] = useState("")
  const [mealTime, setMealTime] = useState("")
  const [foods, setFoods] = useState<Food[]>([{ name: "", calories: 0, quantity: "" }])
  const [searchQuery, setSearchQuery] = useState("")

  const commonFoods = [
    { name: "Banana", calories: 105, unit: "1 medium" },
    { name: "Apple", calories: 95, unit: "1 medium" },
    { name: "Greek Yogurt", calories: 150, unit: "1 cup" },
    { name: "Chicken Breast", calories: 165, unit: "100g" },
    { name: "Brown Rice", calories: 110, unit: "1/2 cup cooked" },
    { name: "Avocado", calories: 160, unit: "1/2 medium" },
    { name: "Eggs", calories: 70, unit: "1 large" },
    { name: "Oatmeal", calories: 150, unit: "1 cup cooked" },
  ]

  const filteredFoods = commonFoods.filter((food) => food.name.toLowerCase().includes(searchQuery.toLowerCase()))

  const addFood = () => {
    setFoods([...foods, { name: "", calories: 0, quantity: "" }])
  }

  const removeFood = (index: number) => {
    if (foods.length > 1) {
      setFoods(foods.filter((_, i) => i !== index))
    }
  }

  const updateFood = (index: number, field: keyof Food, value: string | number) => {
    const updatedFoods = foods.map((food, i) => (i === index ? { ...food, [field]: value } : food))
    setFoods(updatedFoods)
  }

  const selectCommonFood = (food: (typeof commonFoods)[0], index: number) => {
    updateFood(index, "name", food.name)
    updateFood(index, "calories", food.calories)
    updateFood(index, "quantity", food.unit)
    setSearchQuery("")
  }

  const handleSubmit = () => {
    const totalCalories = foods.reduce((sum, food) => sum + food.calories, 0)
    const validFoods = foods.filter((food) => food.name && food.calories > 0)

    if (validFoods.length === 0) return

    onAddMeal({
      name: mealName || mealType.charAt(0).toUpperCase() + mealType.slice(1),
      time:
        mealTime ||
        new Date().toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        }),
      calories: totalCalories,
      type: mealType,
      foods: validFoods,
    })

    // Reset form
    setMealName("")
    setMealTime("")
    setFoods([{ name: "", calories: 0, quantity: "" }])
    setSearchQuery("")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Meal</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Meal details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="meal-type">Meal Type</Label>
              <Select value={mealType} onValueChange={(value: any) => setMealType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="breakfast">Breakfast</SelectItem>
                  <SelectItem value="lunch">Lunch</SelectItem>
                  <SelectItem value="dinner">Dinner</SelectItem>
                  <SelectItem value="snack">Snack</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="meal-time">Time (optional)</Label>
              <Input id="meal-time" type="time" value={mealTime} onChange={(e) => setMealTime(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="meal-name">Custom Meal Name (optional)</Label>
            <Input
              id="meal-name"
              placeholder="e.g., Post-workout smoothie"
              value={mealName}
              onChange={(e) => setMealName(e.target.value)}
            />
          </div>

          {/* Food search */}
          <div className="space-y-2">
            <Label>Search Common Foods</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search for foods..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            {searchQuery && (
              <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                {filteredFoods.map((food, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    size="sm"
                    className="justify-start text-left h-auto p-2"
                    onClick={() => selectCommonFood(food, 0)}
                  >
                    <div>
                      <div className="font-medium">{food.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {food.calories} cal per {food.unit}
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            )}
          </div>

          {/* Foods list */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Foods</Label>
              <Button type="button" size="sm" variant="outline" onClick={addFood}>
                <Plus className="mr-2 h-4 w-4" />
                Add Food
              </Button>
            </div>

            {foods.map((food, index) => (
              <div key={index} className="flex items-end space-x-2">
                <div className="flex-1 space-y-2">
                  <Input
                    placeholder="Food name"
                    value={food.name}
                    onChange={(e) => updateFood(index, "name", e.target.value)}
                  />
                </div>
                <div className="w-24 space-y-2">
                  <Input
                    type="number"
                    placeholder="Calories"
                    value={food.calories || ""}
                    onChange={(e) => updateFood(index, "calories", Number.parseInt(e.target.value) || 0)}
                  />
                </div>
                <div className="w-24 space-y-2">
                  <Input
                    placeholder="Quantity"
                    value={food.quantity}
                    onChange={(e) => updateFood(index, "quantity", e.target.value)}
                  />
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => removeFood(index)}
                  disabled={foods.length === 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          {/* Total calories */}
          <div className="text-center p-4 bg-muted/30 rounded-lg">
            <div className="text-2xl font-bold text-foreground">
              {foods.reduce((sum, food) => sum + food.calories, 0)} calories
            </div>
            <div className="text-sm text-muted-foreground">Total for this meal</div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} className="bg-primary hover:bg-primary/90">
              Add Meal
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
