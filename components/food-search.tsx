"use client"

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Plus } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { fetchWithAuth } from '@/lib/api'

export function FoodSearch() {
  const [searchQuery, setSearchQuery] = useState("")
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let active = true
    const q = searchQuery.trim()
    if (!q) {
      setResults([])
      return
    }
    const timer = setTimeout(async () => {
      try {
        setLoading(true)
        const res = await fetchWithAuth(`/api/foods/search?query=${encodeURIComponent(q)}`)
        if (res.ok) {
          const data = await res.json()
          if (active) setResults(data?.results?.hints || [])
        }
      } finally {
        setLoading(false)
      }
    }, 400)
    return () => { active = false; clearTimeout(timer) }
  }, [searchQuery])

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle>Food Search</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search foods..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">Results</h4>
          {loading && <div className="text-xs text-muted-foreground">Searching...</div>}
          {!loading && results.length === 0 && (
            <div className="text-xs text-muted-foreground">{searchQuery ? 'No results' : 'Start typing to search foods'}</div>
          )}
          {results.map((hint, index) => {
            const food = hint?.food || {}
            const label = food?.label || 'Food'
            const brand = food?.brand || food?.foodContentsLabel || ''
            const calories = food?.nutrients?.ENERC_KCAL ? Math.round(food.nutrients.ENERC_KCAL) : undefined
            return (
              <div
                key={index}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-accent/20 transition-colors"
              >
                <div>
                  <p className="font-medium text-sm">{label}</p>
                  <p className="text-xs text-muted-foreground">
                    {brand || '—'}{calories ? ` • ${calories} cal (per 100g)` : ''}
                  </p>
                </div>
                <Button size="sm" variant="ghost" title="Add to meal (coming soon)">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
