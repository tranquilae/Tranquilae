"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Plus } from "lucide-react"
import { useState } from "react"

export function FoodSearch() {
  const [searchQuery, setSearchQuery] = useState("")

  const recentFoods = [
    { name: "Greek Yogurt", calories: 130, brand: "Chobani" },
    { name: "Banana", calories: 105, brand: "Fresh" },
    { name: "Chicken Breast", calories: 165, brand: "Organic" },
    { name: "Brown Rice", calories: 216, brand: "Uncle Ben's" },
  ]

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle>Food Search</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search foods..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">Recent Foods</h4>
          {recentFoods.map((food, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-2 rounded-lg hover:bg-accent/20 transition-colors"
            >
              <div>
                <p className="font-medium text-sm">{food.name}</p>
                <p className="text-xs text-muted-foreground">
                  {food.brand} • {food.calories} cal
                </p>
              </div>
              <Button size="sm" variant="ghost">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
