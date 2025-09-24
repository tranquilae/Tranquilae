"use client"

import React, { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

// Dynamic imports with no SSR to prevent server-side React reference errors
const AICoachChat = dynamic(() => import('./ai-coach-chat-full').then(m => ({ default: m.AICoachChat })), { 
  ssr: false,
  loading: () => <div className="h-64 animate-pulse bg-muted rounded-lg" />
})

const PersonalizedRecommendations = dynamic(() => import('./personalized-recommendations').then(m => ({ default: m.PersonalizedRecommendations })), { 
  ssr: false,
  loading: () => <div className="h-48 animate-pulse bg-muted rounded-lg" />
})

const CoachInsights = dynamic(() => import('./coach-insights').then(m => ({ default: m.CoachInsights })), { 
  ssr: false,
  loading: () => <div className="h-48 animate-pulse bg-muted rounded-lg" />
})

const WeeklyPlan = dynamic(() => import('./weekly-plan').then(m => ({ default: m.WeeklyPlan })), { 
  ssr: false,
  loading: () => <div className="h-64 animate-pulse bg-muted rounded-lg" />
})

export function AICoachWrapper() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">AI Health Coach</h1>
            <p className="text-muted-foreground mt-1">Your personal wellness companion</p>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-64 animate-pulse bg-muted rounded-lg" />
            <div className="h-64 animate-pulse bg-muted rounded-lg" />
          </div>
          <div className="space-y-6">
            <div className="h-48 animate-pulse bg-muted rounded-lg" />
            <div className="h-48 animate-pulse bg-muted rounded-lg" />
          </div>
        </div>
      </div>
    )
  }

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
