import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getBlogPosts, getUsers, getPets } from "@/lib/storage"
import { canViewPost } from "@/lib/utils/privacy"
import type { BlogPost } from "@/lib/types"

// Request validation schema
const getFeedSchema = z.object({
  viewerId: z.string().min(1),
  scope: z.enum(["all", "following"]).default("all"),
  afterCursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const params = {
      viewerId: searchParams.get("viewerId"),
      scope: searchParams.get("scope") || "all",
      afterCursor: searchParams.get("afterCursor"),
      limit: searchParams.get("limit"),
    }

    const validation = getFeedSchema.safeParse(params)

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: validation.error.errors },
        { status: 400 }
      )
    }

    const { viewerId, scope, afterCursor, limit } = validation.data

    // Get all posts, users, and pets
    const allPosts = getBlogPosts()
    const allUsers = getUsers()
    const allPets = getPets()
    const viewer = allUsers.find((u) => u.id === viewerId)

    if (!viewer) {
      return NextResponse.json({ error: "Viewer not found" }, { status: 404 })
    }

    // Filter posts based on privacy and scope
    let visiblePosts: BlogPost[] = []

    if (scope === "following") {
      // Only show posts from followed users/pets
      const followedPosts = allPosts.filter((post) => {
        const author = allUsers.find((u) => u.id === post.authorId)
        if (!author) return false

        const pet = allPets.find((p) => p.id === post.petId)
        const isFollowingUser = viewer.following?.includes(post.authorId) ?? false
        const isFollowingPet = pet?.followers?.includes(viewerId) ?? false

        if (!isFollowingUser && !isFollowingPet) return false

        return canViewPost(post, author, viewerId)
      })

      visiblePosts = followedPosts
    } else {
      // Show all visible posts
      visiblePosts = allPosts.filter((post) => {
        const author = allUsers.find((u) => u.id === post.authorId)
        if (!author) return false
        return canViewPost(post, author, viewerId)
      })
    }

    // Sort by creation date (newest first)
    visiblePosts.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime()
      const dateB = new Date(b.createdAt).getTime()
      return dateB - dateA
    })

    // Apply cursor-based pagination
    let paginatedPosts = visiblePosts
    if (afterCursor) {
      const cursorIndex = paginatedPosts.findIndex((p) => p.id === afterCursor)
      if (cursorIndex !== -1) {
        paginatedPosts = paginatedPosts.slice(cursorIndex + 1)
      }
    }

    // Apply limit
    const posts = paginatedPosts.slice(0, limit)
    const nextCursor = posts.length > 0 && paginatedPosts.length > limit ? posts[posts.length - 1].id : null

    // Enrich posts with author and pet info (for client-side use)
    const enrichedPosts = posts.map((post) => {
      const author = allUsers.find((u) => u.id === post.authorId)
      const pet = allPets.find((p) => p.id === post.petId)
      return {
        ...post,
        author: author
          ? {
              id: author.id,
              username: author.username,
              fullName: author.fullName,
              avatar: author.avatar,
            }
          : null,
        pet: pet
          ? {
              id: pet.id,
              name: pet.name,
              avatar: pet.avatar,
              species: pet.species,
            }
          : null,
      }
    })

    return NextResponse.json({
      posts: enrichedPosts,
      nextCursor,
      hasMore: nextCursor !== null,
      total: visiblePosts.length,
    })
  } catch (error) {
    console.error("Error getting feed:", error)
    return NextResponse.json(
      { error: "Internal server error", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

