import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import {
  addBlogPost,
  addMessageToConversation,
  addStory,
  createConversation,
  generateStorageId,
  getBlogPostById,
  getConversationById,
  getUserById,
} from "@/lib/storage"
import type { BlogPost, Story, DirectMessage } from "@/lib/types"
import { broadcastEvent } from "@/lib/server/sse"
import { createPostSharedNotification } from "@/lib/notifications"

// Local analytics storage key
const SHARE_ANALYTICS_KEY = "pet_social_share_events"

const bodySchema = z.object({
  userId: z.string().min(1),
  destination: z.enum(["feed", "story", "message"]),
  comment: z.string().max(1000).optional(),
  // Required when destination = 'feed'
  petId: z.string().optional(),
  // Message routing (one of these if destination = 'message')
  conversationId: z.string().optional(),
  recipientUserId: z.string().optional(),
})

export async function POST(request: NextRequest, context: { params: Promise<{ postId: string }> }) {
  try {
    const { postId } = await context.params
    const parsed = bodySchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request", details: parsed.error.errors }, { status: 400 })
    }

    const { userId, destination, comment, petId, conversationId, recipientUserId } = parsed.data

    const original = getBlogPostById(postId)
    if (!original || (original as any).deletedAt) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    const user = getUserById(userId)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    let shareResult: { destination: string; feedPostId?: string; storyId?: string; conversationId?: string; messageId?: string }

    if (destination === "feed") {
      if (!petId) {
        return NextResponse.json({ error: "petId is required for feed shares" }, { status: 400 })
      }

      const now = new Date().toISOString()
      const repost: BlogPost = {
        id: `post-${Date.now()}`,
        petId,
        authorId: userId,
        title: comment && comment.trim().length > 0 ? comment.slice(0, 50) : `Shared a post`,
        content: comment || "",
        tags: [],
        categories: [],
        likes: [],
        reactions: { like: [], love: [], laugh: [], wow: [], sad: [], angry: [], paw: [] },
        createdAt: now,
        updatedAt: now,
        privacy: original.privacy || "public",
        isDraft: false,
        hashtags: [],
        sharedFromPostId: original.id,
        sharedComment: comment,
      }
      addBlogPost(repost)
      shareResult = { destination, feedPostId: repost.id }
    } else if (destination === "story") {
      const now = new Date()
      const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString()
      const story: Story = {
        id: generateStorageId("story"),
        userId,
        // Store a simple background if no media; clients can resolve from original post media
        media: [
          {
            type: "image",
            url: original.media?.images?.[0] || original.coverImage || "/gradient-placeholder.jpg",
            duration: 5,
            aspect: "9:16",
          },
        ],
        overlays: comment ? [
          { id: generateStorageId("overlay"), type: "text", text: comment, x: 0.5, y: 0.85, scale: 1, color: "#fff", fontSize: 18 },
          { id: generateStorageId("overlay"), type: "sticker", data: { type: "post", postId: original.id }, x: 0.5, y: 0.15, scale: 1 },
        ] : [
          { id: generateStorageId("overlay"), type: "sticker", data: { type: "post", postId: original.id }, x: 0.5, y: 0.15, scale: 1 },
        ],
        createdAt: now.toISOString(),
        expiresAt,
      }
      addStory(story)
      shareResult = { destination, storyId: story.id }
    } else {
      // destination === 'message'
      let convId = conversationId
      if (!convId) {
        if (!recipientUserId) {
          return NextResponse.json({ error: "recipientUserId or conversationId required for message shares" }, { status: 400 })
        }
        const conv = createConversation([userId, recipientUserId])
        convId = conv.id
      } else {
        // Validate conversation exists
        const conv = getConversationById(convId)
        if (!conv) {
          return NextResponse.json({ error: "Conversation not found" }, { status: 404 })
        }
      }

      const msg: DirectMessage = {
        id: generateStorageId("dm"),
        conversationId: convId!,
        senderId: userId,
        content: comment && comment.trim().length > 0 ? `${comment}\n\nShared post: /blog/${original.id}` : `Shared post: /blog/${original.id}`,
        createdAt: new Date().toISOString(),
      }
      addMessageToConversation(msg)
      shareResult = { destination, conversationId: convId!, messageId: msg.id }
    }

    // Analytics tracking (best-effort)
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        const raw = localStorage.getItem(SHARE_ANALYTICS_KEY)
        const events = raw ? (JSON.parse(raw) as any[]) : []
        events.push({ id: generateStorageId("share"), userId, postId: original.id, destination, comment, ts: Date.now() })
        localStorage.setItem(SHARE_ANALYTICS_KEY, JSON.stringify(events.slice(-5000)))
      }
    } catch {}

    // Notify original author (avoid self-notify)
    try {
      if (original.authorId !== userId) {
        createPostSharedNotification(userId, original.authorId, user.fullName, original.id)
      }
    } catch {}

    // Broadcast share
    try {
      broadcastEvent({ type: "postShared", postId: original.id, by: userId, destination, share: shareResult, ts: Date.now() })
    } catch {}

    return NextResponse.json({ success: true, ...shareResult })
  } catch (error) {
    console.error("Error sharing post:", error)
    return NextResponse.json(
      { error: "Internal server error", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
