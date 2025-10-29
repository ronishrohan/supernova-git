import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { Radar } from 'lucide-react'

export default function Dashboard() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div className="size-full p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-logo font-light tracking-tighter">Dashboard</h1>
          <p className="text-gray-600">Welcome back, {user?.name}</p>
        </div>
        <button
          onClick={handleLogout}
          className="bg-gradient-to-b transition-all duration-200 hover:brightness-90 cursor-pointer from-accent/60 to-accent/30 shadow-[inset_0_1px_2px_rgba(255,255,255,0.5)] px-4 py-2"
        >
          Logout
        </button>
      </div>

      <div className="max-w-4xl mx-auto mt-12">
        <div className="grid grid-cols-1 gap-4">
          <button
            onClick={() => navigate('/scan')}
            className="bg-card border border-border hover:border-primary transition-all p-8 text-left group"
          >
            <div className="flex items-center gap-4">
              <div className="p-4 bg-primary/10 group-hover:bg-primary/20 transition-all">
                <Radar className="text-primary" size={48} strokeWidth={1} />
              </div>
              <div>
                <h2 className="text-2xl font-light mb-1">Quick Scan</h2>
                <p className="text-gray-600">Perform a rapid security scan on your target</p>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}
