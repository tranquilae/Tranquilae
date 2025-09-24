"use client"

import React, { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Save, Calendar } from "lucide-react"
import { supabase } from '@/lib/supabase'

interface JournalItem {
  id: string
  content: string
  prompt: string | null
  mood: string | null
  created_at?: string
}

export function JournalEntry() {
  const [currentEntry, setCurrentEntry] = useState("")
  const [selectedPrompt, setSelectedPrompt] = useState(0)
  const [entries, setEntries] = useState<JournalItem[]>([])
  const [saving, setSaving] = useState(false)

  const journalPrompts = [
    "What am I grateful for today?",
    "How am I feeling right now?",
    "What challenged me today and how did I handle it?",
    "What brought me joy today?",
    "What would I like to let go of?",
    "What intention do I want to set for tomorrow?",
  ]

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const token = (await supabase.auth.getSession()).data.session?.access_token
        const res = await fetch('/api/dashboard/journal', { cache: 'no-store', headers: token ? { Authorization: `Bearer ${token}` } : {} })
        if (res.ok) {
          const data = await res.json()
          if (mounted && Array.isArray(data.entries)) setEntries(data.entries)
        }
      } catch {}
    })()
    return () => { mounted = false }
  }, [])

  const handleSave = async () => {
    const content = currentEntry.trim()
    if (!content) return
    try {
      setSaving(true)
      const prompt = journalPrompts[selectedPrompt]
      const token = (await supabase.auth.getSession()).data.session?.access_token
      const res = await fetch('/api/dashboard/journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ content, prompt })
      })
      if (!res.ok) throw new Error('Failed to save entry')
      const created = await res.json()
      setEntries(prev => [created, ...prev])
      setCurrentEntry("")
    } catch {}
    finally { setSaving(false) }
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Daily Journal
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Journal Prompts */}
        <div className="space-y-3">
          <h3 className="font-medium text-muted-foreground">Today's Prompts</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {journalPrompts.map((prompt, index) => (
              <button
                key={index}
                onClick={() => setSelectedPrompt(index)}
                className={`p-3 text-left rounded-lg border transition-all ${
                  index === selectedPrompt ? "border-primary bg-primary/5" : "border-border/50 hover:bg-accent/20"
                }`}
              >
                <p className="text-sm">{prompt}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Current Entry */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-muted-foreground">{journalPrompts[selectedPrompt]}</h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              Today
            </div>
          </div>
          <Textarea
            placeholder="Write your thoughts here..."
            value={currentEntry}
            onChange={(e) => setCurrentEntry(e.target.value)}
            className="min-h-32 resize-none"
          />
          <div className="flex justify-end">
            <Button className="gap-2" onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4" />
              Save Entry
            </Button>
          </div>
        </div>

        {/* Recent Entries */}
        <div className="space-y-3">
          <h3 className="font-medium text-muted-foreground">Recent Entries</h3>
          {entries.length === 0 && (
            <div className="text-xs text-muted-foreground">No entries yet.</div>
          )}
          {entries.map((entry) => (
            <div key={entry.id} className="p-3 rounded-lg border border-border/50 hover:bg-accent/20 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">
                  {entry.created_at ? new Date(entry.created_at).toLocaleDateString() : ''}
                </span>
                {entry.mood && (
                  <Badge variant="outline" className="text-xs">
                    {entry.mood}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{entry.content}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
