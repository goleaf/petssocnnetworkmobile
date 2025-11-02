import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

// In-memory status store (in production, use Redis or similar)
let rebuildStatus: {
  status: "idle" | "building" | "completed" | "error"
  progress: number
  message?: string
  startedAt?: string
  completedAt?: string
  error?: string
} = {
  status: "idle",
  progress: 0,
}

export async function GET() {
  return NextResponse.json(rebuildStatus)
}

export async function POST() {
  if (rebuildStatus.status === "building") {
    return NextResponse.json(
      { error: "Rebuild already in progress" },
      { status: 409 }
    )
  }

  rebuildStatus = {
    status: "building",
    progress: 0,
    message: "Starting index rebuild...",
    startedAt: new Date().toISOString(),
  }

  // Run rebuild asynchronously
  rebuildIndex().catch((error) => {
    rebuildStatus = {
      status: "error",
      progress: 0,
      error: error.message,
      startedAt: rebuildStatus.startedAt,
      completedAt: new Date().toISOString(),
    }
  })

  return NextResponse.json({ success: true, status: rebuildStatus })
}

async function rebuildIndex() {
  try {
    // Get all blog posts
    const blogPosts = await db.blogPost.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        title: true,
        content: true,
        tags: true,
      },
    })

    const total = blogPosts.length
    let processed = 0

    rebuildStatus.message = `Processing ${total} blog posts...`

    for (const post of blogPosts) {
      // Update or create search index entry
      const searchText = `${post.title} ${post.content} ${post.tags.join(" ")}`.toLowerCase()

      await db.blogPostSearchIndex.upsert({
        where: { postId: post.id },
        create: {
          postId: post.id,
          content: searchText,
        },
        update: {
          content: searchText,
        },
      })

      processed++
      rebuildStatus.progress = Math.round((processed / total) * 100)
      rebuildStatus.message = `Processed ${processed} of ${total} posts...`

      // Small delay to allow progress updates
      if (processed % 10 === 0) {
        await new Promise((resolve) => setTimeout(resolve, 50))
      }
    }

    rebuildStatus = {
      status: "completed",
      progress: 100,
      message: `Successfully rebuilt index for ${processed} posts`,
      startedAt: rebuildStatus.startedAt,
      completedAt: new Date().toISOString(),
    }
  } catch (error) {
    rebuildStatus = {
      status: "error",
      progress: rebuildStatus.progress,
      error: error instanceof Error ? error.message : "Unknown error",
      startedAt: rebuildStatus.startedAt,
      completedAt: new Date().toISOString(),
    }
    throw error
  }
}
