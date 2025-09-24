"use client"

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Settings, Bell, Moon, Globe } from "lucide-react"
import { useState } from "react"

export function AppPreferences() {
  const [preferences, setPreferences] = useState({
    notifications: true,
    emailUpdates: false,
    darkMode: false,
    language: "en",
    units: "metric",
    weekStart: "monday",
    autoSync: true,
    dataSharing: false,
  })

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          App Preferences
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Notifications */}
        <div className="space-y-4">
          <h3 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="notifications">Push Notifications</Label>
                <p className="text-xs text-muted-foreground">Receive reminders and updates</p>
              </div>
              <Switch
                id="notifications"
                checked={preferences.notifications}
                onCheckedChange={(checked) => setPreferences({ ...preferences, notifications: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="emailUpdates">Email Updates</Label>
                <p className="text-xs text-muted-foreground">Weekly progress reports</p>
              </div>
              <Switch
                id="emailUpdates"
                checked={preferences.emailUpdates}
                onCheckedChange={(checked) => setPreferences({ ...preferences, emailUpdates: checked })}
              />
            </div>
          </div>
        </div>

        {/* Appearance */}
        <div className="space-y-4">
          <h3 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
            <Moon className="h-4 w-4" />
            Appearance
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="darkMode">Dark Mode</Label>
                <p className="text-xs text-muted-foreground">Use dark theme</p>
              </div>
              <Switch
                id="darkMode"
                checked={preferences.darkMode}
                onCheckedChange={(checked) => setPreferences({ ...preferences, darkMode: checked })}
              />
            </div>
          </div>
        </div>

        {/* Localization */}
        <div className="space-y-4">
          <h3 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Localization
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <Select
                value={preferences.language}
                onValueChange={(value) => setPreferences({ ...preferences, language: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Español</SelectItem>
                  <SelectItem value="fr">Français</SelectItem>
                  <SelectItem value="de">Deutsch</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="units">Units</Label>
              <Select
                value={preferences.units}
                onValueChange={(value) => setPreferences({ ...preferences, units: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="metric">Metric (kg, cm)</SelectItem>
                  <SelectItem value="imperial">Imperial (lbs, ft)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="weekStart">Week Starts On</Label>
              <Select
                value={preferences.weekStart}
                onValueChange={(value) => setPreferences({ ...preferences, weekStart: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monday">Monday</SelectItem>
                  <SelectItem value="sunday">Sunday</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Privacy & Data */}
        <div className="space-y-4">
          <h3 className="font-medium text-sm text-muted-foreground">Privacy & Data</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="autoSync">Auto Sync</Label>
                <p className="text-xs text-muted-foreground">Sync data across devices</p>
              </div>
              <Switch
                id="autoSync"
                checked={preferences.autoSync}
                onCheckedChange={(checked) => setPreferences({ ...preferences, autoSync: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="dataSharing">Anonymous Data Sharing</Label>
                <p className="text-xs text-muted-foreground">Help improve the app</p>
              </div>
              <Switch
                id="dataSharing"
                checked={preferences.dataSharing}
                onCheckedChange={(checked) => setPreferences({ ...preferences, dataSharing: checked })}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
