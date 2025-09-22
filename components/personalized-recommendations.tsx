"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Lightbulb, Utensils, Dumbbell, Heart, ArrowRight } from "lucide-react"

export function PersonalizedRecommendations() {
  const recommendations = [
    {
      type: "nutrition",
      icon: Utensils,
      title: "Increase Protein Intake",
      description: "Add 20g more protein to reach your daily goal of 120g",
      action: "View meal suggestions",
      priority: "high",
    },
    {
      type: "fitness",
      icon: Dumbbell,
      title: "Rest Day Needed",
      description: "You've worked out 4 days straight. Consider active recovery",
      action: "Plan rest day",
      priority: "medium",
    },
    {
      type: "wellness",
      icon: Heart,
      title: "Hydration Check",
      description: "You're 2 glasses behind your daily water goal",
      action: "Set reminder",
      priority: "low",
    },
  ]

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-500"
      case "medium":
        return "bg-yellow-500"
      case "low":
        return "bg-green-500"
      default:
        return "bg-gray-500"
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "nutrition":
        return "text-green-600"
      case "fitness":
        return "text-blue-600"
      case "wellness":
        return "text-purple-600"
      default:
        return "text-gray-600"
    }
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5" />
          Recommendations
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {recommendations.map((rec, index) => {
          const Icon = rec.icon
          return (
            <div key={index} className="p-4 rounded-lg border border-border/50 hover:bg-accent/20 transition-colors">
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg bg-accent/20`}>
                  <Icon className={`h-4 w-4 ${getTypeColor(rec.type)}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-sm">{rec.title}</h4>
                    <div className={`w-2 h-2 rounded-full ${getPriorityColor(rec.priority)}`} />
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">{rec.description}</p>
                  <Button size="sm" variant="outline" className="gap-2 text-xs bg-transparent">
                    {rec.action}
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          )
        })}

        {/* AI Insight */}
        <div className="p-4 rounded-lg bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="h-4 w-4 text-primary" />
            <h4 className="font-medium text-sm">AI Insight</h4>
          </div>
          <p className="text-xs text-muted-foreground">
            Based on your recent activity, you're 85% on track with your goals. Focus on consistency rather than
            perfection this week.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
