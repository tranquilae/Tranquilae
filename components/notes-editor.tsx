"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Plus, Save, Search, FileText, Tag } from "lucide-react"
import { useState } from "react"

export function NotesEditor() {
  const [selectedNote, setSelectedNote] = useState<number | null>(null)
  const [noteTitle, setNoteTitle] = useState("")
  const [noteContent, setNoteContent] = useState("")
  const [searchQuery, setSearchQuery] = useState("")

  const notes = [
    {
      id: 1,
      title: "Workout Plan Ideas",
      content: "Need to focus more on compound movements...",
      tags: ["fitness", "planning"],
      date: "Dec 22",
      preview:
        "Need to focus more on compound movements like squats and deadlifts. Also want to add more cardio sessions...",
    },
    {
      id: 2,
      title: "Healthy Recipe Collection",
      content: "Mediterranean quinoa bowl recipe...",
      tags: ["nutrition", "recipes"],
      date: "Dec 21",
      preview:
        "Mediterranean quinoa bowl with roasted vegetables, chickpeas, and tahini dressing. High in protein and fiber...",
    },
    {
      id: 3,
      title: "Morning Routine Reflections",
      content: "The new morning routine is working well...",
      tags: ["mindfulness", "routine"],
      date: "Dec 20",
      preview:
        "The new morning routine with meditation and journaling is helping me start the day with more clarity and purpose...",
    },
    {
      id: 4,
      title: "Goal Setting for 2024",
      content: "Want to focus on sustainable habits...",
      tags: ["goals", "planning"],
      date: "Dec 19",
      preview:
        "Want to focus on sustainable habits rather than dramatic changes. Small consistent actions lead to big results...",
    },
  ]

  const filteredNotes = notes.filter(
    (note) =>
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase())),
  )

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Notes
          </div>
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            New Note
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Notes List */}
          <div className="space-y-3">
            <h3 className="font-medium text-sm text-muted-foreground">Recent Notes</h3>
            {filteredNotes.map((note) => (
              <div
                key={note.id}
                onClick={() => {
                  setSelectedNote(note.id)
                  setNoteTitle(note.title)
                  setNoteContent(note.content)
                }}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  selectedNote === note.id ? "border-primary bg-primary/5" : "border-border/50 hover:bg-accent/20"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-sm">{note.title}</h4>
                  <span className="text-xs text-muted-foreground">{note.date}</span>
                </div>
                <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{note.preview}</p>
                <div className="flex flex-wrap gap-1">
                  {note.tags.map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      <Tag className="h-2 w-2 mr-1" />
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Note Editor */}
          <div className="space-y-3">
            <h3 className="font-medium text-sm text-muted-foreground">
              {selectedNote ? "Edit Note" : "Create New Note"}
            </h3>
            <div className="space-y-3">
              <Input placeholder="Note title..." value={noteTitle} onChange={(e) => setNoteTitle(e.target.value)} />
              <Textarea
                placeholder="Start writing your note..."
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                className="min-h-48 resize-none"
              />
              <div className="flex justify-between items-center">
                <Input placeholder="Add tags (comma separated)" className="flex-1 mr-2" />
                <Button className="gap-2">
                  <Save className="h-4 w-4" />
                  Save
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
