import { create } from 'zustand'

interface AuthState {
  isAuthenticated: boolean
  user: {
    email: string
    name: string
  } | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  user: null,
  login: async (email: string, password: string) => {
    // For now, just simulate a successful login
    // In the future, this will make an actual API call
    set({
      isAuthenticated: true,
      user: {
        email: email,
        name: email.split('@')[0] // Simple name extraction from email
      }
    })
  },
  logout: () => {
    set({
      isAuthenticated: false,
      user: null
    })
  }
}))
