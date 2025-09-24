"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Droplets, Moon } from 'lucide-react'

export function QuickLog() {
  const [water, setWater] = useState<number>(1)
  const [sleep, setSleep] = useState<number>(7)
  const [saving, setSaving] = useState(false)

  const logWater = async () => {
    try {
      setSaving(true)
      await fetch('/api/log/water', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: water })
      })
    } finally { setSaving(false) }
  }

  const logSleep = async () => {
    try {
      setSaving(true)
      await fetch('/api/log/sleep', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hours: sleep })
      })
    } finally { setSaving(false) }
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle>Quick Log</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <Droplets className="h-4 w-4" />
          <Input type="number" min={0} step="1" value={water} onChange={(e) => setWater(Number(e.target.value || 0))} className="w-24" />
          <span className="text-sm text-muted-foreground">glasses</span>
          <Button size="sm" onClick={logWater} disabled={saving}>Log Water</Button>
        </div>
        <div className="flex items-center gap-2">
          <Moon className="h-4 w-4" />
          <Input type="number" min={0} step="0.5" value={sleep} onChange={(e) => setSleep(Number(e.target.value || 0))} className="w-24" />
          <span className="text-sm text-muted-foreground">hours</span>
          <Button size="sm" onClick={logSleep} disabled={saving}>Log Sleep</Button>
        </div>
      </CardContent>
    </Card>
  )
}

