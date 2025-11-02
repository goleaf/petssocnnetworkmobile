/**
 * Series Storage Functions
 * 
 * Manages blog series (multi-part guides) in localStorage
 */

import type { BlogSeries } from "@/lib/types"
import { readData, writeData, generateStorageId } from "./storage"

const STORAGE_KEY = "pet_social_blog_series"

/**
 * Get all series
 */
export function getAllSeries(): BlogSeries[] {
  return readData<BlogSeries[]>(STORAGE_KEY, [])
}

/**
 * Get series by ID
 */
export function getSeriesById(seriesId: string): BlogSeries | null {
  const allSeries = getAllSeries()
  return allSeries.find((s) => s.id === seriesId) || null
}

/**
 * Get series by author ID
 */
export function getSeriesByAuthorId(authorId: string): BlogSeries[] {
  const allSeries = getAllSeries()
  return allSeries.filter((s) => s.authorId === authorId)
}

/**
 * Create a new series
 */
export function createSeries(data: {
  title: string
  description?: string
  authorId: string
  slug?: string
  coverImage?: string
}): BlogSeries {
  const allSeries = getAllSeries()
  
  // Generate slug if not provided
  let slug = data.slug
  if (!slug) {
    slug = data.title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .substring(0, 100)
    
    // Check for collisions
    let counter = 1
    let finalSlug = slug
    while (allSeries.some((s) => s.slug === finalSlug)) {
      finalSlug = `${slug}-${counter}`
      counter++
    }
    slug = finalSlug
  }
  
  const newSeries: BlogSeries = {
    id: generateStorageId("series"),
    title: data.title,
    description: data.description,
    authorId: data.authorId,
    slug,
    posts: [],
    coverImage: data.coverImage,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  
  allSeries.push(newSeries)
  writeData(STORAGE_KEY, allSeries)
  
  return newSeries
}

/**
 * Update a series
 */
export function updateSeries(seriesId: string, updates: Partial<BlogSeries>): BlogSeries | null {
  const allSeries = getAllSeries()
  const index = allSeries.findIndex((s) => s.id === seriesId)
  
  if (index === -1) {
    return null
  }
  
  const updatedSeries: BlogSeries = {
    ...allSeries[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  }
  
  allSeries[index] = updatedSeries
  writeData(STORAGE_KEY, allSeries)
  
  return updatedSeries
}

/**
 * Add a post to a series
 */
export function addPostToSeries(seriesId: string, postId: string): BlogSeries | null {
  const series = getSeriesById(seriesId)
  if (!series) {
    return null
  }
  
  // Don't add if already in series
  if (series.posts.includes(postId)) {
    return series
  }
  
  return updateSeries(seriesId, {
    posts: [...series.posts, postId],
  })
}

/**
 * Remove a post from a series
 */
export function removePostFromSeries(seriesId: string, postId: string): BlogSeries | null {
  const series = getSeriesById(seriesId)
  if (!series) {
    return null
  }
  
  return updateSeries(seriesId, {
    posts: series.posts.filter((id) => id !== postId),
  })
}

/**
 * Reorder posts in a series
 */
export function reorderSeriesPosts(seriesId: string, postIds: string[]): BlogSeries | null {
  return updateSeries(seriesId, {
    posts: postIds,
  })
}

/**
 * Delete a series
 */
export function deleteSeries(seriesId: string): boolean {
  const allSeries = getAllSeries()
  const filtered = allSeries.filter((s) => s.id !== seriesId)
  
  if (filtered.length === allSeries.length) {
    return false // Series not found
  }
  
  writeData(STORAGE_KEY, filtered)
  return true
}

