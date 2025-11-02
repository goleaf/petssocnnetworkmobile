import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { addBlogPost, getUserById } from "@/lib/storage"
import { linkifyEntities } from "@/lib/utils/linkify-entities"
import type { BlogPost, BlogPostMedia, PostPoll, PrivacyLevel } from "@/lib/types"

// Request validation schema
const createPostSchema = z.object({
  text: z.string().min(1).max(10000),
  media: z
    .array(
      z.object({
        type: z.enum(["image", "video", "link"]),
        url: z.string().url(),
        title: z.string().optional(),
      })
    )
    .max(10)
    .default([]),
  poll: z
    .object({
      question: z.string().min(1).max(500),
      options: z
        .array(
          z.object({
            text: z.string().min(1).max(200),
          })
        )
        .min(2)
        .max(10),
      allowMultiple: z.boolean().default(false),
      expiresAt: z.string().optional(),
    })
    .optional(),
  placeId: z.string().optional(),
  visibility: z.enum(["public", "private", "followers-only"]).default("public"),
  authorId: z.string().min(1),
  petId: z.string().min(1),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validation = createPostSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: validation.error.errors },
        { status: 400 }
      )
    }

    const { text, media, poll, placeId, visibility, authorId, petId } = validation.data

    // Verify user exists
    const author = getUserById(authorId)
    if (!author) {
      return NextResponse.json({ error: "Author not found" }, { status: 404 })
    }

    // Extract entities from text
    const entities = linkifyEntities(text)

    // Extract hashtags from text
    const hashtagMatches = text.match(/#[a-zA-Z0-9_]+/g) || []
    const hashtags = [...new Set(hashtagMatches.map((tag) => tag.substring(1).toLowerCase()))]

    // Organize media by type
    const organizedMedia: BlogPostMedia = {
      images: media.filter((m) => m.type === "image").map((m) => m.url),
      videos: media.filter((m) => m.type === "video").map((m) => m.url),
      links: media
        .filter((m) => m.type === "link")
        .map((m) => ({
          url: m.url,
          title: m.title,
        })),
    }

    // Create poll if provided
    let postPoll: PostPoll | undefined
    if (poll) {
      postPoll = {
        question: poll.question,
        options: poll.options.map((opt, index) => ({
          id: `opt-${index}`,
          text: opt.text,
          voteCount: 0,
        })),
        allowMultiple: poll.allowMultiple || false,
        expiresAt: poll.expiresAt,
        isClosed: false,
      }
    }

    // Create title from text (first 50 chars)
    const title = text.substring(0, 50) + (text.length > 50 ? "..." : "")

    // Create the post
    const newPost: BlogPost = {
      id: `post-${Date.now()}`,
      petId,
      authorId,
      title,
      content: text,
      tags: [],
      categories: [],
      likes: [],
      reactions: {
        like: [],
        love: [],
        laugh: [],
        wow: [],
        sad: [],
        angry: [],
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      privacy: visibility as PrivacyLevel,
      isDraft: false,
      hashtags,
      media: organizedMedia,
      poll: postPoll,
      placeId,
    }

    // Save post
    addBlogPost(newPost)

    // Return the created post with entity ranges
    return NextResponse.json({
      post: newPost,
      entities: entities,
    })
  } catch (error) {
    console.error("Error creating post:", error)
    return NextResponse.json(
      { error: "Internal server error", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

