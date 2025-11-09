"use client"

import { useEffect } from "react"
import { getBlogPosts, updateBlogPost } from "@/lib/storage"

const DAYS_90_MS = 90 * 24 * 60 * 60 * 1000

export function ListingExpiryScheduler() {
  useEffect(() => {
    const tick = () => {
      const posts = getBlogPosts().filter((p) => (p as any).postType === 'listing')
      const now = Date.now()
      for (const post of posts) {
        if (post.listingArchivedAt) continue
        const createdMs = new Date(post.createdAt).getTime()
        if (now - createdMs >= DAYS_90_MS) {
          updateBlogPost({ ...post, listingArchivedAt: new Date().toISOString() })
        }
      }
    }
    let timer: ReturnType<typeof setInterval> | null = null
    try {
      tick()
      timer = setInterval(tick, 60_000)
    } catch {}
    return () => { if (timer) clearInterval(timer) }
  }, [])
  return null
}

export default ListingExpiryScheduler

