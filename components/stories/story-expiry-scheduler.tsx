"use client"

import { useEffect } from "react"
import { deleteExpiredStories } from "@/lib/storage"

export function StoryExpiryScheduler() {
  useEffect(() => {
    const run = () => {
      try { deleteExpiredStories() } catch {}
    }
    run()
    const iv = setInterval(run, 5 * 60 * 1000) // every 5 minutes
    return () => clearInterval(iv)
  }, [])
  return null
}

export default StoryExpiryScheduler

