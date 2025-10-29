import React, { useState } from 'react'
import { Sparkles, Send, Loader2, Lightbulb } from 'lucide-react'
import { useConveyor } from '../../hooks/use-conveyor'

export default function Agent() {
  const conveyor = useConveyor('security')
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState<Array<{ role: string; content: string; category?: string; confidence?: number }>>([
    { role: 'assistant', content: 'Hello! I\'m your AI security assistant. Ask me about Wi-Fi security, passwords, phishing, VPNs, malware, encryption, and more!' },
  ])
  const [loading, setLoading] = useState(false)
  const [tips, setTips] = useState<string[]>([])

  React.useEffect(() => {
    loadSecurityTips()
  }, [])

  const loadSecurityTips = async () => {
    try {
      const securityTips = await conveyor.getSecurityTips()
      setTips(securityTips.slice(0, 3))
    } catch (error) {
      console.error('Error loading tips:', error)
    }
  }

  const handleSend = async () => {
    if (!message.trim() || loading) return

    const userMessage = message
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }])
    setMessage('')
    setLoading(true)

    try {
      const response = await conveyor.askAdvisor(userMessage)

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: response.answer,
          category: response.category,
          confidence: response.confidence
        }
      ])
    } catch (error) {
      console.error('Error getting response:', error)
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.'
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleQuickQuestion = (question: string) => {
    setMessage(question)
    setTimeout(() => handleSend(), 100)
  }

  return (
    <div className="size-full p-6 flex flex-col">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-logo font-light tracking-tighter">AI Security Advisor</h1>
          <p className="text-gray-600">Get expert cybersecurity guidance and tips</p>
        </div>
      </div>

      <div className="flex-1 max-w-5xl mx-auto w-full flex gap-6">
        {/* Chat Area */}
        <div className="flex-1 flex flex-col gap-4">
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
                    className={`px-4 py-3 max-w-[70%] ${
                      msg.role === 'user'
                        ? 'bg-primary text-white'
                        : 'bg-accent/20 border border-border'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                    {msg.category && (
                      <div className="mt-2 pt-2 border-t border-border/30 text-xs text-gray-500">
                        Category: {msg.category} • Confidence: {Math.round(msg.confidence || 0)}%
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex gap-3 justify-start">
                  <div className="p-2 bg-primary/10 shrink-0">
                    <Sparkles className="text-primary" size={20} strokeWidth={1} />
                  </div>
                  <div className="px-4 py-3 bg-accent/20 border border-border">
                    <Loader2 className="animate-spin text-primary" size={20} />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Ask me anything about security..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              className="flex-1 border outline-none focus:border-primary border-border bg-background px-4 py-2"
              disabled={loading}
            />
            <button
              onClick={handleSend}
              disabled={loading || !message.trim()}
              className="bg-gradient-to-b transition-all duration-200 hover:brightness-90 cursor-pointer from-primary to-primary/60 shadow-[inset_0_1px_2px_rgba(255,255,255,0.5)] px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={20} strokeWidth={1} />
            </button>
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-80 space-y-4">
          {/* Quick Questions */}
          <div className="bg-card border border-border p-4">
            <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
              <Sparkles className="text-primary" size={16} />
              Quick Questions
            </h3>
            <div className="space-y-2">
              <button
                onClick={() => handleQuickQuestion('How do I secure my Wi-Fi network?')}
                className="w-full text-left text-sm p-2 border border-border hover:border-primary transition-all"
                disabled={loading}
              >
                How do I secure my Wi-Fi?
              </button>
              <button
                onClick={() => handleQuickQuestion('What is a strong password?')}
                className="w-full text-left text-sm p-2 border border-border hover:border-primary transition-all"
                disabled={loading}
              >
                What is a strong password?
              </button>
              <button
                onClick={() => handleQuickQuestion('How can I detect phishing emails?')}
                className="w-full text-left text-sm p-2 border border-border hover:border-primary transition-all"
                disabled={loading}
              >
                How can I detect phishing?
              </button>
              <button
                onClick={() => handleQuickQuestion('Should I use a VPN?')}
                className="w-full text-left text-sm p-2 border border-border hover:border-primary transition-all"
                disabled={loading}
              >
                Should I use a VPN?
              </button>
              <button
                onClick={() => handleQuickQuestion('What is two-factor authentication?')}
                className="w-full text-left text-sm p-2 border border-border hover:border-primary transition-all"
                disabled={loading}
              >
                What is 2FA/MFA?
              </button>
            </div>
          </div>

          {/* Security Tips */}
          <div className="bg-card border border-border p-4">
            <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
              <Lightbulb className="text-yellow-500" size={16} />
              Security Tips
            </h3>
            <div className="space-y-2">
              {tips.map((tip, idx) => (
                <div key={idx} className="text-xs p-2 bg-background border border-border">
                  {tip}
                </div>
              ))}
            </div>
          </div>

          {/* Topics */}
          <div className="bg-card border border-border p-4">
            <h3 className="text-sm font-medium mb-3">Available Topics</h3>
            <div className="flex flex-wrap gap-2">
              {['Wi-Fi Security', 'Passwords', 'Phishing', 'VPN', 'Malware', '2FA', 'Encryption', 'Backup', 'Firewall'].map((topic) => (
                <span key={topic} className="text-xs px-2 py-1 bg-primary/10 border border-primary/30 text-primary">
                  {topic}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
