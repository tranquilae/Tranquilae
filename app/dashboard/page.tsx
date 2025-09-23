"use client"

import { DashboardHeader } from "@/components/dashboard-header"
import { CalorieOverview } from "@/components/calorie-overview"
import { TodaysMeals } from "@/components/todays-meals"
import { QuickStats } from "@/components/quick-stats"
import { AICoachChat } from "@/components/ai-coach-chat"
import { WhatYouAteBoard } from "@/components/what-you-ate-board"

export default function DashboardPage() {
  return (
    <>
      <DashboardHeader />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Main content area */}
        <div className="lg:col-span-2 space-y-6">
          <CalorieOverview />
          <TodaysMeals />
          <WhatYouAteBoard />
        </div>

        {/* Right sidebar */}
        <div className="space-y-6">
          <QuickStats />
          <AICoachChat />
        </div>
      </div>
    </>
  )
}
