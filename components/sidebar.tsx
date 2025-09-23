"use client"

import { Home, Utensils, Dumbbell, Brain, BookOpen, MessageCircle, Settings } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Logo } from "@/components/logo"

const navigation = [
  { name: "Home", icon: Home, href: "/" },
  { name: "Calories", icon: Utensils, href: "/calories" },
  { name: "Workouts", icon: Dumbbell, href: "/workouts" },
  { name: "Mindfulness", icon: Brain, href: "/mindfulness" },
  { name: "Notes & Goals", icon: BookOpen, href: "/notes" },
  { name: "AI Coach", icon: MessageCircle, href: "/ai-coach" },
  { name: "Settings", icon: Settings, href: "/settings" },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="fixed inset-y-0 left-0 w-64 glass-card border-r">
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="flex items-center px-6 py-8">
          <Logo href="/dashboard" className="h-8 w-auto" />
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-2">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200",
                pathname === item.href
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
              <p className="text-sm font-medium text-foreground">User Profile</p>
              <p className="text-xs text-muted-foreground">Premium Plan</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
