import { getBlogPosts } from "@/lib/storage"
import type { BlogPost } from "@/lib/types"

interface TagCount {
  tag: string
  count: number
  recentCount: number // Count from recent posts (last 30 days)
}

/**
 * Get suggested tags based on recent posts and trending tags
 */
export function getSuggestedTags(limit: number = 10): string[] {
  const posts = getBlogPosts()
  const now = Date.now()
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000

  // Collect all tags with counts
  const tagMap = new Map<string, TagCount>()

  posts.forEach((post) => {
    const postDate = new Date(post.createdAt).getTime()
    const isRecent = postDate >= thirtyDaysAgo

    // Process tags
    if (post.tags && Array.isArray(post.tags)) {
      post.tags.forEach((tag) => {
        const normalizedTag = tag.toLowerCase().trim()
        if (!normalizedTag) return

        const existing = tagMap.get(normalizedTag) || { tag: normalizedTag, count: 0, recentCount: 0 }
        existing.count += 1
        if (isRecent) {
          existing.recentCount += 1
        }
        tagMap.set(normalizedTag, existing)
      })
    }

    // Process hashtags
    if (post.hashtags && Array.isArray(post.hashtags)) {
      post.hashtags.forEach((hashtag) => {
        const normalizedTag = hashtag.toLowerCase().trim().replace(/^#/, "")
        if (!normalizedTag) return

        const existing = tagMap.get(normalizedTag) || { tag: normalizedTag, count: 0, recentCount: 0 }
        existing.count += 1
        if (isRecent) {
          existing.recentCount += 1
        }
        tagMap.set(normalizedTag, existing)
      })
    }
  })

  // Sort by: recent count first (trending), then total count (popular)
  const sortedTags = Array.from(tagMap.values())
    .sort((a, b) => {
      // Prioritize tags with recent activity
      if (b.recentCount !== a.recentCount) {
        return b.recentCount - a.recentCount
      }
      // Then by total count
      return b.count - a.count
    })
    .slice(0, limit)
    .map((item) => item.tag)

  return sortedTags
}

/**
 * Get suggested tags filtered by search query
 */
export function getFilteredSuggestions(query: string, limit: number = 5): string[] {
  const allSuggestions = getSuggestedTags(limit * 3) // Get more to filter
  const queryLower = query.toLowerCase().trim()

  if (!queryLower) {
    return allSuggestions.slice(0, limit)
  }

  // Filter suggestions that start with or contain the query
  const filtered = allSuggestions.filter((tag) => tag.toLowerCase().includes(queryLower))
  return filtered.slice(0, limit)
}

