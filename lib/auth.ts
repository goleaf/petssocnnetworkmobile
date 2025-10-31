"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { User, UserRole } from "./types"
import { getCurrentUser, setCurrentUser as setStorageUser, getUsers } from "./storage"

interface AuthState {
  user: User | null
  isAuthenticated: boolean
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
    (set) => ({
      user: null,
      isAuthenticated: false,

      initialize: () => {
        const currentUser = getCurrentUser()
        // Only set authenticated if there's a valid user in storage
        if (currentUser) {
          set({ user: currentUser, isAuthenticated: true })
        } else {
          // Clear any stale auth state
          set({ user: null, isAuthenticated: false })
          if (typeof window !== "undefined") {
            localStorage.removeItem("pet_social_current_user")
          }
        }
      },

      login: async (username: string, password: string) => {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 500))

        const users = getUsers()
        const user = users.find((u) => u.username === username)

        if (!user) {
          return { success: false, error: "Invalid username or password" }
        }

        // Check password - in a real app, you'd verify the password hash
        // If user has a password set, require it to match
        if (user.password) {
          if (user.password !== password) {
            return { success: false, error: "Invalid username or password" }
          }
        } else {
          // If user doesn't have password set (legacy user), require password and set it
          if (!password || password.trim() === "") {
            return { success: false, error: "Password is required" }
          }
          // For existing users without password, update password
          user.password = password
          if (typeof window !== "undefined") {
            const allUsers = getUsers()
            const index = allUsers.findIndex((u) => u.id === user.id)
            if (index !== -1) {
              allUsers[index] = user
              localStorage.setItem("pet_social_users", JSON.stringify(allUsers))
            }
          }
        }

        setStorageUser(user.id)
        set({ user, isAuthenticated: true })
        return { success: true }
      },

      logout: () => {
        if (typeof window !== "undefined") {
          localStorage.removeItem("pet_social_current_user")
        }
        // Clear persisted auth state
        set({ user: null, isAuthenticated: false })
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
        set({ user: newUser, isAuthenticated: true })
        return { success: true }
      },

      switchUser: (userId: string) => {
        const users = getUsers()
        const user = users.find((u) => u.id === userId)
        if (user) {
          setStorageUser(userId)
          set({ user, isAuthenticated: true })
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
    },
  ),
)
