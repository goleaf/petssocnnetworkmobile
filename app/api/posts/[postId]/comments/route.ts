import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import {
  addComment,
  generateStorageId,
  getBlogPostById,
  getComments,
  getCommentsByPostId,
  getUserById,
  getUserByUsername,
} from "@/lib/storage"
import type { Comment } from "@/lib/types"
import { parseMentions } from "@/lib/utils/mentions"
import { createMentionNotification, createCommentNotification, createNotification } from "@/lib/notifications"
import { broadcastEvent } from "@/lib/server/sse"

const bodySchema = z.object({
  userId: z.string().min(1),
  text: z.string().min(1).max(2000),
  parentCommentId: z.string().optional(),
})

export async function POST(request: NextRequest, { params }: { params: { postId: string } }) {
  try {
    const parsed = bodySchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.errors },
        { status: 400 }
      )
    }

    const { userId, text, parentCommentId } = parsed.data
    const post = getBlogPostById(params.postId)
    if (!post || (post as any).deletedAt) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    const user = getUserById(userId)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // If replying, validate parent exists and belongs to same post
    let parentAuthorId: string | undefined
    if (parentCommentId) {
      const all = getComments()
      const parent = all.find((c) => c.id === parentCommentId)
      if (!parent || parent.postId !== post.id) {
        return NextResponse.json({ error: "Invalid parentCommentId" }, { status: 400 })
      }
      parentAuthorId = parent.userId
    }

    const nowIso = new Date().toISOString()
    const comment: Comment = {
      id: generateStorageId("comment"),
      postId: post.id,
      userId,
      content: text,
      createdAt: nowIso,
      parentCommentId,
      format: "plaintext",
      status: "published",
    }

    // Persist (will enforce block checks)
    addComment(comment)

    // Mentions processing and notifications
    try {
      const mentions = parseMentions(text)
      const uniqueUsernames = Array.from(new Set(mentions.map((m) => m.username)))
      for (const uname of uniqueUsernames) {
        const mentioned = getUserByUsername(uname)
        if (mentioned && mentioned.id !== userId) {
          createMentionNotification({
            mentionerId: userId,
            mentionerName: user.fullName,
            mentionedUserId: mentioned.id,
            threadId: comment.id,
            threadType: "comment",
            commentId: comment.id,
            postId: post.id,
          })
        }
      }
    } catch {}

    // Notify post author about the comment (avoid self‑notify)
    try {
      if (post.authorId !== userId) {
        const title = post.title || (post.content ? String(post.content).slice(0, 80) : "your post")
        createCommentNotification(userId, post.authorId, post.id, user.fullName, title)
      }
    } catch {}

    // If reply, notify parent comment author (avoid notifying self and duplicate if same as post author)
    try {
      if (parentAuthorId && parentAuthorId !== userId && parentAuthorId !== post.authorId) {
        createNotification({
          userId: parentAuthorId,
          type: "comment",
          actorId: userId,
          targetId: post.id,
          targetType: "post",
          message: `${user.fullName} replied to your comment`,
          channels: ["in_app", "push"],
          category: "social",
        })
      }
    } catch {}

    // Broadcast to viewers
    try {
      broadcastEvent({ type: "commentCreated", postId: post.id, comment, ts: Date.now() })
    } catch {}

    // Compute updated count
    const totalComments = getCommentsByPostId(post.id).length

    return NextResponse.json({ comment, totalComments })
  } catch (error) {
    console.error("Error creating comment:", error)
    return NextResponse.json(
      { error: "Internal server error", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

