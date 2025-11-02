"use client"

import { useEffect } from "react"
import { getQualityIssues } from "../utils/quality-analytics"

const LAST_QUALITY_COLLECTION_KEY = "pet_social_last_quality_collection"
const QUALITY_COLLECTION_INTERVAL = 1000 * 60 * 60 * 6 // 6 hours

// Hook to collect and store quality data periodically
export function useAnalyticsCollection() {
  useEffect(() => {
    const runQualityCollection = () => {
      const now = Date.now()
      const lastCollected = localStorage.getItem(LAST_QUALITY_COLLECTION_KEY)
      const lastCollectedTime = lastCollected ? parseInt(lastCollected, 10) : 0

      // Only run if enough time has passed
      if (now - lastCollectedTime < QUALITY_COLLECTION_INTERVAL) {
        return
      }

      try {
        // Collect quality issues
        const issues = getQualityIssues()

        // Store the collected data (for future use or reporting)
        const qualityData = {
          collectedAt: new Date().toISOString(),
          totalIssues: issues.length,
          stubs: issues.filter((issue) => issue.type === "stub").length,
          staleHealthPages: issues.filter((issue) => issue.type === "stale_health").length,
          orphanedPages: issues.filter((issue) => issue.type === "orphaned").length,
        }

        // Store in localStorage for analytics
        localStorage.setItem("pet_social_quality_collection", JSON.stringify(qualityData))

        // Mark as collected
        localStorage.setItem(LAST_QUALITY_COLLECTION_KEY, now.toString())
      } catch (error) {
        console.error("Error collecting quality analytics:", error)
      }
    }

    // Run immediately on mount
    runQualityCollection()

    // Set up interval to check periodically
    const interval = setInterval(runQualityCollection, QUALITY_COLLECTION_INTERVAL)

    return () => clearInterval(interval)
  }, [])
}

