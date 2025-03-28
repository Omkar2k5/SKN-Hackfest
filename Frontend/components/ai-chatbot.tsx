"use client"

import { useState } from "react"
import { Brain, Send } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

interface Message {
  id: string
  content: string
  role: "user" | "assistant"
}

const initialMessages: Message[] = [
  {
    id: "1",
    content: "Hi there! I'm your AI financial assistant. How can I help you today?",
    role: "assistant",
  },
]

export function AiChatbot() {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState("")

  const handleSend = () => {
    if (!input || !input.trim()) return

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      role: "user",
    }

    setMessages((prev) => [...(Array.isArray(prev) ? prev : []), userMessage])
    setInput("")

    // Simulate AI response
    setTimeout(() => {
      const responses = [
        "Based on your spending patterns, I recommend setting aside 15% of your income for savings.",
        "Looking at your transaction history, you might want to consider reducing your dining expenses by 20%.",
        "Your emergency fund should ideally cover 3-6 months of expenses. Based on your current savings, you're at about 2 months.",
        "I notice you have some high-interest debt. Prioritizing paying that off could save you significantly in the long run.",
        "Your investment portfolio could benefit from more diversification. Consider adding some index funds.",
      ]

      const aiMessage: Message = {
        id: Date.now().toString(),
        content: responses[Math.floor(Math.random() * responses.length)],
        role: "assistant",
      }

      setMessages((prev) => [...(Array.isArray(prev) ? prev : []), aiMessage])
    }, 1000)
  }

  // Ensure messages is always an array
  const safeMessages = Array.isArray(messages) ? messages : initialMessages

  return (
    <div className="flex h-[500px] flex-col">
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {safeMessages.map((message) => (
          <Card
            key={message.id}
            className={`flex items-start gap-3 p-4 ${message.role === "assistant" ? "bg-primary/5" : "bg-background"}`}
          >
            {message.role === "assistant" && <Brain className="mt-1 h-5 w-5 text-primary" />}
            <div className="flex-1">
              <p className="text-sm">{message.content}</p>
            </div>
          </Card>
        ))}
      </div>
      <div className="border-t p-4">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Ask a question about your finances..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSend()
              }
            }}
          />
          <Button size="icon" onClick={handleSend}>
            <Send className="h-4 w-4" />
            <span className="sr-only">Send</span>
          </Button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Ask about budgeting, savings strategies, investment advice, or any other financial questions.
        </p>
      </div>
    </div>
  )
}

