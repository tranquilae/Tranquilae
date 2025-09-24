"use client"

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { fetchWithAuth, parseAPIResponse } from '@/lib/api'
import { useToast } from '@/components/ui/use-toast'

interface Settings {
  daily_calorie_goal: number
  steps_goal: number
  water_goal: number
  sleep_goal: number
  active_minutes_goal: number
  macros_goal: { carbs: number; protein: number; fat: number }
}

export function SettingsGoals() {
  const [settings, setSettings] = useState<Settings>({
    daily_calorie_goal: 0,
    steps_goal: 0,
    water_goal: 0,
    sleep_goal: 0,
    active_minutes_goal: 0,
    macros_goal: { carbs: 0, protein: 0, fat: 0 }
  })
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await fetchWithAuth('/api/user/settings')
        if (res.ok) {
          const s = await res.json()
          if (mounted) setSettings({
            daily_calorie_goal: Number(s.daily_calorie_goal || 0),
            steps_goal: Number(s.steps_goal || 0),
            water_goal: Number(s.water_goal || 0),
            sleep_goal: Number(s.sleep_goal || 0),
            active_minutes_goal: Number(s.active_minutes_goal || 0),
            macros_goal: {
              carbs: Number(s?.macros_goal?.carbs || 0),
              protein: Number(s?.macros_goal?.protein || 0),
              fat: Number(s?.macros_goal?.fat || 0)
            }
          })
        }
      } catch {}
    })()
    return () => { mounted = false }
  }, [])

  const save = async () => {
    try {
      setSaving(true)
      const res = await fetchWithAuth('/api/user/settings', {
        method: 'PATCH',
        body: JSON.stringify(settings)
      })
      if (!res.ok) throw new Error('Failed to save settings')
      toast({ title: 'Goals updated' })
    } catch (e) {
      toast({ title: 'Save failed', description: e instanceof Error ? e.message : 'Please try again', variant: 'destructive' })
    }
    finally { setSaving(false) }
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle>Goals</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Daily Calorie Goal</Label>
            <Input type="number" value={settings.daily_calorie_goal}
              onChange={(e) => setSettings({ ...settings, daily_calorie_goal: Number(e.target.value || 0) })} />
          </div>
          <div className="space-y-2">
            <Label>Steps Goal</Label>
            <Input type="number" value={settings.steps_goal}
              onChange={(e) => setSettings({ ...settings, steps_goal: Number(e.target.value || 0) })} />
          </div>
          <div className="space-y-2">
            <Label>Water Goal (glasses)</Label>
            <Input type="number" value={settings.water_goal}
              onChange={(e) => setSettings({ ...settings, water_goal: Number(e.target.value || 0) })} />
          </div>
          <div className="space-y-2">
            <Label>Sleep Goal (hours)</Label>
            <Input type="number" value={settings.sleep_goal}
              onChange={(e) => setSettings({ ...settings, sleep_goal: Number(e.target.value || 0) })} />
          </div>
          <div className="space-y-2">
            <Label>Active Minutes Goal</Label>
            <Input type="number" value={settings.active_minutes_goal}
              onChange={(e) => setSettings({ ...settings, active_minutes_goal: Number(e.target.value || 0) })} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Carbs Goal (g)</Label>
            <Input type="number" value={settings.macros_goal.carbs}
              onChange={(e) => setSettings({ ...settings, macros_goal: { ...settings.macros_goal, carbs: Number(e.target.value || 0) } })} />
          </div>
          <div className="space-y-2">
            <Label>Protein Goal (g)</Label>
            <Input type="number" value={settings.macros_goal.protein}
              onChange={(e) => setSettings({ ...settings, macros_goal: { ...settings.macros_goal, protein: Number(e.target.value || 0) } })} />
          </div>
          <div className="space-y-2">
            <Label>Fat Goal (g)</Label>
            <Input type="number" value={settings.macros_goal.fat}
              onChange={(e) => setSettings({ ...settings, macros_goal: { ...settings.macros_goal, fat: Number(e.target.value || 0) } })} />
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={save} disabled={saving}>Save</Button>
        </div>
      </CardContent>
    </Card>
  )
}

