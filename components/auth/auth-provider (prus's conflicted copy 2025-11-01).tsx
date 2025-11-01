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
    // Initialize auth state - this will check storage and set auth accordingly
    initialize()
  }, [initialize])

  return <>{children}</>
}
