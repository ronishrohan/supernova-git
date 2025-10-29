import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

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

      <div className="text-gray-500 text-center mt-20">
        <p>Dashboard content will be added here...</p>
      </div>
    </div>
  )
}
