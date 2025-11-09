import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import {
  getBlogPostById,
  updateBlogPost,
  areUsersBlocked,
  togglePostReaction,
  getCommentsByPostId,
  getUsers,
  isPostSaved,
} from "@/lib/storage"
import type { BlogPost, ReactionType } from "@/lib/types"
import { broadcastEvent } from "@/lib/server/sse"
import { getNotifications, deleteNotification } from "@/lib/notifications"

const bodySchema = z.object({
  userId: z.string().min(1),
  reaction: z
    .enum(["like", "love", "laugh", "wow", "sad", "angry", "paw"]) // default if missing
    .optional(),
})

type ReactionCounts = Record<ReactionType, number> & { total: number }

function countReactions(post: BlogPost): ReactionCounts {
  const base: ReactionCounts = {
    like: 0,
    love: 0,
    laugh: 0,
    wow: 0,
    sad: 0,
    angry: 0,
    paw: 0,
    total: 0,
  }
  const r = post.reactions || ({} as NonNullable<BlogPost["reactions"]>)
  for (const k of Object.keys(base) as (keyof ReactionCounts)[]) {
    if (k === "total") continue
    const arr = (r as any)[k]
    base[k as ReactionType] = Array.isArray(arr) ? arr.length : 0
  }
  base.total = (Object.keys(r) as (keyof typeof r)[]).reduce((acc, key) => acc + ((r[key]?.length) || 0), 0)
  return base
}

export async function POST(request: NextRequest, { params }: { params: { postId: string } }) {
  try {
    const parsed = bodySchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 })
    }

    const { userId } = parsed.data
    const reaction: ReactionType = (parsed.data.reaction as ReactionType) || "like"

    const post = getBlogPostById(params.postId)
    if (!post || (post as any).deletedAt) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    // Blocked check
    if (areUsersBlocked(userId, post.authorId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Determine if user already reacted and with what type
    const current = post.reactions || ({} as NonNullable<BlogPost["reactions"]>)
    let previous: ReactionType | null = null
    for (const key of Object.keys(current) as ReactionType[]) {
      const arr = current[key] || []
      if (arr.includes(userId)) {
        previous = key
        break
      }
    }

    // If same reaction requested, keep as-is (no-op); else update to new type using toggle helper
    if (previous !== reaction) {
      // togglePostReaction removes other reactions and adds the desired one
      togglePostReaction(post.id, userId, reaction)
    }

    // Refresh updated post from storage to compute counts
    const updated = getBlogPostById(post.id) || post
    const counts = countReactions(updated)

    // Broadcast to viewers listening
    try {
      broadcastEvent({
        type: "postReactionUpdated",
        postId: updated.id,
        userId,
        reaction,
        counts,
        ts: Date.now(),
      })
    } catch {}

    // Optionally include comment count to help clients
    const commentCount = getCommentsByPostId(updated.id).length

    return NextResponse.json({
      postId: updated.id,
      reactions: counts,
      commentCount,
    })
  } catch (error) {
    console.error("Error updating reaction:", error)
    return NextResponse.json(
      { error: "Internal server error", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { postId: string } }) {
  try {
    const parsed = bodySchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 })
    }
    const { userId } = parsed.data

    const post = getBlogPostById(params.postId)
    if (!post || (post as any).deletedAt) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    // Blocked check
    if (areUsersBlocked(userId, post.authorId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Find existing reaction type
    const current = post.reactions || ({} as NonNullable<BlogPost["reactions"]>)
    let previous: ReactionType | null = null
    for (const key of Object.keys(current) as ReactionType[]) {
      const arr = current[key] || []
      if (arr.includes(userId)) {
        previous = key
        break
      }
    }

    // If none, nothing to remove; respond success (idempotent)
    if (!previous) {
      const counts = countReactions(post)
      return NextResponse.json({
        success: true,
        postId: post.id,
        reactions: counts,
        commentCount: getCommentsByPostId(post.id).length,
      })
    }

    // Toggle off the previous reaction
    togglePostReaction(post.id, userId, previous)

    const updated = getBlogPostById(post.id) || post
    const counts = countReactions(updated)

    // Remove unread like notification if present
    try {
      const notifs = getNotifications().filter(
        (n) =>
          n.type === "like" &&
          n.userId === updated.authorId &&
          n.actorId === userId &&
          n.targetType === "post" &&
          n.targetId === updated.id &&
          !n.read,
      )
      for (const n of notifs) {
        deleteNotification(n.id)
      }
    } catch {}

    // Broadcast update
    try {
      broadcastEvent({
        type: "postReactionUpdated",
        postId: updated.id,
        userId,
        reaction: null,
        removed: true,
        counts,
        ts: Date.now(),
      })
    } catch {}

    return NextResponse.json({
      success: true,
      postId: updated.id,
      reactions: counts,
      commentCount: getCommentsByPostId(updated.id).length,
    })
  } catch (error) {
    console.error("Error removing reaction:", error)
    return NextResponse.json(
      { error: "Internal server error", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
