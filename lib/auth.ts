"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { User, UserRole } from "./types"
import { getCurrentUser, setCurrentUser as setStorageUser, getUsers } from "./storage"

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isInitialized: boolean
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  register: (data: {
    email: string
    password: string
    username: string
    fullName: string
    role?: UserRole
  }) => Promise<{ success: boolean; error?: string }>
  switchUser: (userId: string) => void
  initialize: () => void
  hasRole: (role: UserRole) => boolean
  isAdmin: () => boolean
  isModerator: () => boolean
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isInitialized: false, // Will be set to true after initialization or rehydration

      initialize: () => {
        const currentUser = getCurrentUser()
        // Only set authenticated if there's a valid user in storage
        if (currentUser) {
          set({ user: currentUser, isAuthenticated: true, isInitialized: true })
        } else {
          // Clear any stale auth state
          set({ user: null, isAuthenticated: false, isInitialized: true })
          if (typeof window !== "undefined") {
            localStorage.removeItem("pet_social_current_user")
          }
        }
      },

      login: async (username: string, password: string) => {
        // Validate input
        if (!username || username.trim() === "") {
          return { success: false, error: "Username is required" }
        }
        if (!password || password.trim() === "") {
          return { success: false, error: "Password is required" }
        }

        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 500))

        const users = getUsers()
        const user = users.find((u) => u.username === username.trim())

        if (!user) {
          return { success: false, error: "Invalid username or password" }
        }

        // If user doesn't have a password set, set it from the provided password
        if (!user.password) {
          if (!password || password.trim() === "") {
            return { success: false, error: "Password is required" }
          }
          // Set the password for the user
          const users = getUsers()
          const userIndex = users.findIndex((u) => u.id === user.id)
          if (userIndex !== -1) {
            users[userIndex] = { ...users[userIndex], password }
            if (typeof window !== "undefined") {
              localStorage.setItem("pet_social_users", JSON.stringify(users))
            }
            // Update the user object for login
            user.password = password
          }
        } else {
          // Verify password matches if user has a password
          if (user.password !== password) {
            return { success: false, error: "Invalid username or password" }
          }
        }

        setStorageUser(user.id)
        set({ user, isAuthenticated: true, isInitialized: true })
        return { success: true }
      },

      logout: () => {
        if (typeof window !== "undefined") {
          localStorage.removeItem("pet_social_current_user")
        }
        // Clear persisted auth state
        set({ user: null, isAuthenticated: false, isInitialized: true })
        // Clear persisted zustand state
        if (typeof window !== "undefined") {
          localStorage.removeItem("pet-social-auth")
        }
      },

      register: async (data) => {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 500))

        const users = getUsers()

        // Check if email or username already exists
        if (users.some((u) => u.email === data.email)) {
          return { success: false, error: "Email already exists" }
        }
        if (users.some((u) => u.username === data.username)) {
          return { success: false, error: "Username already taken" }
        }

        // Create new user
        const newUser: User = {
          id: String(Date.now()),
          email: data.email,
          username: data.username,
          password: data.password,
          fullName: data.fullName,
          role: data.role || "user",
          joinedAt: new Date().toISOString().split("T")[0],
          followers: [],
          following: [],
        }

        users.push(newUser)
        if (typeof window !== "undefined") {
          localStorage.setItem("pet_social_users", JSON.stringify(users))
        }

        setStorageUser(newUser.id)
        set({ user: newUser, isAuthenticated: true, isInitialized: true })
        return { success: true }
      },

      switchUser: (userId: string) => {
        const users = getUsers()
        const user = users.find((u) => u.id === userId)
        if (user) {
          setStorageUser(userId)
          set({ user, isAuthenticated: true, isInitialized: true })
        }
      },

      hasRole: (role: UserRole) => {
        const state = useAuth.getState()
        return state.user?.role === role
      },

      isAdmin: () => {
        const state = useAuth.getState()
        return state.user?.role === "admin"
      },

      isModerator: () => {
        const state = useAuth.getState()
        return state.user?.role === "moderator" || state.user?.role === "admin"
      },
    }),
    {
      name: "pet-social-auth",
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
      onRehydrateStorage: () => (state, error) => {
        if (!error && state && state.user) {
          // After rehydration, if we have a user, mark as initialized
          // The initialize() function will also be called by AuthProvider to ensure sync with storage
          useAuth.setState({ isInitialized: true })
        }
      },
    },
  ),
)
