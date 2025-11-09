import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import {
  addBlogPost,
  getUserById,
  getUserByUsername,
  getPets,
  getUsers,
} from "@/lib/storage"
import type { BlogPost, BlogPostMedia, PostPoll, PrivacyLevel } from "@/lib/types"
import { linkifyEntities } from "@/lib/utils/linkify-entities"
import { createMentionNotification } from "@/lib/notifications"
import { broadcastEvent } from "@/lib/server/sse"

// Simple in-memory rate limiter (server-process scoped)
// key: userId -> timestamps (ms)
const POST_RATE: Map<string, number[]> = new Map()
const ONE_HOUR_MS = 60 * 60 * 1000

function checkRateLimit(userId: string, isPro?: boolean): { ok: boolean; remaining: number } {
  const now = Date.now()
  const windowStart = now - ONE_HOUR_MS
  const limit = isPro ? 50 : 10
  const arr = (POST_RATE.get(userId) || []).filter((t) => t > windowStart)
  if (arr.length >= limit) return { ok: false, remaining: 0 }
  arr.push(now)
  POST_RATE.set(userId, arr)
  return { ok: true, remaining: Math.max(0, limit - arr.length) }
}

// Input schema
const mediaItemSchema = z.object({
  type: z.enum(["image", "video", "link"]).optional(),
  url: z.string().url().optional(),
  title: z.string().optional(),
  // Allow data URLs for base64 inline uploads
  dataUrl: z.string().startsWith("data:").optional(),
})

const visibilitySchema = z.object({
  mode: z.enum(["public", "followers", "friends", "private", "custom"]).default("public"),
  allowedUserIds: z.array(z.string()).optional(),
})

const locationSchema = z.object({
  name: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  placeId: z.string().optional(),
})

const createPostSchema = z.object({
  text: z.string().min(1).max(5000),
  mediaIds: z.array(z.string()).max(10).optional(),
  media: z.array(mediaItemSchema).max(10).optional(),
  petTags: z.array(z.string()).max(10).optional(),
  location: locationSchema.optional(),
  visibility: visibilitySchema.optional(),
  pollOptions: z.array(z.string().min(1).max(50)).min(2).max(4).optional(),
  pollAllowMultiple: z.boolean().optional(),
  pollExpiresAt: z.string().optional(),
  scheduledPublishAt: z.string().optional(),
  // Legacy compatibility fields used elsewhere in the app
  placeId: z.string().optional(),
  poll: z
    .object({
      question: z.string().min(1).max(280),
      options: z.array(z.object({ text: z.string().min(1).max(50) })).min(2).max(4),
      allowMultiple: z.boolean().optional(),
      expiresAt: z.string().optional(),
    })
    .optional(),
  // Auth/context (until full server auth flows are wired everywhere)
  authorId: z.string().min(1),
  petId: z.string().min(1),
})

export async function POST(request: NextRequest) {
  try {
    const json = await request.json()
    const parsed = createPostSchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid data", details: parsed.error.errors },
        { status: 400 }
      )
    }

    const data = parsed.data
    const author = getUserById(data.authorId)
    if (!author) {
      return NextResponse.json({ error: "Author not found" }, { status: 404 })
    }
    const pet = getPets().find((p) => p.id === data.petId)
    if (!pet) {
      return NextResponse.json({ error: "Pet not found" }, { status: 404 })
    }

    // Rate limit
    const { ok, remaining } = checkRateLimit(author.id, author.isPro)
    if (!ok) {
      return NextResponse.json(
        { error: "Rate limit exceeded", message: `Post limit reached. Try again later.`, remaining },
        { status: 429 }
      )
    }

    // Entities extraction
    const entities = linkifyEntities(data.text)

    // Mentions: notify mentioned users (best-effort)
    // Extract @username via entity ranges
    const mentionedUsernames = new Set(
      entities.ranges.filter((r) => r.type === "mention").map((r) => r.text.replace(/^@/, ""))
    )
    const allUsers = getUsers()
    const usernameToUser = new Map<string, { id: string; fullName: string }>()
    for (const u of allUsers) {
      usernameToUser.set(u.username, { id: u.id, fullName: u.fullName })
    }

    // Hashtags extraction and counting
    const hashtagMatches = data.text.match(/#[a-zA-Z0-9_]+/g) || []
    const hashtags = [...new Set(hashtagMatches.map((t) => t.substring(1).toLowerCase()))]
    try {
      // Persist hashtag usage counts in localStorage when available
      if (typeof window !== "undefined" && window.localStorage) {
        const RAW_KEY = "pet_social_hashtag_counts"
        const raw = window.localStorage.getItem(RAW_KEY)
        const counts: Record<string, { count: number; lastUsedAt: string }> = raw ? JSON.parse(raw) : {}
        const nowIso = new Date().toISOString()
        for (const tag of hashtags) {
          const prev = counts[tag] || { count: 0, lastUsedAt: nowIso }
          counts[tag] = { count: prev.count + 1, lastUsedAt: nowIso }
        }
        window.localStorage.setItem(RAW_KEY, JSON.stringify(counts))
      }
    } catch {
      // ignore
    }

    // Media organization
    const mediaInput = data.media || []
    const organizedMedia: BlogPostMedia = {
      images: mediaInput
        .filter((m) => (m.type === "image" || m.dataUrl) && (m.url || m.dataUrl))
        .map((m) => (m.url || m.dataUrl!) as string),
      videos: mediaInput.filter((m) => m.type === "video" && m.url).map((m) => m.url!) || [],
      links: mediaInput
        .filter((m) => m.type === "link" && m.url)
        .map((m) => ({ url: m.url!, title: m.title })),
    }

    // Compose poll
    let postPoll: PostPoll | undefined
    if (data.poll) {
      postPoll = {
        question: data.poll.question,
        options: data.poll.options.map((opt, i) => ({ id: `opt-${i}`, text: opt.text, voteCount: 0 })),
        allowMultiple: data.poll.allowMultiple,
        expiresAt: data.poll.expiresAt,
        isClosed: false,
      }
    } else if (data.pollOptions) {
      postPoll = {
        question: "",
        options: data.pollOptions.map((t, i) => ({ id: `opt-${i}`, text: t, voteCount: 0 })),
        allowMultiple: data.pollAllowMultiple,
        expiresAt: data.pollExpiresAt,
        isClosed: false,
      }
    }

    // Visibility mapping
    const mode = data.visibility?.mode || "public"
    const allowedUserIds = data.visibility?.allowedUserIds || []
    const privacy: PrivacyLevel = mode === "public" ? "public" : mode === "followers" ? "followers-only" : mode === "private" ? "private" : "public"

    // Scheduling
    const nowIso = new Date().toISOString()
    const scheduledAt = data.scheduledPublishAt
    const isScheduled = scheduledAt ? new Date(scheduledAt).getTime() > Date.now() : false

    const title = data.text.substring(0, 50) + (data.text.length > 50 ? "..." : "")

    const newPost: BlogPost = {
      id: `post-${Date.now()}`,
      petId: data.petId,
      authorId: data.authorId,
      title,
      content: data.text,
      tags: [],
      categories: [],
      likes: [],
      reactions: { like: [], love: [], laugh: [], wow: [], sad: [], angry: [], paw: [] },
      createdAt: nowIso,
      updatedAt: nowIso,
      privacy,
      isDraft: mode === "private" || undefined,
      queueStatus: mode === "private" ? "draft" : isScheduled ? "scheduled" : "published",
      scheduledAt: isScheduled ? scheduledAt : undefined,
      hashtags,
      media: organizedMedia,
      poll: postPoll,
      placeId: data.location?.placeId || data.placeId,
      taggedPetIds: data.petTags || [],
      visibilityMode: mode,
      allowedUserIds: mode === "custom" ? allowedUserIds : undefined,
    }

    // Persist post (client storage; no-op on server environments)
    addBlogPost(newPost)

    // Best-effort mention notifications
    try {
      for (const uname of mentionedUsernames) {
        const u = usernameToUser.get(uname)
        if (!u || u.id === author.id) continue
        createMentionNotification({
          mentionerId: author.id,
          mentionerName: author.fullName,
          mentionedUserId: u.id,
          threadId: newPost.id,
          threadType: "comment",
          postId: newPost.id,
        })
      }
    } catch {/* ignore */}

    // Broadcast to SSE listeners (dev/demo)
    try {
      broadcastEvent({ type: "postCreated", postId: newPost.id, authorId: author.id, petId: data.petId, ts: Date.now() })
    } catch {/* ignore */}

    return NextResponse.json({ post: newPost, entities })
  } catch (error) {
    console.error("Error creating post:", error)
    return NextResponse.json(
      { error: "Internal server error", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

