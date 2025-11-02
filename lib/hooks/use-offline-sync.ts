"use client"

import { useEffect, useState, useCallback } from "react"
import { syncManager } from "@/lib/sync-manager"
import type { SyncStatus } from "@/lib/types"

export function useOfflineSync() {
  const [status, setStatus] = useState<SyncStatus>(syncManager.getStatus())

  useEffect(() => {
    const unsubscribe = syncManager.subscribe(setStatus)
    return unsubscribe
  }, [])

  const sync = useCallback(async () => {
    await syncManager.sync()
  }, [])

  const isOnline = status.isOnline
  const canSync = isOnline && !status.syncInProgress

  return {
    status,
    sync,
    isOnline,
    canSync,
  }
}

