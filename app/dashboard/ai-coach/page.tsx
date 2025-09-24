import React from 'react'
import dynamic from 'next/dynamic'

export const dynamic = 'force-dynamic'

const AICoachChat = dynamic(() => import('@/components/ai-coach-chat-full').then(m => m.AICoachChat), { ssr: false })
const PersonalizedRecommendations = dynamic(() => import('@/components/personalized-recommendations').then(m => m.PersonalizedRecommendations), { ssr: false })
const CoachInsights = dynamic(() => import('@/components/coach-insights').then(m => m.CoachInsights), { ssr: false })
const WeeklyPlan = dynamic(() => import('@/components/weekly-plan').then(m => m.WeeklyPlan), { ssr: false })

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
