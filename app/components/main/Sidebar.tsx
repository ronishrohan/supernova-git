import { LayoutDashboard, Sparkles, Asterisk, FileText, LogOut } from 'lucide-react'
import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

interface SidebarButtonProps {
  icon: React.ReactNode
  isActive?: boolean
  onClick?: () => void
  className?: string
}

function SidebarButton({ icon, isActive = false, onClick, className = '' }: SidebarButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full aspect-square shrink-0 flex items-center justify-center  ${
        isActive ? 'bg-primary text-white' : 'text-gray-400 hover:bg-foreground/5'
      } ${className}`}
    >
      {icon}
    </button>
  )
}

export default function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { logout } = useAuthStore()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div className="w-[60px] h-full flex shrink-0 flex-col bg-card border-r border-border">
      {/* Top section - main navigation */}
      <div className="flex flex-col">
        <SidebarButton
          icon={<LayoutDashboard strokeWidth={1} size={20} />}
          isActive={location.pathname === '/dashboard'}
          onClick={() => navigate('/dashboard')}
        />
        <SidebarButton
          icon={<Sparkles strokeWidth={1} size={20} />}
          isActive={location.pathname === '/agent'}
          onClick={() => navigate('/agent')}
        />
        <SidebarButton
          icon={<Asterisk strokeWidth={1} size={20} />}
          isActive={location.pathname === '/vault'}
          onClick={() => navigate('/vault')}
        />
        <SidebarButton
          icon={<FileText strokeWidth={1} size={20} />}
          isActive={location.pathname === '/reports'}
          onClick={() => navigate('/reports')}
        />
      </div>

      {/* Spacer to push logout to bottom */}
      <div className="flex-1"></div>

      {/* Bottom section - logout */}
      <div className="mt-auto">
        <SidebarButton
          icon={<LogOut strokeWidth={1} size={20} />}
          className="hover:bg-destructive hover:text-red-300"
          onClick={handleLogout}
        />
      </div>
    </div>
  )
}
