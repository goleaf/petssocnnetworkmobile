import type { BlogPost } from "@/lib/types"
import { generateStorageId } from "@/lib/storage"

export interface Series {
  id: string
  title: string
  description?: string
  posts: SeriesPost[]
  authorId: string
  createdAt: string
  updatedAt: string
}

export interface SeriesPost {
  postId: string
  title: string
  slug: string
  order: number
  publishedAt: string
  isPublished: boolean
}

/**
 * Create a new series
 */
export function createSeries(data: {
  title: string
  description?: string
  authorId: string
}): Series {
  return {
    id: generateStorageId("series"),
    title: data.title,
    description: data.description,
    authorId: data.authorId,
    posts: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

/**
 * Add a post to a series
 */
export function addPostToSeries(
  series: Series,
  post: BlogPost,
  order: number
): Series {
  const existingPostIndex = series.posts.findIndex((p) => p.postId === post.id)
  
  const seriesPost: SeriesPost = {
    postId: post.id,
    title: post.title,
    slug: post.slug || post.id,
    order,
    publishedAt: post.createdAt,
    isPublished: !post.isDraft,
  }
  
  if (existingPostIndex >= 0) {
    // Update existing post in series
    series.posts[existingPostIndex] = seriesPost
  } else {
    // Add new post to series
    series.posts.push(seriesPost)
  }
  
  // Sort posts by order
  series.posts.sort((a, b) => a.order - b.order)
  
  return {
    ...series,
    updatedAt: new Date().toISOString(),
  }
}

/**
 * Remove a post from a series
 */
export function removePostFromSeries(series: Series, postId: string): Series {
  return {
    ...series,
    posts: series.posts.filter((p) => p.postId !== postId),
    updatedAt: new Date().toISOString(),
  }
}

/**
 * Get series for a post
 */
export function getSeriesForPost(
  seriesList: Series[],
  postId: string
): Series | null {
  return seriesList.find((series) =>
    series.posts.some((p) => p.postId === postId)
  ) || null
}

/**
 * Get all posts in a series (sorted by order)
 */
export function getSeriesPosts(series: Series): SeriesPost[] {
  return [...series.posts].sort((a, b) => a.order - b.order)
}

