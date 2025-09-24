"use client"

import React from "react"
import { Sidebar } from "@/components/sidebar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.6),transparent_60%),radial-gradient(ellipse_at_bottom,rgba(167,199,231,0.15),transparent_60%)] dark:bg-[radial-gradient(ellipse_at_top,rgba(45,55,72,0.6),transparent_60%),radial-gradient(ellipse_at_bottom,rgba(107,163,104,0.15),transparent_60%)]">
      <div className="flex">
        <div className="fixed left-0 top-0 h-screen w-64 backdrop-blur-xl bg-sidebar/70 border-r border-sidebar-border/60 shadow-[0_8px_32px_rgba(0,0,0,0.15)]">
          <Sidebar />
        </div>
        <main className="flex-1 ml-64 p-6">
          <div className="backdrop-blur-xl bg-card/60 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.08)] p-4">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
