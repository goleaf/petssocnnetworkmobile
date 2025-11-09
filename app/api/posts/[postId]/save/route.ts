import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import {
  getBlogPostById,
  getUserById,
  isPostSaved,
  toggleSavedPost,
  ensureDefaultSavedCollection,
  getSavedCollectionsByUser,
  addPostToSavedCollection,
} from "@/lib/storage"

const bodySchema = z.object({
  userId: z.string().min(1),
  collectionId: z.string().optional(),
})

export async function POST(request: NextRequest, context: { params: Promise<{ postId: string }> }) {
  try {
    const { postId } = await context.params
    const parsed = bodySchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 })
    }

    const { userId, collectionId } = parsed.data
    const post = getBlogPostById(postId)
    if (!post || (post as any).deletedAt) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    const user = getUserById(userId)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Determine target collection (validate ownership)
    let targetCollectionId: string
    if (collectionId) {
      const mine = getSavedCollectionsByUser(userId)
      const match = mine.find((c) => c.id === collectionId)
      if (match) {
        targetCollectionId = match.id
      } else {
        // If provided collection not found or not owned, fall back to default
        targetCollectionId = ensureDefaultSavedCollection(userId).id
      }
    } else {
      targetCollectionId = ensureDefaultSavedCollection(userId).id
    }

    // Ensure saved flag is set (idempotent)
    if (!isPostSaved(userId, post.id)) {
      toggleSavedPost(userId, post.id)
    }

    // Add to target collection (idempotent)
    addPostToSavedCollection(userId, targetCollectionId, post.id)

    return NextResponse.json({ success: true, postId: post.id, collectionId: targetCollectionId })
  } catch (error) {
    console.error("Error saving post:", error)
    return NextResponse.json(
      { error: "Internal server error", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
