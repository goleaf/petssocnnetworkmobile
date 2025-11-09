"use client"

import { create } from "zustand"
import type { User, UserRole } from "./types"
import { loginAction, registerAction, logoutAction } from "./actions/auth"

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  register: (data: {
    email: string
    password: string
    username: string
    fullName: string
    dateOfBirth: string
    acceptedPolicies: boolean
    role?: UserRole
  }) => Promise<{ success: boolean; error?: string }>
  initialize: () => Promise<void>
  hasRole: (role: UserRole) => boolean
  isAdmin: () => boolean
  isModerator: () => boolean
  refresh: () => Promise<void>
}

export const useAuth = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  initialize: async () => {
    try {
      set({ isLoading: true })
      // Fetch session from server
      const response = await fetch("/api/auth/session")
      
      if (!response.ok) {
        throw new Error(`Session fetch failed: ${response.statusText}`)
      }
      
      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Invalid response format")
      }
      
      const data = await response.json()
      
      if (data.user) {
        set({ user: data.user, isAuthenticated: true, isLoading: false })
      } else {
        set({ user: null, isAuthenticated: false, isLoading: false })
      }
    } catch (error) {
      console.error("Error initializing auth:", error)
      set({ user: null, isAuthenticated: false, isLoading: false })
    }
  },

  refresh: async () => {
    await get().initialize()
  },

  login: async (username: string, password: string) => {
    const result = await loginAction({ username, password })
    
    if (result.success) {
      // Refresh session after successful login
      await get().refresh()
    }
    
    return result
  },

  logout: async () => {
    await logoutAction()
    // Clear client state
    set({ user: null, isAuthenticated: false })
  },

  register: async (data) => {
    const result = await registerAction(data)
    
    if (result.success && result.sessionCreated) {
      // Refresh session after successful registration
      await get().refresh()
    }
    
    return result
  },

  hasRole: (role: UserRole) => {
    const state = get()
    return state.user?.role === role || false
  },

  isAdmin: () => {
    const state = get()
    return state.user?.role === "admin" || false
  },

  isModerator: () => {
    const state = get()
    return state.user?.role === "moderator" || state.user?.role === "admin" || false
  },
}))
