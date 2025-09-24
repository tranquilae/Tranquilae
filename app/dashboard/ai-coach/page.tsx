"use client"

import React, { useEffect, useState } from 'react'

// Prevent static generation and SSR issues
export const dynamic = 'force-dynamic'

function LoadingSkeleton() {
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

export default function AICoachPage() {
  const [mounted, setMounted] = useState(false)
  const [AICoachWrapper, setAICoachWrapper] = useState<React.ComponentType | null>(null)

  useEffect(() => {
    setMounted(true)
    
    // Only import after component mounts
    import('@/components/ai-coach-wrapper')
      .then(module => {
        setAICoachWrapper(() => module.AICoachWrapper)
      })
      .catch(() => {
        // Fallback in case of import error
        console.error('Failed to load AI Coach wrapper')
      })
  }, [])

  if (!mounted || !AICoachWrapper) {
    return <LoadingSkeleton />
  }

  return <AICoachWrapper />
}
