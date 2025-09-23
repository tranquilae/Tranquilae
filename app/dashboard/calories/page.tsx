import { CalorieTracker } from "@/components/calorie-tracker"
import { NutritionBreakdown } from "@/components/nutrition-breakdown"
import { MealPlanner } from "@/components/meal-planner"
import { FoodSearch } from "@/components/food-search"

export default function CaloriesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Calorie Tracking</h1>
          <p className="text-muted-foreground mt-1">Track your nutrition and reach your goals</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main tracking area */}
        <div className="lg:col-span-2 space-y-6">
          <CalorieTracker />
          <MealPlanner />
        </div>

        {/* Right sidebar */}
        <div className="space-y-6">
          <FoodSearch />
          <NutritionBreakdown />
        </div>
      </div>
    </div>
  )
}
