/**
 * Tag suggestion utilities
 */

import { getBlogPosts } from "../storage"
import type { BlogPost } from "../types"

/**
 * Get all unique tags from blog posts
 */
export function getAllTags(): string[] {
  const posts = getBlogPosts()
  const tagSet = new Set<string>()

  posts.forEach((post) => {
    post.tags?.forEach((tag) => {
      if (tag && tag.trim()) {
        tagSet.add(tag.trim().toLowerCase())
      }
    })
  })

  return Array.from(tagSet).sort()
}

/**
 * Get tag suggestions based on prefix
 * Returns tags that start with the given prefix
 */
export function getTagSuggestions(prefix: string, limit: number = 10): string[] {
  if (!prefix || prefix.trim() === "") {
    return getAllTags().slice(0, limit)
  }

  const normalizedPrefix = prefix.trim().toLowerCase()
  const allTags = getAllTags()

  return allTags
    .filter((tag) => tag.startsWith(normalizedPrefix))
    .slice(0, limit)
}

/**
 * Get popular tags (most frequently used)
 */
export function getPopularTags(limit: number = 20): string[] {
  const posts = getBlogPosts()
  const tagCounts = new Map<string, number>()

  posts.forEach((post) => {
    post.tags?.forEach((tag) => {
      if (tag && tag.trim()) {
        const normalized = tag.trim().toLowerCase()
        tagCounts.set(normalized, (tagCounts.get(normalized) || 0) + 1)
      }
    })
  })

  return Array.from(tagCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([tag]) => tag)
}

/**
 * Get related tags based on co-occurrence
 */
export function getRelatedTags(tag: string, limit: number = 10): string[] {
  const posts = getBlogPosts()
  const normalizedTag = tag.trim().toLowerCase()
  const relatedTagCounts = new Map<string, number>()

  posts.forEach((post) => {
    const postTags = post.tags?.map((t) => t.trim().toLowerCase()) || []
    if (postTags.includes(normalizedTag)) {
      postTags.forEach((t) => {
        if (t !== normalizedTag) {
          relatedTagCounts.set(t, (relatedTagCounts.get(t) || 0) + 1)
        }
      })
    }
  })

  return Array.from(relatedTagCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([tag]) => tag)
}

