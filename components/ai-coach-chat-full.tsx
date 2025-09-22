"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Send, Bot, User, Sparkles } from "lucide-react"
import { useState } from "react"

export function AICoachChat() {
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: "ai",
      content:
        "Hello! I'm your AI Health Coach. I'm here to help you with nutrition advice, workout plans, and wellness guidance. How can I assist you today?",
      timestamp: "9:00 AM",
    },
    {
      id: 2,
      type: "user",
      content: "I want to lose weight but I'm not sure where to start. Can you help me create a plan?",
      timestamp: "9:02 AM",
    },
    {
      id: 3,
      type: "ai",
      content:
        "Based on your profile, I recommend starting with a moderate calorie deficit of 300-500 calories per day. Here's what I suggest:\n\n• Focus on whole foods: lean proteins, vegetables, and complex carbs\n• Aim for 3-4 strength training sessions per week\n• Include 2-3 cardio sessions (walking, cycling, or swimming)\n• Stay hydrated with 8-10 glasses of water daily\n\nWould you like me to create a specific meal plan for this week?",
      timestamp: "9:03 AM",
    },
    {
      id: 4,
      type: "user",
      content: "Yes, that would be great! I'm vegetarian, so please keep that in mind.",
      timestamp: "9:05 AM",
    },
    {
      id: 5,
      type: "ai",
      content:
        "Perfect! I'll create a vegetarian meal plan that's high in protein and nutrients. I'll focus on legumes, quinoa, tofu, eggs, and dairy for your protein sources. Give me a moment to generate your personalized plan...",
      timestamp: "9:06 AM",
    },
  ])

  const quickPrompts = ["Create a workout plan", "Suggest healthy meals", "Help with motivation", "Track my progress"]

  const handleSendMessage = () => {
    if (message.trim()) {
      const newMessage = {
        id: messages.length + 1,
        type: "user" as const,
        content: message,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      }
      setMessages([...messages, newMessage])
      setMessage("")

      // Simulate AI response
      setTimeout(() => {
        const aiResponse = {
          id: messages.length + 2,
          type: "ai" as const,
          content:
            "I understand your question. Let me provide you with personalized advice based on your goals and current progress...",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        }
        setMessages((prev) => [...prev, aiResponse])
      }, 1000)
    }
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          AI Health Coach
          <Badge variant="outline" className="ml-auto">
            <Sparkles className="h-3 w-3 mr-1" />
            Online
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Chat Messages */}
        <div className="h-96 overflow-y-auto space-y-4 p-4 rounded-lg bg-accent/5">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-3 ${msg.type === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`flex gap-3 max-w-[80%] ${msg.type === "user" ? "flex-row-reverse" : "flex-row"}`}>
                <Avatar className="w-8 h-8">
                  <AvatarFallback>
                    {msg.type === "ai" ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                  </AvatarFallback>
                </Avatar>
                <div
                  className={`rounded-lg p-3 ${
                    msg.type === "user" ? "bg-primary text-primary-foreground" : "bg-background border border-border"
                  }`}
                >
                  <p className="text-sm whitespace-pre-line">{msg.content}</p>
                  <p
                    className={`text-xs mt-1 ${
                      msg.type === "user" ? "text-primary-foreground/70" : "text-muted-foreground"
                    }`}
                  >
                    {msg.timestamp}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Prompts */}
        <div className="flex flex-wrap gap-2">
          {quickPrompts.map((prompt, index) => (
            <Button key={index} size="sm" variant="outline" onClick={() => setMessage(prompt)} className="text-xs">
              {prompt}
            </Button>
          ))}
        </div>

        {/* Message Input */}
        <div className="flex gap-2">
          <Input
            placeholder="Ask your AI coach anything..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
            className="flex-1"
          />
          <Button onClick={handleSendMessage} className="gap-2">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
