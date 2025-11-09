"use client"

import type React from "react"

import { useEffect, useRef } from "react"
import { useAuth as useAuthHook } from "@/lib/auth"
import { initializeStorage } from "@/lib/storage"
import { runDataRetentionForUser } from "@/lib/data-retention"

export { useAuth } from "@/lib/auth"

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { initialize, user } = useAuthHook()
  const ranRetentionRef = useRef<string | null>(null)

  useEffect(() => {
    initializeStorage()
    // Initialize auth state - fetch session from server
    initialize()
  }, [initialize])

  useEffect(() => {
    // Run data retention tasks once per session when user becomes available
    if (!user?.id) return
    if (ranRetentionRef.current === user.id) return
    ranRetentionRef.current = user.id
    ;(async () => {
      try {
        await runDataRetentionForUser(user.id)
      } catch {}
    })()
  }, [user])

  return <>{children}</>
}
