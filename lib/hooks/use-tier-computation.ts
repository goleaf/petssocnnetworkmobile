"use client"

import { useEffect } from "react"
import { computeTiersForAllUsers } from "../tiers"
import { getUsers, updateUser } from "../storage"
import { getTodayDateString } from "../tiers"

const LAST_TIER_COMPUTATION_KEY = "pet_social_last_tier_computation"

// Hook to run daily tier computation
export function useTierComputation() {
  useEffect(() => {
    const runDailyComputation = () => {
      const today = getTodayDateString()
      const lastComputed = localStorage.getItem(LAST_TIER_COMPUTATION_KEY)

      // Only run once per day
      if (lastComputed === today) {
        return
      }

      try {
        const users = getUsers()
        const updatedUsers = computeTiersForAllUsers(users)

        // Update all users with new tier data
        updatedUsers.forEach((user) => {
          if (user.tierLastComputed === today) {
            updateUser(user.id, {
              tier: user.tier,
              tierLastComputed: user.tierLastComputed,
            })
          }
        })

        // Mark as computed for today
        localStorage.setItem(LAST_TIER_COMPUTATION_KEY, today)
      } catch (error) {
        console.error("Error computing tiers:", error)
      }
    }

    // Run immediately
    runDailyComputation()

    // Set up interval to check daily (check every hour)
    const interval = setInterval(runDailyComputation, 1000 * 60 * 60)

    return () => clearInterval(interval)
  }, [])
}

