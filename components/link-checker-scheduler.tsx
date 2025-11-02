"use client"

import { useEffect } from "react"
import { useLinkChecker } from "@/lib/hooks/use-link-checker"

/**
 * Global scheduler component for periodic link checking
 * This should be included in the root layout or app
 */
export function LinkCheckerScheduler() {
  const { runCheck, needsChecking } = useLinkChecker({
    interval: 60 * 60 * 1000, // Check every hour
    autoStart: true,
  })

  // Check on mount if needed
  useEffect(() => {
    if (needsChecking) {
      // Small delay to avoid blocking initial render
      const timeoutId = setTimeout(() => {
        runCheck()
      }, 10000) // Wait 10 seconds after mount

      return () => clearTimeout(timeoutId)
    }
  }, [needsChecking, runCheck])

  // This component doesn't render anything
  return null
}

