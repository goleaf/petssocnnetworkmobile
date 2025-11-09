"use client"

import { useRef, useState } from "react"
import { cn } from "@/lib/utils"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

interface PullToRefreshProps {
  onRefresh: () => Promise<void> | void
  threshold?: number
  className?: string
}

export function PullToRefresh({ onRefresh, threshold = 60, className }: PullToRefreshProps) {
  const [pull, setPull] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const startYRef = useRef<number | null>(null)
  const pullingRef = useRef(false)

  const onTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (typeof window !== 'undefined' && window.scrollY > 0) return
    const t = e.touches[0]
    startYRef.current = t.clientY
    pullingRef.current = true
  }
  const onTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!pullingRef.current || refreshing) return
    const y = e.touches[0].clientY
    const start = startYRef.current ?? y
    const delta = Math.max(0, y - start)
    // Apply a gentle resistance after threshold
    const resisted = delta > threshold ? threshold + (delta - threshold) * 0.3 : delta
    setPull(resisted)
  }
  const endPull = async () => {
    if (!pullingRef.current) return
    pullingRef.current = false
    if (pull >= threshold) {
      try {
        setRefreshing(true)
        await Promise.resolve(onRefresh())
      } finally {
        setRefreshing(false)
        setPull(0)
      }
    } else {
      setPull(0)
    }
  }

  return (
    <div
      className={cn("block md:hidden", className)}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={endPull}
      onTouchCancel={endPull}
    >
      <div style={{ height: Math.min(120, pull) }} className="flex items-end justify-center overflow-hidden transition-[height] duration-75">
        <div className="h-10 flex items-center gap-2 text-xs text-muted-foreground">
          {refreshing ? (
            <>
              <LoadingSpinner size="sm" /> <span>Refreshing…</span>
            </>
          ) : pull >= threshold ? (
            <>
              <LoadingSpinner size="sm" /> <span>Release to refresh</span>
            </>
          ) : (
            <span>Pull to refresh</span>
          )}
        </div>
      </div>
    </div>
  )
}

export default PullToRefresh

