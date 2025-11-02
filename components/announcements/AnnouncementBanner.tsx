"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth/auth-provider"
import { Button } from "@/components/ui/button"
import { X, AlertTriangle, CheckCircle, Info, XCircle, ExternalLink } from "lucide-react"
import {
  getActiveAnnouncements,
  isAnnouncementDismissed,
  dismissAnnouncement,
  clearExpiredDismissals,
} from "@/lib/storage"
import type { Announcement } from "@/lib/types"
import Link from "next/link"

interface AnnouncementBannerProps {
  className?: string
}

export function AnnouncementBanner({ className = "" }: AnnouncementBannerProps) {
  const { user } = useAuth()
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    // Clear expired dismissals on mount
    clearExpiredDismissals()
    
    // Load active announcements
    const active = getActiveAnnouncements(user?.id)
    
    // Filter out dismissed announcements
    const userId = user?.id
    const visible = active.filter((announcement) => {
      // Never dismissible announcements should always show
      if (announcement.dismissalPolicy === "never") return true
      
      // Check if dismissed
      const isDismissed = isAnnouncementDismissed(announcement.id, userId)
      return !isDismissed
    })
    
    setAnnouncements(visible)
    
    // Track dismissed IDs for session-based dismissals
    const dismissedSet = new Set<string>()
    active.forEach((announcement) => {
      if (isAnnouncementDismissed(announcement.id, userId)) {
        dismissedSet.add(announcement.id)
      }
    })
    setDismissedIds(dismissedSet)
  }, [user?.id])

  const handleDismiss = (announcement: Announcement) => {
    const userId = user?.id
    
    // For session-based dismissals, we'll track in local state
    if (announcement.dismissalPolicy === "session") {
      setDismissedIds((prev) => new Set(prev).add(announcement.id))
      // Store in sessionStorage for session persistence
      if (typeof window !== "undefined") {
        const sessionDismissals = JSON.parse(
          sessionStorage.getItem("announcement_dismissals") || "[]"
        ) as string[]
        if (!sessionDismissals.includes(announcement.id)) {
          sessionDismissals.push(announcement.id)
          sessionStorage.setItem("announcement_dismissals", JSON.stringify(sessionDismissals))
        }
      }
    } else {
      // For other policies, use the storage function
      dismissAnnouncement(announcement.id, userId, announcement.dismissalPolicy)
    }
    
    // Remove from visible announcements
    setAnnouncements((prev) => prev.filter((a) => a.id !== announcement.id))
  }

  // Check sessionStorage for session-based dismissals
  useEffect(() => {
    if (typeof window !== "undefined") {
      const sessionDismissals = JSON.parse(
        sessionStorage.getItem("announcement_dismissals") || "[]"
      ) as string[]
      const sessionSet = new Set(sessionDismissals)
      
      setAnnouncements((prev) =>
        prev.filter((announcement) => {
          if (announcement.dismissalPolicy === "session") {
            return !sessionSet.has(announcement.id)
          }
          return true
        })
      )
    }
  }, [])

  if (announcements.length === 0) return null

  // Show only the highest priority announcement
  const topAnnouncement = announcements[0]

  const getVariantStyles = (variant?: string) => {
    switch (variant) {
      case "warning":
        return "bg-yellow-50 border-yellow-200 text-yellow-900 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-200"
      case "success":
        return "bg-green-50 border-green-200 text-green-900 dark:bg-green-900/20 dark:border-green-800 dark:text-green-200"
      case "error":
        return "bg-red-50 border-red-200 text-red-900 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200"
      default:
        return "bg-blue-50 border-blue-200 text-blue-900 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-200"
    }
  }

  const getVariantIcon = (variant?: string) => {
    switch (variant) {
      case "warning":
        return <AlertTriangle className="h-5 w-5" />
      case "success":
        return <CheckCircle className="h-5 w-5" />
      case "error":
        return <XCircle className="h-5 w-5" />
      default:
        return <Info className="h-5 w-5" />
    }
  }

  const canDismiss = topAnnouncement.dismissalPolicy !== "never"

  return (
    <div className={`${className} ${getVariantStyles(topAnnouncement.variant)} border-b`}>
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">{getVariantIcon(topAnnouncement.variant)}</div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold mb-1">{topAnnouncement.title}</div>
            <div className="text-sm">{topAnnouncement.content}</div>
            {topAnnouncement.actionUrl && topAnnouncement.actionText && (
              <div className="mt-2">
                <Link
                  href={topAnnouncement.actionUrl}
                  className="inline-flex items-center gap-1 text-sm font-medium underline hover:no-underline"
                >
                  {topAnnouncement.actionText}
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            )}
          </div>
          {canDismiss && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDismiss(topAnnouncement)}
              className="flex-shrink-0 h-8 w-8 p-0 hover:bg-black/10 dark:hover:bg-white/10"
              aria-label="Dismiss announcement"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

