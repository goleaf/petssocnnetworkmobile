import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getBlogPosts, getUsers, getPets, getPlaces, getHiddenPostIds, isPostSaved } from "@/lib/storage"
import { canViewPost } from "@/lib/utils/privacy"
import type { BlogPost, Place } from "@/lib/types"
import { diversifyAndInjectFeed, diversifyPosts } from "@/lib/utils/feed-diversity"
import { rankPosts } from "@/lib/utils/post-ranking"
import { getCommentsByPostId, areUsersBlocked } from "@/lib/storage"
import { ensureRelevanceCron } from "@/lib/jobs/relevance-scheduler"

// ---------------------------------------------------------------------------
// Simple in-memory cache for ranked feeds per viewer/scope
// Cached for 5 minutes and invalidated when a lightweight signature changes
// Signature includes: total reactions, total comments, last updated timestamp,
// hidden count, and muted keyword prefs for the viewer.
// ---------------------------------------------------------------------------
type FeedCacheEntry = {
  timestamp: number
  signature: string
  // Full ordered list after diversity + discovery injection, pre-pagination
  fullList: BlogPost[]
  // Total count of visible posts used when caching
  totalVisible: number
}

const FEED_CACHE = new Map<string, FeedCacheEntry>()
const FEED_CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

function makeCacheKey(viewerId: string, scope: string) {
  return `${viewerId}:${scope}`
}

// Request validation schema
const getFeedSchema = z.object({
  viewerId: z.string().min(1),
  scope: z.enum(["all", "following"]).default("all"),
  afterCursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

export async function GET(request: NextRequest) {
  // Ensure background cron is running in this server process
  try { ensureRelevanceCron() } catch {}
  try {
    const { searchParams } = new URL(request.url)
    const params = {
      viewerId: searchParams.get("viewerId"),
      scope: searchParams.get("scope") || "all",
      afterCursor: searchParams.get("afterCursor") ?? undefined,
      // Use undefined when not provided so zod .default applies
      limit: (searchParams.get("limit") ?? undefined) as unknown as string | undefined,
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
    const places: Place[] = getPlaces()
    const placesMap = new Map<string, Place>(places.map((p) => [p.id, p]))
    const userMap = new Map(allUsers.map((u) => [u.id, u]))
    const petMap = new Map(allPets.map((p) => [p.id, p]))
    const viewer = allUsers.find((u) => u.id === viewerId)

    if (!viewer) {
      return NextResponse.json({ error: "Viewer not found" }, { status: 404 })
    }

    // Filter posts based on privacy, scope, and mute/block/hidden
    let visiblePosts: BlogPost[] = []

    const hiddenIds = getHiddenPostIds(viewerId)
    const mutedUserIds = new Set<string>(viewer.mutedUsers || [])

    if (scope === "following") {
      // Only show posts from followed users/pets
      const followedPosts = allPosts.filter((post) => {
        // Exclude soft-deleted posts
        if ((post as any).deletedAt) return false
        const author = userMap.get(post.authorId)
        if (!author) return false
        if (hiddenIds.includes(post.id)) return false
        if (mutedUserIds.has(post.authorId)) return false
        if (areUsersBlocked(viewerId, post.authorId)) return false
        const pet = petMap.get(post.petId || "")
        const isFollowingUser = viewer.following?.includes(post.authorId) ?? false
        const isFollowingPet = pet?.followers?.includes(viewerId) ?? false

        if (!isFollowingUser && !isFollowingPet) return false

        return canViewPost(post, author, viewerId)
      })

      visiblePosts = followedPosts
    } else {
      // Show all visible posts
      visiblePosts = allPosts.filter((post) => {
        // Exclude soft-deleted posts
        if ((post as any).deletedAt) return false
        const author = userMap.get(post.authorId)
        if (!author) return false
        if (hiddenIds.includes(post.id)) return false
        if (mutedUserIds.has(post.authorId)) return false
        if (areUsersBlocked(viewerId, post.authorId)) return false
        return canViewPost(post, author, viewerId)
      })
    }

    // Compute engagement counts for ranking and a cache signature
    const commentCounts = new Map<string, number>()
    let totalComments = 0
    for (const p of visiblePosts) {
      const c = getCommentsByPostId(p.id).length
      commentCounts.set(p.id, c)
      totalComments += c
    }

    // Build a lightweight signature to detect meaningful changes
    let totalReactions = 0
    let lastUpdatedMs = 0
    let totalShares = 0
    let totalSaves = 0

    // Precompute share counts for all posts
    const shareCounts = new Map<string, number>()
    for (const p of allPosts) {
      const origin = (p as any).sharedFromPostId as string | undefined
      if (origin) shareCounts.set(origin, (shareCounts.get(origin) || 0) + 1)
    }

    for (const p of visiblePosts) {
      const reacted = p.reactions || ({} as NonNullable<BlogPost["reactions"]>)
      const reactionSum = Object.values(reacted).reduce((acc, arr) => acc + (arr?.length || 0), 0)
      totalReactions += reactionSum
      totalShares += shareCounts.get(p.id) || 0
      const ts = new Date((p as any).updatedAt || p.createdAt).getTime()
      if (ts > lastUpdatedMs) lastUpdatedMs = ts
    }

    // Saves across users for visible posts
    try {
      for (const u of allUsers) {
        for (const p of visiblePosts) {
          try { if (isPostSaved(u.id, p.id)) totalSaves += 1 } catch {}
        }
      }
    } catch {}

    const mutedKeywords = (viewer.displayPreferences?.mutedKeywords || []).join("|")
    const signature = [lastUpdatedMs, totalReactions, totalComments, totalShares, totalSaves, hiddenIds.length, mutedKeywords].join(":")
    const cacheKey = makeCacheKey(viewerId, scope)

    let fullList: BlogPost[] | null = null
    let totalVisible = visiblePosts.length

    const cached = FEED_CACHE.get(cacheKey)
    const now = Date.now()
    if (cached && now - cached.timestamp < FEED_CACHE_TTL_MS && cached.signature === signature) {
      fullList = cached.fullList
      totalVisible = cached.totalVisible
    }

    if (!fullList) {
      // Build user ranking context
      const followingIds = new Set<string>(viewer.following || [])
      const userContext = { currentUserId: viewer.id, followingIds, mutedKeywords: viewer.displayPreferences?.mutedKeywords }

      // Rank posts by relevance
      const ranked = rankPosts(visiblePosts, commentCounts, placesMap, null, {}, userContext)

      // Apply diversity constraints
      const diversifiedBase = diversifyPosts(ranked, { windowSize: 10, maxPerAuthorInWindow: 3, maxSameTypeRun: 3 })

      // Inject discovery slots (outside follow network) only for "all" scope using recency as candidate source
      const recencySorted = [...visiblePosts].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      const withDiscovery = scope === "all"
        ? diversifyAndInjectFeed(
            diversifiedBase,
            recencySorted,
            viewer,
            allUsers,
            allPets,
            [5, 15, 30, 50],
            { windowSize: 10, maxPerAuthorInWindow: 3, maxSameTypeRun: 3 }
          )
        : diversifiedBase

      fullList = withDiscovery

      // Store in cache
      FEED_CACHE.set(cacheKey, {
        timestamp: now,
        signature,
        fullList,
        totalVisible,
      })
    }

    // Apply cursor-based pagination after diversification/injection
    let finalList = fullList
    if (afterCursor) {
      const cursorIndex = finalList.findIndex((p) => p.id === afterCursor)
      if (cursorIndex !== -1) {
        finalList = finalList.slice(cursorIndex + 1)
      }
    }

    const posts = finalList.slice(0, limit)
    const nextCursor = posts.length > 0 && finalList.length > limit ? posts[posts.length - 1].id : null

    // Enrich posts with author and pet info (for client-side use)
    const enrichedPosts = posts.map((post) => {
      const author = userMap.get(post.authorId)
      const pet = petMap.get(post.petId || "")
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
      total: totalVisible,
    })
  } catch (error) {
    console.error("Error getting feed:", error)
    return NextResponse.json(
      { error: "Internal server error", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
