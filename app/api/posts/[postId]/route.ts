import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import {
  getBlogPostById,
  updateBlogPost,
  getUserById,
} from "@/lib/storage"
import type { BlogPost, BlogPostMedia, PrivacyLevel } from "@/lib/types"
import { broadcastEvent } from "@/lib/server/sse"
import { invalidateContentCache } from "@/lib/scalability/cache-layer"

const FIVE_MIN_MS = 5 * 60 * 1000

const mediaItemSchema = z.object({
  type: z.enum(["image", "video", "link"]).optional(),
  url: z.string().url().optional(),
  title: z.string().optional(),
  dataUrl: z.string().startsWith("data:").optional(),
})

const visibilitySchema = z.object({
  mode: z.enum(["public", "followers", "friends", "private", "custom"]).default("public"),
  allowedUserIds: z.array(z.string()).optional(),
})

const editSchema = z.object({
  text: z.string().min(1).max(5000).optional(),
  visibility: visibilitySchema.optional(),
  // Optional fields allowed only within 5 minutes window
  media: z.array(mediaItemSchema).max(10).optional(),
  hashtags: z.array(z.string().min(1)).max(20).optional(),
  placeId: z.string().optional(),
  taggedPetIds: z.array(z.string()).max(10).optional(),
  privacy: z.enum(["public", "followers-only", "private"]).optional(), // legacy compatibility
  editorId: z.string().optional(), // fallback when session auth not used
})

export async function PUT(request: NextRequest, context: { params: Promise<{ postId: string }> }) {
  try {
    const { postId } = await context.params
    const body = await request.json()
    const parsed = editSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid data", details: parsed.error.errors },
        { status: 400 }
      )
    }

    const input = parsed.data
    const existing = getBlogPostById(postId)
    if (!existing) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    // Determine editor
    // Prefer provided editorId; otherwise best-effort deny when unknown
    const editorId = input.editorId
    if (!editorId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }
    const editor = getUserById(editorId)
    if (!editor) {
      return NextResponse.json({ error: "Editor not found" }, { status: 404 })
    }

    const isOwner = existing.authorId === editor.id
    const isPrivileged = editor.role === "admin" || editor.role === "moderator"
    if (!isOwner && !isPrivileged) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Time window check
    const createdMs = new Date(existing.createdAt).getTime()
    const withinWindow = Date.now() - createdMs <= FIVE_MIN_MS

    // If outside window and attempts to edit restricted fields, reject
    if (!withinWindow) {
      const attemptedRestricted =
        typeof input.placeId !== "undefined" ||
        (Array.isArray(input.media) && input.media.length > 0) ||
        (Array.isArray(input.hashtags) && input.hashtags.length > 0) ||
        (Array.isArray(input.taggedPetIds) && input.taggedPetIds.length > 0)
      if (attemptedRestricted) {
        return NextResponse.json(
          { error: "Edit window expired", message: "Media, tags, and location can only be edited within 5 minutes of posting. You can still edit text and visibility." },
          { status: 400 }
        )
      }
    }

    // Build updates
    let next: BlogPost = { ...existing }

    // Text edits (unlimited). Also update derived title
    if (typeof input.text === "string") {
      next.content = input.text
      next.title = input.text.substring(0, 50) + (input.text.length > 50 ? "..." : "")
    }

    // Visibility edits (always allowed)
    if (input.visibility) {
      const mode = input.visibility.mode
      const allowedUserIds = input.visibility.allowedUserIds || []
      const privacy: PrivacyLevel = mode === "public" ? "public" : mode === "followers" ? "followers-only" : mode === "private" ? "private" : next.privacy || "public"
      next.privacy = privacy
      next.visibilityMode = mode
      next.allowedUserIds = mode === "custom" ? allowedUserIds : undefined
    }
    if (input.privacy) {
      next.privacy = input.privacy
    }

    // Full edits within 5 minutes
    if (withinWindow) {
      if (Array.isArray(input.hashtags)) {
        next.hashtags = Array.from(new Set(input.hashtags.map((h) => h.toLowerCase().replace(/^#/, ""))))
      }
      if (typeof input.placeId === "string") {
        next.placeId = input.placeId
      }
      if (Array.isArray(input.taggedPetIds)) {
        next.taggedPetIds = input.taggedPetIds
      }
      if (Array.isArray(input.media)) {
        const media: BlogPostMedia = {
          images: input.media
            .filter((m) => (m.type === "image" || m.dataUrl) && (m.url || m.dataUrl))
            .map((m) => (m.url || m.dataUrl!) as string),
          videos: input.media.filter((m) => m.type === "video" && m.url).map((m) => m.url!) || [],
          links: input.media
            .filter((m) => m.type === "link" && m.url)
            .map((m) => ({ url: m.url!, title: m.title })),
        }
        next.media = media
      }
    }

    // Mark edited
    const nowIso = new Date().toISOString()
    next.updatedAt = nowIso

    // Persist
    updateBlogPost(next)

    // Invalidate caches (server cache; feed caches are ephemeral)
    try { await invalidateContentCache("blog", next.id) } catch {}

    // Broadcast update (SSE)
    try { broadcastEvent({ type: "postUpdated", postId: next.id, authorId: next.authorId, ts: Date.now() }) } catch {}

    return NextResponse.json({ post: next })
  } catch (error) {
    console.error("Error updating post:", error)
    return NextResponse.json(
      { error: "Internal server error", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ postId: string }> }) {
  try {
    const { postId } = await context.params
    const body = await request.json().catch(() => ({}))
    const editorId: string | undefined = body?.editorId
    if (!editorId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const post = getBlogPostById(postId)
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    const editor = getUserById(editorId)
    if (!editor) {
      return NextResponse.json({ error: "Editor not found" }, { status: 404 })
    }

    const isOwner = post.authorId === editor.id
    const isPrivileged = editor.role === "admin" || editor.role === "moderator"
    if (!isOwner && !isPrivileged) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Soft delete: mark as deleted; schedule hard delete in 30 days
    const nowIso = new Date().toISOString()
    const hardAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    const updated: BlogPost = {
      ...post,
      deletedAt: nowIso,
      deletedById: editor.id,
      scheduledHardDeleteAt: hardAt,
      updatedAt: nowIso,
    }

    updateBlogPost(updated)

    // Invalidate caches and broadcast removal
    try { await invalidateContentCache("blog", updated.id) } catch {}
    try { broadcastEvent({ type: "postDeleted", postId: updated.id, authorId: updated.authorId, ts: Date.now() }) } catch {}

    // Optional notifications: users who saved or shared
    try {
      const { getUsers, isPostSaved, getBlogPosts } = await import("@/lib/storage")
      const { addNotification } = await import("@/lib/notifications")
      const allUsers = getUsers()

      // Notify savers
      for (const u of allUsers) {
        try {
          if (isPostSaved(u.id, postId)) {
            addNotification({
              id: `notif_${Date.now()}_${Math.random().toString(16).slice(2)}`,
              userId: u.id,
              type: "post",
              actorId: editor.id,
              targetId: postId,
              targetType: "post",
              message: "A post you saved was removed by the author.",
              read: false,
              createdAt: nowIso,
              category: "system",
              channels: ["in_app"],
            })
          }
        } catch {}
      }

      // Notify sharers (people who reposted original)
      const allPosts = getBlogPosts()
      const reposts = allPosts.filter((p) => (p as any).sharedFromPostId === postId)
      for (const r of reposts) {
        try {
          addNotification({
            id: `notif_${Date.now()}_${Math.random().toString(16).slice(2)}`,
            userId: r.authorId,
            type: "post",
            actorId: editor.id,
            targetId: r.id,
            targetType: "post",
            message: "The original post you shared has been removed.",
            read: false,
            createdAt: nowIso,
            category: "system",
            channels: ["in_app"],
          })
        } catch {}
      }
    } catch {}

    // Opportunistic purge of expired soft-deleted posts (hard delete)
    try {
      const { getBlogPosts, deleteBlogPost, getCommentsByPostId, deleteComment, readData, writeData } = await import("@/lib/storage")
      const posts = getBlogPosts()
      const now = Date.now()
      const expired = posts.filter((p) => (p as any).deletedAt && new Date((p as any).scheduledHardDeleteAt || (p as any).deletedAt!).getTime() <= now)

      // Helper: remove from saved collections/maps
      const RAW_SAVED_KEY = "pet_social_saved_posts"
      const RAW_SAVED_COLLECTIONS = "pet_social_saved_collections"
      function removeFromSaved(postIdToRemove: string) {
        try {
          // userId -> postIds map
          const savedMap = readData<Record<string, string[]>>(RAW_SAVED_KEY, {})
          let changed = false
          for (const uid of Object.keys(savedMap)) {
            const before = savedMap[uid]
            const after = before.filter((id) => id !== postIdToRemove)
            if (after.length !== before.length) {
              savedMap[uid] = after
              changed = true
            }
          }
          if (changed) writeData(RAW_SAVED_KEY, savedMap)
        } catch {}

        try {
          const cols = readData<any[]>(RAW_SAVED_COLLECTIONS, [])
          let changed = false
          for (let i = 0; i < cols.length; i++) {
            const before = cols[i].postIds || []
            const after = before.filter((id: string) => id !== postIdToRemove)
            if (after.length !== before.length) {
              cols[i] = { ...cols[i], postIds: after, updatedAt: new Date().toISOString() }
              changed = true
            }
          }
          if (changed) writeData(RAW_SAVED_COLLECTIONS, cols)
        } catch {}
      }

      for (const p of expired) {
        // Delete comments
        try {
          const comments = getCommentsByPostId(p.id)
          for (const c of comments) {
            try { deleteComment(c.id) } catch {}
          }
        } catch {}

        // Delete reposts referencing this post (hard)
        try {
          const reposts = posts.filter((x) => (x as any).sharedFromPostId === p.id)
          for (const r of reposts) {
            removeFromSaved(r.id)
            try { deleteBlogPost(r.id) } catch {}
          }
        } catch {}

        // Remove from all saved lists/collections
        removeFromSaved(p.id)

        // Finally, hard delete
        try { deleteBlogPost(p.id) } catch {}
      }
    } catch {}

    return NextResponse.json({ success: true, message: "Post deleted", post: updated })
  } catch (error) {
    console.error("Error deleting post:", error)
    return NextResponse.json(
      { error: "Internal server error", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
