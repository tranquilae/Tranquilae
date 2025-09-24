"use client"

import React, { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Plus, Save, Search, FileText, Tag, Trash2 } from "lucide-react"

interface Note {
  id: string
  title: string | null
  content: string
  tags: string[]
  created_at?: string
  updated_at?: string
}

export function NotesEditor() {
  const [notes, setNotes] = useState<Note[]>([])
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null)
  const [noteTitle, setNoteTitle] = useState("")
  const [noteContent, setNoteContent] = useState("")
  const [tagsInput, setTagsInput] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const selectedNote = useMemo(() => notes.find(n => n.id === selectedNoteId) || null, [notes, selectedNoteId])

  // Load notes from API
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setLoading(true)
        const res = await fetch('/api/dashboard/notes', { cache: 'no-store' })
        if (res.ok) {
          const data = await res.json()
          if (mounted && Array.isArray(data.notes)) {
            setNotes(data.notes)
          }
        }
      } catch (e) {
        // Silent fail for now; you can add a toast if desired
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [])

  const filteredNotes = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return notes
    return notes.filter(note =>
      (note.title || '').toLowerCase().includes(q) ||
      (note.content || '').toLowerCase().includes(q) ||
      (note.tags || []).some(t => t.toLowerCase().includes(q))
    )
  }, [notes, searchQuery])

  const resetEditor = () => {
    setSelectedNoteId(null)
    setNoteTitle("")
    setNoteContent("")
    setTagsInput("")
  }

  const handleNewNote = () => {
    resetEditor()
  }

  const handleSelect = (note: Note) => {
    setSelectedNoteId(note.id)
    setNoteTitle(note.title || "")
    setNoteContent(note.content)
    setTagsInput((note.tags || []).join(", "))
  }

  const handleDelete = async (note: Note) => {
    try {
      const res = await fetch(`/api/dashboard/notes?id=${encodeURIComponent(note.id)}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete note')
      setNotes(prev => prev.filter(n => n.id !== note.id))
      if (selectedNoteId === note.id) resetEditor()
    } catch (e) {
      // Add toast if needed
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const tags = tagsInput
        .split(',')
        .map(t => t.trim())
        .filter(Boolean)

      if (!selectedNoteId) {
        // Create
        if (!noteContent.trim() && !noteTitle.trim()) return
        const res = await fetch('/api/dashboard/notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: noteTitle.trim() || null, content: noteContent, tags })
        })
        if (!res.ok) throw new Error('Failed to create note')
        const created: Note = await res.json()
        setNotes(prev => [created, ...prev])
        setSelectedNoteId(created.id)
      } else {
        // Update
        const res = await fetch('/api/dashboard/notes', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: selectedNoteId, title: noteTitle.trim() || null, content: noteContent, tags })
        })
        if (!res.ok) throw new Error('Failed to update note')
        const updated: Note = await res.json()
        setNotes(prev => prev.map(n => (n.id === updated.id ? updated : n)))
      }
    } catch (e) {
      // Add toast if needed
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Notes
          </div>
          <Button size="sm" className="gap-2" onClick={handleNewNote} disabled={saving}>
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
            {loading && <div className="text-xs text-muted-foreground">Loading notes...</div>}
            {!loading && filteredNotes.length === 0 && (
              <div className="text-xs text-muted-foreground">No notes yet.</div>
            )}
            {filteredNotes.map((note) => (
              <div
                key={note.id}
                onClick={() => handleSelect(note)}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  selectedNoteId === note.id ? "border-primary bg-primary/5" : "border-border/50 hover:bg-accent/20"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-sm">{note.title || 'Untitled'}</h4>
                  <div className="flex items-center gap-2">
                    {note.created_at && (
                      <span className="text-xs text-muted-foreground">
                        {new Date(note.created_at).toLocaleDateString()}
                      </span>
                    )}
                    <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleDelete(note) }}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{note.content}</p>
                <div className="flex flex-wrap gap-1">
                  {(note.tags || []).map((tag, index) => (
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
              <div className="flex justify-between items-center gap-2">
                <Input
                  placeholder="Add tags (comma separated)"
                  className="flex-1"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                />
                <Button className="gap-2" onClick={handleSave} disabled={saving}>
                  <Save className="h-4 w-4" />
                  {selectedNote ? 'Save' : 'Create'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
