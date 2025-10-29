import React, { useState } from 'react'
import { Sparkles, Send } from 'lucide-react'

export default function Agent() {
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([
    { role: 'assistant', content: 'Hello! I\'m your AI security assistant. How can I help you today?' },
  ])

  const handleSend = () => {
    if (!message.trim()) return

    setMessages([...messages, { role: 'user', content: message }])
    setMessage('')

    // Simulate AI response
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'I understand your query. This is a placeholder response.' },
      ])
    }, 1000)
  }

  return (
    <div className="size-full p-6 flex flex-col">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-logo font-light tracking-tighter">AI Agent</h1>
          <p className="text-gray-600">Intelligent assistant and automation</p>
        </div>
      </div>

      <div className="flex-1 max-w-4xl mx-auto w-full flex flex-col gap-4">
        <div className="flex-1 bg-card border border-border p-6 overflow-auto">
          <div className="flex flex-col gap-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="p-2 bg-primary/10 shrink-0">
                    <Sparkles className="text-primary" size={20} strokeWidth={1} />
                  </div>
                )}
                <div
                  className={`px-4 py-2 max-w-[70%] ${
                    msg.role === 'user'
                      ? 'bg-primary text-white'
                      : 'bg-accent/20 border border-border'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Ask me anything about security..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            className="flex-1 border outline-none focus:border-primary border-border px-4 py-2"
          />
          <button
            onClick={handleSend}
            className="bg-gradient-to-b transition-all duration-200 hover:brightness-90 cursor-pointer from-primary to-primary/60 shadow-[inset_0_1px_2px_rgba(255,255,255,0.5)] px-6 py-2"
          >
            <Send size={20} strokeWidth={1} />
          </button>
        </div>
      </div>
    </div>
  )
}
