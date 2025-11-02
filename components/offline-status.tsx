"use client"

import { useOfflineSync } from "@/lib/hooks/use-offline-sync"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Wifi, WifiOff, RefreshCw, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface OfflineStatusProps {
  className?: string
  showSyncButton?: boolean
}

export function OfflineStatus({ className, showSyncButton = true }: OfflineStatusProps) {
  const { status, sync, isOnline, canSync } = useOfflineSync()

  if (isOnline && !status.syncInProgress && !status.lastError) {
    return null
  }

  return (
    <div className={cn("flex items-center gap-2 p-2 rounded-lg bg-muted", className)}>
      {!isOnline ? (
        <>
          <WifiOff className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Offline</span>
        </>
      ) : status.syncInProgress ? (
        <>
          <RefreshCw className="h-4 w-4 animate-spin text-primary" />
          <span className="text-sm">Syncing...</span>
        </>
      ) : status.lastError ? (
        <>
          <AlertCircle className="h-4 w-4 text-destructive" />
          <span className="text-sm text-destructive">Sync failed</span>
          {showSyncButton && (
            <Button
              variant="ghost"
              size="sm"
              onClick={sync}
              className="h-6 text-xs"
            >
              Retry
            </Button>
          )}
        </>
      ) : null}
      
      {status.pendingSyncCount > 0 && (
        <Badge variant="secondary" className="ml-auto">
          {status.pendingSyncCount} pending
        </Badge>
      )}
    </div>
  )
}

