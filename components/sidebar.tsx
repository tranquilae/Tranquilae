"use client"

import React from 'react'
import { Home, Utensils, Dumbbell, Brain, BookOpen, MessageCircle, Settings, Shield } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/components/AuthProvider"

const navigation = [
  { name: "Home", icon: Home, href: "/dashboard" },
  { name: "Workouts", icon: Dumbbell, href: "/dashboard/workouts" },
  { name: "Achievements", icon: BookOpen, href: "/dashboard/achievements" },
  { name: "Settings", icon: Settings, href: "/dashboard/settings" },
  { name: "Admin Media", icon: Shield, href: "/dashboard/admin/media", adminOnly: true },
]

export function Sidebar() {
  const pathname = usePathname()
  const { user, neonUser } = useAuth()
  
  const isAdmin = neonUser?.email?.includes('admin') || false
  const filteredNavigation = navigation.filter(item => !item.adminOnly || isAdmin)
  
  const userName = neonUser?.display_name || user?.email?.split('@')[0] || 'User'
  const planLabel = neonUser?.explorer ? 'Explorer Plan' : 'Pathfinder Plan'

  return (
    <div className="fixed inset-y-0 left-0 w-64 glass-card border-r">
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="flex items-center px-6 py-8">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-sm">T</span>
            </div>
            <span className="text-xl font-bold text-gradient">Tranquilae</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-2">
          {filteredNavigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200",
                // Handle active state for exact matches and nested routes
                pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))
                  ? "bg-primary text-primary-foreground shadow-lg"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
              )}
            >
              <item.icon className="mr-3 h-5 w-5" />
              {item.name}
            </Link>
          ))}
        </nav>

        {/* User profile */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center">
              <span className="text-white font-medium">U</span>
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">{userName || 'User'}</p>
              <p className="text-xs text-muted-foreground">{planLabel || 'Explorer Plan'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
