"use client"

import { useEffect } from "react"
import { useAuth } from "@/lib/auth"
import { runPetHealthReminderSweep } from "@/lib/pet-notifications"

// Runs lightweight reminder checks for pets once per day on app usage
export function PetReminderScheduler() {
  const { user } = useAuth()

  useEffect(() => {
    if (!user) return
    const key = `pet_social_last_reminder_sweep_${user.id}`
    const now = new Date()
    const todayKey = now.toDateString()
    try {
      const last = localStorage.getItem(key)
      if (last !== todayKey) {
        // Defer slightly so we don't block navigation
        const t = setTimeout(() => {
          try {
            runPetHealthReminderSweep(user.id)
            localStorage.setItem(key, todayKey)
          } catch {}
        }, 5000)
        return () => clearTimeout(t)
      }
    } catch {}
  }, [user?.id])

  return null
}

