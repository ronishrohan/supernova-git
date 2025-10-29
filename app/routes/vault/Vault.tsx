import React, { useState } from 'react'
import { Asterisk, Plus, Eye, EyeOff, Copy } from 'lucide-react'

interface Password {
  id: number
  name: string
  username: string
  password: string
}

export default function Vault() {
  const [passwords] = useState<Password[]>([
    { id: 1, name: 'Example Account', username: 'user@example.com', password: 'password123' },
    { id: 2, name: 'Test Service', username: 'testuser', password: 'securepass456' },
  ])
  const [visibleIds, setVisibleIds] = useState<number[]>([])

  const toggleVisibility = (id: number) => {
    setVisibleIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <div className="size-full p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-logo font-light tracking-tighter">Password Vault</h1>
          <p className="text-gray-600">Secure password management</p>
        </div>
        <button className="bg-gradient-to-b transition-all duration-200 hover:brightness-90 cursor-pointer from-primary to-primary/60 shadow-[inset_0_1px_2px_rgba(255,255,255,0.5)] px-4 py-2 flex items-center gap-2">
          <Plus size={20} strokeWidth={1} />
          Add Password
        </button>
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 gap-4">
          {passwords.map((pwd) => (
            <div key={pwd.id} className="bg-card border border-border p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10">
                    <Asterisk className="text-primary" size={24} strokeWidth={1} />
                  </div>
                  <div>
                    <h3 className="text-lg font-light">{pwd.name}</h3>
                    <p className="text-sm text-gray-600">{pwd.username}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <input
                  type={visibleIds.includes(pwd.id) ? 'text' : 'password'}
                  value={pwd.password}
                  readOnly
                  className="flex-1 border outline-none border-border px-4 py-2 bg-background"
                />
                <button
                  onClick={() => toggleVisibility(pwd.id)}
                  className="bg-gradient-to-b transition-all duration-200 hover:brightness-90 cursor-pointer from-accent/60 to-accent/30 shadow-[inset_0_1px_2px_rgba(255,255,255,0.5)] px-4 py-2"
                >
                  {visibleIds.includes(pwd.id) ? (
                    <EyeOff size={20} strokeWidth={1} />
                  ) : (
                    <Eye size={20} strokeWidth={1} />
                  )}
                </button>
                <button
                  onClick={() => copyToClipboard(pwd.password)}
                  className="bg-gradient-to-b transition-all duration-200 hover:brightness-90 cursor-pointer from-accent/60 to-accent/30 shadow-[inset_0_1px_2px_rgba(255,255,255,0.5)] px-4 py-2"
                >
                  <Copy size={20} strokeWidth={1} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
