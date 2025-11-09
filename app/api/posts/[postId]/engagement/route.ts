import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import {
  getBlogPostById,
  getCommentsByPostId,
  getUsers,
  getBlogPosts,
  getViewEvents,
  isPostSaved,
} from "@/lib/storage"
import type { BlogPost, Comment, User } from "@/lib/types"

const querySchema = z.object({
  viewerId: z.string().optional(),
})

type ReactionCounts = Record<string, number>

function getReactionCounts(post: BlogPost): ReactionCounts {
  const r = post.reactions || ({} as NonNullable<BlogPost["reactions"]>)
  const counts: ReactionCounts = {}
  for (const key of Object.keys(r)) {
    counts[key] = (r as any)[key]?.length || 0
  }
  return counts
}

export async function GET(request: NextRequest, context: { params: Promise<{ postId: string }> }) {
  try {
    const { postId } = await context.params
    const { searchParams } = new URL(request.url)
    const parsed = querySchema.safeParse({ viewerId: searchParams.get("viewerId") || undefined })
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid query" }, { status: 400 })
    }
    const viewerId = parsed.data.viewerId

    const post = getBlogPostById(postId)
    if (!post || (post as any).deletedAt) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    const allUsers = getUsers()
    const usersById = new Map<string, User>(allUsers.map((u) => [u.id, u]))

    // Totals
    const reactions = getReactionCounts(post)
    const comments = getCommentsByPostId(post.id)
    const allPosts = getBlogPosts()
    const shares = allPosts.filter((p) => (p as any).sharedFromPostId === post.id)

    // Saves
    let savesCount = 0
    for (const u of allUsers) {
      try { if (isPostSaved(u.id, post.id)) savesCount++ } catch {}
    }

    // Views
    const views = getViewEvents().filter((v) => v.postId === post.id)

    const totals = {
      reactions,
      comments: comments.length,
      shares: shares.length,
      saves: savesCount,
      views: views.length,
    }

    // Recent activity (last 20 by timestamp where available)
    type ActivityItem = {
      type: "comment" | "repost" | "view"
      timestamp: string
      user: { id: string; username: string; fullName: string; avatar?: string } | null
      preview?: string
    }
    const recent: ActivityItem[] = []
    for (const c of comments) {
      const u = usersById.get(c.userId) || null
      recent.push({
        type: "comment",
        timestamp: c.createdAt,
        user: u ? { id: u.id, username: u.username, fullName: u.fullName, avatar: u.avatar } : null,
        preview: (c.content || "").slice(0, 120),
      })
    }
    for (const s of shares) {
      const u = usersById.get(s.authorId) || null
      recent.push({
        type: "repost",
        timestamp: s.createdAt,
        user: u ? { id: u.id, username: u.username, fullName: u.fullName, avatar: u.avatar } : null,
        preview: (s.sharedComment || s.title || s.content || "").slice(0, 120),
      })
    }
    for (const v of views) {
      const u = usersById.get(v.userId) || null
      recent.push({
        type: "view",
        timestamp: v.viewedAt,
        user: u ? { id: u.id, username: u.username, fullName: u.fullName, avatar: u.avatar } : null,
      })
    }
    recent.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    const recentActivity = recent.slice(0, 20)

    // Viewer insights (only for post owner)
    let viewerInsights: any = null
    const isOwner = viewerId && viewerId === post.authorId
    if (isOwner) {
      const engagerUserIds = new Set<string>()
      comments.forEach((c) => engagerUserIds.add(c.userId))
      shares.forEach((s) => engagerUserIds.add(s.authorId))
      views.forEach((v) => engagerUserIds.add(v.userId))

      // Geography by last segment of location ("City, Region, Country" -> Country)
      const countryCounts: Record<string, number> = {}
      const hourHistogram = Array.from({ length: 24 }, () => 0)
      const sources: Record<string, number> = {}

      // Build time-of-day from events with timestamps
      const allTimestamps: string[] = []
      comments.forEach((c) => allTimestamps.push(c.createdAt))
      shares.forEach((s) => allTimestamps.push(s.createdAt))
      views.forEach((v) => allTimestamps.push(v.viewedAt))
      for (const ts of allTimestamps) {
        const d = new Date(ts)
        const h = d.getHours()
        hourHistogram[h] = (hourHistogram[h] || 0) + 1
      }

      for (const uid of engagerUserIds) {
        const u = usersById.get(uid)
        if (!u || !u.location) continue
        const parts = u.location.split(",").map((s) => s.trim()).filter(Boolean)
        const country = parts[parts.length - 1] || "Unknown"
        countryCounts[country] = (countryCounts[country] || 0) + 1
      }

      viewerInsights = {
        geography: { countryCounts },
        timeOfDay: hourHistogram,
        referralSources: sources, // Not tracked; placeholder
      }
    }

    // Engagement over time series
    const created = new Date(post.createdAt)
    const ageMs = Date.now() - created.getTime()
    const useHourly = ageMs <= 24 * 60 * 60 * 1000
    const series: Array<{ bucketStart: string; views: number; comments: number; shares: number; total: number }> = []

    function floorToHour(d: Date): Date { const x = new Date(d); x.setMinutes(0,0,0); return x }
    function floorToDay(d: Date): Date { const x = new Date(d); x.setHours(0,0,0,0); return x }
    const start = useHourly ? floorToHour(created) : floorToDay(created)
    const stepMs = useHourly ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000
    const end = new Date()
    // Build bucket map
    const buckets = new Map<number, { v: number; c: number; s: number }>()
    for (let t = start.getTime(); t <= end.getTime(); t += stepMs) {
      buckets.set(t, { v: 0, c: 0, s: 0 })
    }
    const assign = (ts: string, key: 'v'|'c'|'s') => {
      const d = new Date(ts)
      const bucket = useHourly ? floorToHour(d).getTime() : floorToDay(d).getTime()
      const cur = buckets.get(bucket)
      if (cur) cur[key] += 1
    }
    views.forEach((v) => assign(v.viewedAt, 'v'))
    comments.forEach((c) => assign(c.createdAt, 'c'))
    shares.forEach((s) => assign(s.createdAt, 's'))
    for (const [t, vals] of buckets) {
      const total = vals.v + vals.c + vals.s
      series.push({ bucketStart: new Date(t).toISOString(), views: vals.v, comments: vals.c, shares: vals.s, total })
    }
    // Keep chronologically ascending
    series.sort((a, b) => new Date(a.bucketStart).getTime() - new Date(b.bucketStart).getTime())

    return NextResponse.json({
      totals,
      recentActivity,
      viewerInsights,
      timeSeries: { granularity: useHourly ? "hourly" : "daily", series },
    })
  } catch (error) {
    console.error("Error getting engagement:", error)
    return NextResponse.json(
      { error: "Internal server error", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
