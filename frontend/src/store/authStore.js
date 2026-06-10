import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authAPI } from '../services/api'

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      error: null,

      login: async (email, password) => {
        set({ isLoading: true, error: null })
        try {
          const { data } = await authAPI.login({ email, password })
          localStorage.setItem('sm_token', data.access_token)
          localStorage.setItem('sm_user', JSON.stringify(data.user))
          set({ user: data.user, token: data.access_token, isLoading: false })
          return { success: true }
        } catch (err) {
          let message = err.response?.data?.detail || 'Login failed'
          if (err.response?.status === 401 || message.includes('Incorrect') || message.includes('Invalid')) {
            message = 'Invalid email or password'
          }
          set({ error: message, isLoading: false })
          return { success: false, error: message }
        }
      },

      register: async (name, email, password, confirmPassword) => {
        set({ isLoading: true, error: null })
        try {
          const { data } = await authAPI.register({ name, email, password, confirm_password: confirmPassword })
          localStorage.setItem('sm_token', data.access_token)
          localStorage.setItem('sm_user', JSON.stringify(data.user))
          set({ user: data.user, token: data.access_token, isLoading: false })
          return { success: true }
        } catch (err) {
          const message = err.response?.data?.detail || 'Registration failed'
          set({ error: message, isLoading: false })
          return { success: false, error: message }
        }
      },

      logout: () => {
        localStorage.removeItem('sm_token')
        localStorage.removeItem('sm_user')
        set({ user: null, token: null })
      },

      clearError: () => set({ error: null }),

      setUser: (user) => {
        localStorage.setItem('sm_user', JSON.stringify(user))
        set({ user })
      },

      isAuthenticated: () => !!get().token,
    }),
    {
      name: 'sm-auth',
      partialize: (state) => ({ user: state.user, token: state.token }),
    }
  )
)

export default useAuthStore
