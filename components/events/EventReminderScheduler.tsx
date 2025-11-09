"use client"

import { useEffect } from "react"
import { getBlogPosts, getEventRSVPsByEventId, updateBlogPost } from "@/lib/storage"
import { createNotification } from "@/lib/notifications"

function shouldSend(nowMs: number, startMs: number, offsetMinutes: number): boolean {
  const threshold = startMs - offsetMinutes * 60_000
  // Send if we crossed threshold in the past minute
  return nowMs >= threshold && nowMs < threshold + 60_000
}

export function EventReminderScheduler() {
  useEffect(() => {
    const tick = () => {
      const posts = getBlogPosts().filter((p) => (p as any).postType === 'event' && p.eventStartAt)
      const nowMs = Date.now()
      for (const post of posts) {
        const startMs = new Date(post.eventStartAt!).getTime()
        if (startMs <= nowMs) continue // Only future events

        // 24h reminder
        if (!post.eventReminder24SentAt && shouldSend(nowMs, startMs, 24 * 60)) {
          const rsvps = getEventRSVPsByEventId(post.id).filter((r) => r.status === 'going' || r.status === 'maybe')
          for (const r of rsvps) {
            createNotification({
              userId: r.userId,
              type: 'message',
              actorId: post.authorId,
              targetId: post.id,
              targetType: 'post',
              category: 'reminders',
              message: `Reminder: ${post.title} starts in 24 hours`,
            })
          }
          updateBlogPost({ ...post, eventReminder24SentAt: new Date().toISOString() })
        }

        // 1h reminder
        if (!post.eventReminder1hSentAt && shouldSend(nowMs, startMs, 60)) {
          const rsvps = getEventRSVPsByEventId(post.id).filter((r) => r.status === 'going' || r.status === 'maybe')
          for (const r of rsvps) {
            createNotification({
              userId: r.userId,
              type: 'message',
              actorId: post.authorId,
              targetId: post.id,
              targetType: 'post',
              category: 'reminders',
              message: `Reminder: ${post.title} starts in 1 hour`,
            })
          }
          updateBlogPost({ ...post, eventReminder1hSentAt: new Date().toISOString() })
        }
      }
    }

    // Initial run and set interval
    let timer: ReturnType<typeof setInterval> | null = null
    try {
      tick()
      timer = setInterval(tick, 60_000)
    } catch {}
    return () => { if (timer) clearInterval(timer) }
  }, [])

  return null
}

export default EventReminderScheduler

