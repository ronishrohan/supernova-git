import { create } from 'zustand'
import { supabase } from '../../lib/backend/supabase/supabase'

interface AuthState {
  isAuthenticated: boolean
  user: {
    id: string
    email: string
    name: string
  } | null
  login: (email: string, password: string) => Promise<{ error?: string }>
  signup: (email: string, password: string) => Promise<{ error?: string }>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  user: null,

  login: async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        return { error: error.message }
      }

      if (data.user) {
        set({
          isAuthenticated: true,
          user: {
            id: data.user.id,
            email: data.user.email || email,
            name: data.user.user_metadata?.name || email.split('@')[0]
          }
        })
        return {}
      }

      return { error: 'Login failed' }
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'An error occurred' }
    }
  },

  signup: async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password
      })

      if (error) {
        return { error: error.message }
      }

      if (data.user) {
        set({
          isAuthenticated: true,
          user: {
            id: data.user.id,
            email: data.user.email || email,
            name: data.user.user_metadata?.name || email.split('@')[0]
          }
        })
        return {}
      }

      return { error: 'Signup failed' }
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'An error occurred' }
    }
  },

  logout: async () => {
    await supabase.auth.signOut()
    set({
      isAuthenticated: false,
      user: null
    })
  },

  checkAuth: async () => {
    const { data: { session } } = await supabase.auth.getSession()

    if (session?.user) {
      set({
        isAuthenticated: true,
        user: {
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || ''
        }
      })
    }
  }
}))
