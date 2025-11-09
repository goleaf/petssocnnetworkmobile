"use client"

import { useEffect, useMemo, useState } from "react"
import { useAuth } from "@/lib/auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { getBlogPosts, getUserById, getUserViewEventsSince, getUsers } from "@/lib/storage"
import type { BlogPost } from "@/lib/types"

function extractHashtags(text: string): string[] {
  const matches = text.match(/#(\w+)/g) || []
  return Array.from(new Set(matches.map((h) => h.replace(/^#/, '').toLowerCase())))
}

export default function ActivityPage() {
  const { user } = useAuth()
  const [now] = useState(() => Date.now())

  const sinceIso = useMemo(() => new Date(now - 7*24*60*60*1000).toISOString(), [now])
  const posts = useMemo(() => getBlogPosts(), [])
  const users = useMemo(() => getUsers(), [])

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <p className="text-center text-muted-foreground">Sign in to view your activity.</p>
      </div>
    )
  }

  // Views
  const views = getUserViewEventsSince(user.id, sinceIso)
  const postsViewedUnique = new Set(views.map((v) => v.postId)).size
  const timeSpentMs = views.reduce((sum, v) => sum + Math.min(v.durationMs, 5*60*1000), 0) // cap 5m per view

  // Your posts this week
  const myWeekPosts = posts.filter((p) => p.authorId === user.id && new Date(p.createdAt).getTime() >= new Date(sinceIso).getTime())
  const followerCount = user.followers?.length || 0

  let engagedUsers = new Set<string>()
  let bestPost: BlogPost | null = null
  let bestScore = -1
  for (const p of myWeekPosts) {
    const reactors = new Set<string>()
    if (p.reactions) {
      for (const arr of Object.values(p.reactions)) arr?.forEach((id) => reactors.add(id))
    } else {
      (p.likes || []).forEach((id) => reactors.add(id))
    }
    const comments = getUserCommentsForPost(p.id)
    const commenters = new Set(comments.map((c) => c.userId))
    const engaged = new Set<string>([...reactors, ...commenters])
    engaged.forEach((id) => engagedUsers.add(id))
    const score = reactors.size + commenters.size
    if (score > bestScore) { bestScore = score; bestPost = p }
  }
  const engagementRate = followerCount > 0 ? Math.round((engagedUsers.size / followerCount) * 100) : 0

  // Trending topics in your feed (hashtags from posts you viewed)
  const viewedPosts = new Set(views.map((v) => v.postId))
  const tagCounts = new Map<string, number>()
  for (const p of posts) {
    if (!viewedPosts.has(p.id)) continue
    const tags = new Set<string>([...(p.hashtags || []), ...extractHashtags(p.content || '')])
    for (const t of tags) tagCounts.set(t, (tagCounts.get(t) || 0) + 1)
  }
  const trending = Array.from(tagCounts.entries()).sort((a,b) => b[1]-a[1]).slice(0,5)
  const topTopic = trending[0]?.[0]
  const suggestion = topTopic ? `Try posting more about #${topTopic} based on your engagement patterns` : 'Try posting more about topics your followers engage with'

  // Peak activity times for followers (based on comment times)
  const followerIds = new Set(user.followers || [])
  const followerComments = getAllComments().filter((c) => followerIds.has(c.userId) && new Date(c.createdAt).getTime() >= new Date(sinceIso).getTime())
  const byHour = new Array(24).fill(0)
  const byDow = new Array(7).fill(0)
  for (const c of followerComments) {
    const d = new Date(c.createdAt)
    byHour[d.getHours()] += 1
    byDow[d.getDay()] += 1
  }
  const peakHour = byHour.indexOf(Math.max(...byHour))
  const weekdaySum = byDow[1]+byDow[2]+byDow[3]+byDow[4]+byDow[5]
  const weekendSum = byDow[0]+byDow[6]
  const activeLabel = peakHour >= 0 ? `${((peakHour+11)%12)+1} ${peakHour<12?'AM':'PM'} ${weekdaySum>=weekendSum?'weekdays':'weekends'}` : 'evenings'

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl space-y-6">
      <h1 className="text-3xl font-bold">Your Activity</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader><CardTitle>Posts viewed this week</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{postsViewedUnique}</div>
            <div className="text-sm text-muted-foreground">Time spent ~ {Math.round(timeSpentMs/60000)} min</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Your engagement rate</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{engagementRate}%</div>
            <div className="text-sm text-muted-foreground">{engagedUsers.size} engaged of {followerCount} followers</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Peak follower activity</CardTitle></CardHeader>
          <CardContent>
            <div className="text-base">Your followers are most active at <span className="font-semibold">{activeLabel}</span>.</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Best performing post (this week)</CardTitle></CardHeader>
          <CardContent>
            {bestPost ? (
              <div>
                <Link href={`/blog/${bestPost.id}`} className="font-semibold hover:underline">{bestPost.title || 'Untitled'}</Link>
                <div className="text-sm text-muted-foreground">Engagement score: {bestScore}</div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">No recent posts yet</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Trending topics in your feed</CardTitle></CardHeader>
          <CardContent>
            {trending.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {trending.map(([tag, count]) => (
                  <Badge key={tag} variant="secondary">#{tag} · {count}</Badge>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">Not enough data yet</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Suggestions</CardTitle></CardHeader>
        <CardContent>
          <div className="text-sm">{suggestion}</div>
        </CardContent>
      </Card>
    </div>
  )
}

// Helper: get all comments without importing internal arrays directly
function getAllComments() {
  const mod = require('@/lib/storage')
  return mod.getComments ? mod.getComments() : []
}

function getUserCommentsForPost(postId: string) {
  const mod = require('@/lib/storage')
  return mod.getCommentsByPostId ? mod.getCommentsByPostId(postId) : []
}

