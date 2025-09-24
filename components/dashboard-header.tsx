"use client"

import React from 'react'
import { Bell, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function DashboardHeader() {
  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return (
    <header className="flex items-center justify-between backdrop-blur-xl bg-card/60 rounded-2xl p-4 shadow-[0_8px_32px_rgba(0,0,0,0.08)]">
      <div>
        <h1 className="text-3xl font-bold text-foreground text-balance">Welcome back</h1>
        <p className="text-muted-foreground mt-1">{currentDate}</p>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search meals, exercises..." className="pl-10 w-64" />
        </div>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute -top-1 -right-1 h-3 w-3 bg-primary rounded-full"></span>
        </Button>
      </div>
    </header>
  )
}
