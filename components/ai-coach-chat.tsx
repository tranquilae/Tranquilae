"use client"

import React, { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MessageCircle, Send, Sparkles } from "lucide-react"

export function AICoachChat() {
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState<Array<{ role:'user'|'assistant'; content:string }>>([])
  const [loading, setLoading] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [notice, setNotice] = useState<string|null>(null)

  // Load recent AI messages (if any)
  // NOTE: We only render existing messages; no canned content/suggestions.
  // Sending messages can be wired to a POST /api/dashboard/ai later.
  React.useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setLoading(true)
        const { fetchWithAuth } = await import('@/lib/api')
        const res = await fetchWithAuth('/api/dashboard/ai')
        if (res.ok) {
          const data = await res.json()
          if (mounted && Array.isArray(data.messages)) {
            setMessages(data.messages)
          }
          const ps = data?.provider_status
          if (ps && !ps.grokConfigured && !ps.openaiConfigured) {
            setNotice('AI provider not configured. Add GROK_API_KEY or XAI_API_KEY (or OPENAI_API_KEY) in your environment to enable replies.')
          } else {
            setNotice(null)
          }
        }
      } catch {}
      finally { setLoading(false) }
    })()
    return () => { mounted = false }
  }, [])

  return (
    <Card className="glass-card">
      <CardHeader className="flex flex-row items-center space-y-0 pb-4">
        <div className="flex items-center space-x-2">
          <div className="p-2 rounded-lg bg-primary/20">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <CardTitle className="text-lg font-semibold">AI Health Coach</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {notice && (
          <div className="text-xs text-amber-600 bg-amber-100/50 border border-amber-200 p-2 rounded">
            {notice}
          </div>
        )}
        {/* Chat messages */}
        <div className="space-y-3 max-h-48 overflow-y-auto">
          {messages.length === 0 && !loading && !isTyping ? (
            <div className="text-xs text-muted-foreground">No messages yet.</div>
          ) : (
            <>
              {messages.map((m, i) => (
                <div key={i} className="flex items-start space-x-2">
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <MessageCircle className="h-3 w-3 text-primary-foreground" />
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3 text-sm">
                    {m.content}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex items-start space-x-2 opacity-80">
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <MessageCircle className="h-3 w-3 text-primary-foreground" />
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3 text-sm">
                    <span className="animate-pulse">Assistant is typing…</span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Input */}
        <div className="flex space-x-2">
          <Input
            placeholder="Ask your AI coach..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="text-sm"
          />
          <Button size="sm" className="px-3" onClick={async () => {
            const content = message.trim()
            if (!content) return
            try {
              setLoading(true)
              setIsTyping(true)
              const { fetchWithAuth } = await import('@/lib/api')
              const res = await fetchWithAuth('/api/dashboard/ai', {
                method: 'POST',
                body: JSON.stringify({ content })
              })
              if (!res.ok) {
                const err = await res.json().catch(() => ({}))
                throw new Error(err?.error || 'Failed to send message')
              }
              setMessages(prev => [...prev, { role: 'user', content }])
              setMessage('')
              // Refresh to capture assistant reply if any
              try {
                const mres = await (await import('@/lib/api')).fetchWithAuth('/api/dashboard/ai')
                if (mres.ok) {
                  const data = await mres.json()
                  if (Array.isArray(data.messages)) setMessages(data.messages)
                }
              } catch {}
              finally { setIsTyping(false) }
              
            } catch (e) {
              // Optionally show a toast
            } finally {
              setLoading(false)
            }
          }}>
            <Send className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
