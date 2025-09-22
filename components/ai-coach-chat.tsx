"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MessageCircle, Send, Sparkles } from "lucide-react"
import { useState } from "react"

export function AICoachChat() {
  const [message, setMessage] = useState("")

  const suggestions = ["What should I eat for dinner?", "Plan my workout for tomorrow", "How can I improve my sleep?"]

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
        {/* Chat messages */}
        <div className="space-y-3 max-h-48 overflow-y-auto">
          <div className="flex items-start space-x-2">
            <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
              <MessageCircle className="h-3 w-3 text-primary-foreground" />
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-sm">
              Great job staying on track with your calories today! You're 75% towards your goal. Consider adding some
              protein-rich snacks to reach your macro targets.
            </div>
          </div>
        </div>

        {/* Quick suggestions */}
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Quick questions:</p>
          <div className="space-y-1">
            {suggestions.map((suggestion, index) => (
              <Button
                key={index}
                variant="ghost"
                size="sm"
                className="w-full justify-start text-xs h-8 text-muted-foreground hover:text-foreground"
                onClick={() => setMessage(suggestion)}
              >
                {suggestion}
              </Button>
            ))}
          </div>
        </div>

        {/* Input */}
        <div className="flex space-x-2">
          <Input
            placeholder="Ask your AI coach..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="text-sm"
          />
          <Button size="sm" className="px-3">
            <Send className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
