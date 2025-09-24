import React from 'react'
import { AICoachChat } from "@/components/ai-coach-chat-full"
import { PersonalizedRecommendations } from "@/components/personalized-recommendations"
import { CoachInsights } from "@/components/coach-insights"
import { WeeklyPlan } from "@/components/weekly-plan"

export default function AICoachPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">AI Health Coach</h1>
          <p className="text-muted-foreground mt-1">Your personal wellness companion</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main chat area */}
        <div className="lg:col-span-2 space-y-6">
          <AICoachChat />
          <WeeklyPlan />
        </div>

        {/* Right sidebar */}
        <div className="space-y-6">
          <PersonalizedRecommendations />
          <CoachInsights />
        </div>
      </div>
    </div>
  )
}
