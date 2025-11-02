"use client"

import type React from "react"

import { useEffect } from "react"
import { useAuth as useAuthHook } from "@/lib/auth"
import { initializeStorage } from "@/lib/storage"

export { useAuth } from "@/lib/auth"

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { initialize } = useAuthHook()

  useEffect(() => {
    initializeStorage()
    // Initialize auth state - fetch session from server
    initialize()
  }, [initialize])

  return <>{children}</>
}
