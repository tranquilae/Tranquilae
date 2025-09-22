"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Save, Calendar } from "lucide-react"
import { useState } from "react"

export function JournalEntry() {
  const [currentEntry, setCurrentEntry] = useState("")
  const [selectedPrompt, setSelectedPrompt] = useState(0)

  const journalPrompts = [
    "What am I grateful for today?",
    "How am I feeling right now?",
    "What challenged me today and how did I handle it?",
    "What brought me joy today?",
    "What would I like to let go of?",
    "What intention do I want to set for tomorrow?",
  ]

  const recentEntries = [
    {
      date: "Dec 22",
      preview: "Today I felt grateful for the small moments of peace...",
      mood: "Peaceful",
    },
    {
      date: "Dec 21",
      preview: "The morning meditation helped me start the day with clarity...",
      mood: "Focused",
    },
    {
      date: "Dec 20",
      preview: "I noticed my stress levels were high, but breathing exercises...",
      mood: "Reflective",
    },
  ]

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
            <Button className="gap-2">
              <Save className="h-4 w-4" />
              Save Entry
            </Button>
          </div>
        </div>

        {/* Recent Entries */}
        <div className="space-y-3">
          <h3 className="font-medium text-muted-foreground">Recent Entries</h3>
          {recentEntries.map((entry, index) => (
            <div key={index} className="p-3 rounded-lg border border-border/50 hover:bg-accent/20 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">{entry.date}</span>
                <Badge variant="outline" className="text-xs">
                  {entry.mood}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{entry.preview}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
