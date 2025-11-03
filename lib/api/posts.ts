import type { BlogPost, PostPoll, PrivacyLevel } from "@/lib/types"
import { linkifyEntities } from "@/lib/utils/linkify-entities"

export interface CreatePostParams {
  text: string
  media?: Array<{
    type: "image" | "video" | "link"
    url: string
    title?: string
  }>
  poll?: {
    question: string
    options: Array<{ text: string }>
    allowMultiple?: boolean
    expiresAt?: string
  }
  placeId?: string
  visibility?: PrivacyLevel
  authorId: string
  petId: string
}

export interface CreatePostResponse {
  post: BlogPost
  entities: ReturnType<typeof linkifyEntities>
}

export interface GetFeedParams {
  viewerId: string
  scope?: "all" | "following"
  afterCursor?: string
  limit?: number
}

export interface GetFeedResponse {
  posts: Array<
    BlogPost & {
      author: {
        id: string
        username: string
        fullName: string
        avatar?: string
      } | null
      pet: {
        id: string
        name: string
        avatar?: string
        species: string
      } | null
    }
  >
  nextCursor: string | null
  hasMore: boolean
  total: number
}

/**
 * Create a new post
 */
export async function createPost(params: CreatePostParams): Promise<CreatePostResponse> {
  const response = await fetch("/api/posts/create", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text: params.text,
      media: params.media || [],
      poll: params.poll,
      placeId: params.placeId,
      visibility: params.visibility || "public",
      authorId: params.authorId,
      petId: params.petId,
    }),
  })

  if (!response.ok) {
    const contentType = response.headers.get("content-type")
    if (contentType && contentType.includes("application/json")) {
      const error = await response.json()
      throw new Error(error.error || "Failed to create post")
    }
    throw new Error(`Failed to create post: ${response.statusText}`)
  }

  const contentType = response.headers.get("content-type")
  if (!contentType || !contentType.includes("application/json")) {
    throw new Error("Invalid response format")
  }

  return response.json()
}

/**
 * Get feed posts with privacy enforcement
 */
export async function getFeed(params: GetFeedParams): Promise<GetFeedResponse> {
  const searchParams = new URLSearchParams({
    viewerId: params.viewerId,
    scope: params.scope || "all",
    limit: String(params.limit || 20),
  })

  if (params.afterCursor) {
    searchParams.append("afterCursor", params.afterCursor)
  }

  const response = await fetch(`/api/posts/feed?${searchParams.toString()}`)

  if (!response.ok) {
    const contentType = response.headers.get("content-type")
    if (contentType && contentType.includes("application/json")) {
      const error = await response.json()
      throw new Error(error.error || "Failed to get feed")
    }
    throw new Error(`Failed to get feed: ${response.statusText}`)
  }

  const contentType = response.headers.get("content-type")
  if (!contentType || !contentType.includes("application/json")) {
    throw new Error("Invalid response format")
  }

  return response.json()
}

/**
 * Linkify entities in text (client-side utility)
 */
export function linkifyEntitiesInText(text: string) {
  return linkifyEntities(text)
}

