"use client"

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Lightbulb, Utensils, Dumbbell, Heart, ArrowRight } from "lucide-react"

export function PersonalizedRecommendations() {
  const [recs, setRecs] = React.useState<Array<{ type:string; title:string; description:string; priority:'low'|'medium'|'high' }>>([])

  React.useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const { fetchWithAuth } = await import('@/lib/api')
        const res = await fetchWithAuth('/api/dashboard/recommendations')
        if (res.ok) {
          const data = await res.json()
          if (mounted && Array.isArray(data.recommendations)) setRecs(data.recommendations)
        }
      } catch {}
    })()
    return () => { mounted = false }
  }, [])

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
        {recs.length === 0 && (
          <div className="text-xs text-muted-foreground">No recommendations yet.</div>
        )}
        {recs.map((rec, index) => {
          // Choose an icon based on type
          const Icon = rec.type === 'nutrition' ? Utensils : rec.type === 'fitness' ? Dumbbell : Heart
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
                    Action
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
