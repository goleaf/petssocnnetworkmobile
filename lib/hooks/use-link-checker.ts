"use client"

import { useEffect, useCallback, useState } from "react"
import { checkAllSources, getBrokenLinksCount, getSourcesNeedingCheck } from "@/lib/utils/link-checker"
import type { Source } from "@/lib/types"

interface LinkCheckerStatus {
  isChecking: boolean
  lastChecked: string | null
  brokenCount: number
  checkedCount: number
  fixedCount: number
  error: string | null
}

/**
 * Hook for managing periodic link checking
 */
export function useLinkChecker(options?: {
  interval?: number // Interval in milliseconds (default: 1 hour)
  autoStart?: boolean // Auto-start checking on mount (default: true)
  onStatusChange?: (status: LinkCheckerStatus) => void
}) {
  const {
    interval = 60 * 60 * 1000, // 1 hour default
    autoStart = true,
    onStatusChange,
  } = options || {}

  const [status, setStatus] = useState<LinkCheckerStatus>({
    isChecking: false,
    lastChecked: null,
    brokenCount: 0,
    checkedCount: 0,
    fixedCount: 0,
    error: null,
  })

  const updateBrokenCount = useCallback(() => {
    const count = getBrokenLinksCount()
    setStatus((prev) => ({ ...prev, brokenCount: count }))
  }, [])

  const runCheck = useCallback(async () => {
    if (status.isChecking) return

    setStatus((prev) => ({ ...prev, isChecking: true, error: null }))

    try {
      const result = await checkAllSources()
      const newStatus: LinkCheckerStatus = {
        isChecking: false,
        lastChecked: new Date().toISOString(),
        brokenCount: getBrokenLinksCount(),
        checkedCount: result.checked,
        fixedCount: result.fixed,
        error: null,
      }

      setStatus(newStatus)
      onStatusChange?.(newStatus)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      const newStatus: LinkCheckerStatus = {
        ...status,
        isChecking: false,
        error: errorMessage,
      }
      setStatus(newStatus)
      onStatusChange?.(newStatus)
    }
  }, [status.isChecking, onStatusChange])

  useEffect(() => {
    updateBrokenCount()

    if (autoStart) {
      // Initial check after a short delay
      const timeoutId = setTimeout(() => {
        runCheck()
      }, 5000) // Wait 5 seconds before first check

      return () => clearTimeout(timeoutId)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!autoStart) return

    const intervalId = setInterval(() => {
      runCheck()
    }, interval)

    return () => clearInterval(intervalId)
  }, [interval, autoStart, runCheck])

  return {
    ...status,
    runCheck,
    updateBrokenCount,
    needsChecking: getSourcesNeedingCheck().length > 0,
  }
}

