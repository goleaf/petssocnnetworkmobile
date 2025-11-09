"use client"

import { useEffect } from "react"
import { useAuth } from "@/lib/auth"
import { getDraftsByUserId, deleteDraft } from "@/lib/drafts"
import { createNotification } from "@/lib/notifications"

function daysBetween(aIso: string, b: Date): number {
  const t = new Date(aIso).getTime()
  if (!Number.isFinite(t)) return 0
  const diff = b.getTime() - t
  return Math.floor(diff / (24 * 60 * 60 * 1000))
}

// Runs daily to warn about expiring drafts and purge drafts older than 30 days.
export function DraftRetentionScheduler() {
  const { user } = useAuth()

  useEffect(() => {
    if (!user) return
    let cancelled = false

    const run = () => {
      try {
        const drafts = getDraftsByUserId(user.id)
        const now = new Date()
        drafts.forEach((d) => {
          const ageDays = daysBetween(d.lastSaved || d.createdAt, now)
          // Warn 3 days before deletion
          if (ageDays === 27) {
            createNotification({
              userId: user.id,
              type: "message",
              category: "reminders",
              channels: ["in_app"],
              message: `Your draft "${d.title || 'Untitled Draft'}" will be deleted in 3 days if not updated.`,
              metadata: { draftId: d.id },
            })
          }
          // Delete after 30 days
          if (ageDays >= 30) {
            deleteDraft(d.id)
            createNotification({
              userId: user.id,
              type: "message",
              category: "reminders",
              channels: ["in_app"],
              message: `Draft "${d.title || 'Untitled Draft'}" was removed due to inactivity (30 days).`,
              metadata: { draftId: d.id },
            })
          }
        })
      } catch {}
    }

    // Run shortly after mount and then daily
    const t0 = setTimeout(() => { if (!cancelled) run() }, 5000)
    const iv = setInterval(() => { if (!cancelled) run() }, 24 * 60 * 60 * 1000)
    return () => { cancelled = true; clearTimeout(t0); clearInterval(iv) }
  }, [user?.id])

  return null
}

export default DraftRetentionScheduler

