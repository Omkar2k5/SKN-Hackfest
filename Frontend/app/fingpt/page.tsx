"use client";

import { useState } from "react";
import { Send, Bot, User, Loader2, Home } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";

export default function FinGPTPage() {
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<{ role: "user" | "assistant"; content: string }[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isLoading) return;

    const userMessage = message.trim();
    setMessage("");
    setIsLoading(true);

    // Add user message to chat history
    setChatHistory((prev) => [...prev, { role: "user", content: userMessage }]);

    try {
      // Call Ollama API
      const response = await fetch('http://localhost:11434/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'qwen2.5-coder:7b',
          messages: [
            {
              role: "system",
              content: "You are FinGPT, a helpful AI assistant focused on financial topics. Provide clear, accurate financial advice and analysis."
            },
            ...chatHistory.map(msg => ({
              role: msg.role,
              content: msg.content
            })),
            {
              role: "user",
              content: userMessage
            }
          ],
          stream: false
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response from Ollama');
      }

      const data = await response.json();
      const assistantResponse = data.message?.content || "I apologize, but I couldn't process your request.";
      setChatHistory((prev) => [...prev, { role: "assistant", content: assistantResponse }]);
    } catch (error) {
      console.error('Ollama API Error:', error);
      setChatHistory((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "I apologize, but I encountered an error. Please make sure Ollama is running locally with the qwen2.5-coder:7b model installed."
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <header className="fixed top-0 left-0 right-0 bg-white border-b z-10">
        <div className="max-w-screen-xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/">
            <Button variant="ghost" className="gap-2">
              <Home className="w-5 h-5" />
              Home
            </Button>
          </Link>
          <h1 className="text-xl font-bold">FinGPT</h1>
          <Link href="/dashboard">
            <Button variant="ghost">Dashboard</Button>
          </Link>
        </div>
      </header>

      {/* Main Chat Area */}
      <main className="pt-16 pb-32 min-h-screen">
        <div className="max-w-2xl mx-auto px-4">
          <AnimatePresence>
            {chatHistory.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center text-gray-500 mt-12 px-4"
              >
                <Bot size={48} className="mx-auto mb-4 text-gray-400" />
                <h2 className="text-2xl font-bold mb-2">Welcome to FinGPT</h2>
                <p className="mb-1">Your AI-powered financial assistant</p>
                <p className="text-sm">Ask me about financial markets, investment strategies, or economic trends!</p>
                <p className="text-xs mt-4 text-gray-400">Using Ollama with qwen2.5-coder:7b model</p>
              </motion.div>
            ) : (
              chatHistory.map((msg, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`py-6 ${msg.role === "assistant" ? "bg-white rounded-lg my-2 shadow-sm" : ""}`}
                >
                  <div className="flex items-start gap-4 px-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      msg.role === "user" ? "bg-blue-500" : "bg-teal-500"
                    }`}>
                      {msg.role === "user" ? (
                        <User className="w-5 h-5 text-white" />
                      ) : (
                        <Bot className="w-5 h-5 text-white" />
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="font-medium">
                        {msg.role === "user" ? "You" : "FinGPT"}
                      </div>
                      <div className="text-gray-700">
                        {msg.content}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Input Area */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-gray-50 to-transparent pt-10 pb-6">
        <div className="max-w-2xl mx-auto px-4">
          <form onSubmit={handleSubmit} className="relative bg-white rounded-lg shadow-lg">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Message FinGPT..."
              className="w-full pr-12 py-3 rounded-lg border-gray-200"
              disabled={isLoading}
            />
            <Button 
              type="submit" 
              disabled={isLoading}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-gray-100"
              variant="ghost"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
              ) : (
                <Send className="w-5 h-5 text-gray-400" />
              )}
            </Button>
          </form>
          <p className="text-xs text-center mt-2 text-gray-500">
            FinGPT provides general financial information and should not be considered as financial advice.
          </p>
        </div>
      </div>
    </div>
  );
}