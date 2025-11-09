"use client"

import { useEffect } from "react"
import { getBlogPosts, updateBlogPost } from "@/lib/storage"

// Periodically scans scheduled posts and publishes those whose time has arrived.
export function ContentPublishScheduler() {
  useEffect(() => {
    let cancelled = false
    const tick = () => {
      try {
        const posts = getBlogPosts()
        const now = Date.now()
        posts.forEach((p) => {
          const status = p.queueStatus || (p.isDraft ? "draft" : "published")
          if (status === "scheduled" && p.scheduledAt) {
            const when = new Date(p.scheduledAt).getTime()
            if (Number.isFinite(when) && when <= now) {
              // Promote to published
              updateBlogPost({ ...p, queueStatus: "published", updatedAt: new Date().toISOString() })
            }
          }
        })
      } catch {}
    }

    // Initial run shortly after mount
    const t0 = setTimeout(() => { if (!cancelled) tick() }, 5000)
    // Then every minute
    const iv = setInterval(() => { if (!cancelled) tick() }, 60 * 1000)
    return () => { cancelled = true; clearTimeout(t0); clearInterval(iv) }
  }, [])

  return null
}

export default ContentPublishScheduler

