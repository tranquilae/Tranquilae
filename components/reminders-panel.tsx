"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bell, Plus, Clock, CheckCircle } from "lucide-react"
import { useState } from "react"

export function RemindersPanel() {
  const [reminders, setReminders] = useState([
    {
      id: 1,
      title: "Morning workout",
      time: "7:00 AM",
      frequency: "Daily",
      active: true,
      nextDue: "Tomorrow",
    },
    {
      id: 2,
      title: "Take vitamins",
      time: "8:30 AM",
      frequency: "Daily",
      active: true,
      nextDue: "Tomorrow",
    },
    {
      id: 3,
      title: "Weekly meal prep",
      time: "2:00 PM",
      frequency: "Weekly",
      active: true,
      nextDue: "Sunday",
    },
    {
      id: 4,
      title: "Review weekly goals",
      time: "6:00 PM",
      frequency: "Weekly",
      active: false,
      nextDue: "Friday",
    },
  ])

  const upcomingReminders = reminders.filter((r) => r.active).slice(0, 3)

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Reminders
          </div>
          <Button size="sm" variant="outline" className="gap-2 bg-transparent">
            <Plus className="h-4 w-4" />
            Add
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upcoming Reminders */}
        <div className="space-y-3">
          <h3 className="font-medium text-sm text-muted-foreground">Upcoming</h3>
          {upcomingReminders.map((reminder) => (
            <div
              key={reminder.id}
              className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-accent/20 transition-colors"
            >
              <div className="flex-1">
                <h4 className="font-medium text-sm">{reminder.title}</h4>
                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>{reminder.time}</span>
                  <span>•</span>
                  <span>{reminder.nextDue}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {reminder.frequency}
                </Badge>
                <Button size="sm" variant="ghost">
                  <CheckCircle className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="space-y-2">
          <h3 className="font-medium text-sm text-muted-foreground">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-2">
            <Button size="sm" variant="outline" className="gap-2 bg-transparent">
              <Bell className="h-3 w-3" />
              Water
            </Button>
            <Button size="sm" variant="outline" className="gap-2 bg-transparent">
              <Bell className="h-3 w-3" />
              Stretch
            </Button>
            <Button size="sm" variant="outline" className="gap-2 bg-transparent">
              <Bell className="h-3 w-3" />
              Meditate
            </Button>
            <Button size="sm" variant="outline" className="gap-2 bg-transparent">
              <Bell className="h-3 w-3" />
              Journal
            </Button>
          </div>
        </div>

        {/* Today's Completed */}
        <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-green-700">3 reminders completed today</span>
          </div>
          <p className="text-xs text-green-600">Great job staying on track!</p>
        </div>
      </CardContent>
    </Card>
  )
}
