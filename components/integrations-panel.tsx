"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Smartphone, Watch, Activity, Heart, Zap } from "lucide-react"
import { useState } from "react"

export function IntegrationsPanel() {
  const [integrations, setIntegrations] = useState([
    {
      id: "apple_health",
      name: "Apple Health",
      icon: Smartphone,
      connected: true,
      description: "Sync steps, heart rate, and sleep data",
      lastSync: "2 hours ago",
    },
    {
      id: "fitbit",
      name: "Fitbit",
      icon: Watch,
      connected: false,
      description: "Track workouts and activity levels",
      lastSync: null,
    },
    {
      id: "garmin",
      name: "Garmin Connect",
      icon: Activity,
      connected: true,
      description: "Import workout data and metrics",
      lastSync: "1 day ago",
    },
    {
      id: "google_fit",
      name: "Google Fit",
      icon: Heart,
      connected: false,
      description: "Sync fitness and health data",
      lastSync: null,
    },
    {
      id: "strava",
      name: "Strava",
      icon: Zap,
      connected: false,
      description: "Import running and cycling activities",
      lastSync: null,
    },
  ])

  const toggleIntegration = (id: string) => {
    setIntegrations(
      integrations.map((integration) =>
        integration.id === id ? { ...integration, connected: !integration.connected } : integration,
      ),
    )
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle>Health App Integrations</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {integrations.map((integration) => {
          const Icon = integration.icon
          return (
            <div
              key={integration.id}
              className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-accent/20 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-accent/20">
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-sm">{integration.name}</h4>
                    <Badge variant={integration.connected ? "default" : "secondary"}>
                      {integration.connected ? "Connected" : "Disconnected"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{integration.description}</p>
                  {integration.connected && integration.lastSync && (
                    <p className="text-xs text-green-600">Last sync: {integration.lastSync}</p>
                  )}
                </div>
              </div>
              <Switch checked={integration.connected} onCheckedChange={() => toggleIntegration(integration.id)} />
            </div>
          )
        })}

        <div className="p-3 rounded-lg bg-accent/10 border border-border/50">
          <p className="text-xs text-muted-foreground">
            <strong>Note:</strong> Integrations sync automatically every 4 hours. Manual sync available in each
            connected app.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
