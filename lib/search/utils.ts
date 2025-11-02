/**
 * Search utility functions for ranking, filtering, and relevance scoring
 */

import type {
  SearchResult,
  SearchFilters,
  SearchCategory,
} from "@/lib/types/search"

/**
 * Calculate distance between two coordinates (Haversine formula)
 * Returns distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371 // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1)
  const dLng = toRadians(lng2 - lng1)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180)
}

/**
 * Calculate relevance score for a search result
 */
export function calculateRelevance(
  result: SearchResult,
  query: string,
  filters?: SearchFilters
): number {
  let score = result.relevance || 0
  const queryLower = query.toLowerCase()
  const titleLower = result.title.toLowerCase()
  const descriptionLower = result.description?.toLowerCase() || ""

  // Title match boost
  if (titleLower.includes(queryLower)) {
    score += 10
    if (titleLower.startsWith(queryLower)) {
      score += 5 // Exact start match
    }
  }

  // Description match boost
  if (descriptionLower.includes(queryLower)) {
    score += 5
  }

  // Snippet match boost
  if (result.snippet?.toLowerCase().includes(queryLower)) {
    score += 3
  }

  // Verified boost
  if (result.verified) {
    score += 2
  }

  // Category match boost
  if (filters?.category && result.category === filters.category) {
    score += 3
  }

  // Location proximity boost (if "near me" is used)
  if (filters?.location && result.location) {
    const distance = calculateDistance(
      filters.location.lat,
      filters.location.lng,
      result.location.lat,
      result.location.lng
    )

    if (distance <= (filters.location.radius || 10)) {
      // Closer results get higher scores
      score += Math.max(0, 10 - distance)
    }
  }

  return Math.min(100, score) // Cap at 100
}

/**
 * Filter search results based on filters
 */
export function filterResults(
  results: SearchResult[],
  filters: SearchFilters
): SearchResult[] {
  return results.filter((result) => {
    // Category filter
    if (filters.category && filters.category !== "all") {
      if (result.category !== filters.category) {
        return false
      }
    }

    // Species filter
    if (filters.species && filters.species.length > 0) {
      const resultSpecies = result.metadata?.species as string[] | undefined
      if (!resultSpecies || !filters.species.some((s) => resultSpecies.includes(s))) {
        return false
      }
    }

    // Topic filter
    if (filters.topic && filters.topic.length > 0) {
      const resultTopics = result.metadata?.topics as string[] | undefined
      if (!resultTopics || !filters.topic.some((t) => resultTopics.includes(t))) {
        return false
      }
    }

    // Verified filter
    if (filters.verified !== undefined) {
      if (result.verified !== filters.verified) {
        return false
      }
    }

    // Tags filter
    if (filters.tags && filters.tags.length > 0) {
      const resultTags = result.metadata?.tags as string[] | undefined
      if (!resultTags || !filters.tags.some((t) => resultTags.includes(t))) {
        return false
      }
    }

    // Location filter (near me)
    if (filters.location && result.location) {
      const distance = calculateDistance(
        filters.location.lat,
        filters.location.lng,
        result.location.lat,
        result.location.lng
      )

      const radius = filters.location.radius || 10 // Default 10km
      if (distance > radius) {
        return false
      }

      // Update distance in result
      result.location.distance = Math.round(distance * 10) / 10
    }

    return true
  })
}

/**
 * Sort results by relevance (descending)
 */
export function sortByRelevance(results: SearchResult[]): SearchResult[] {
  return [...results].sort((a, b) => b.relevance - a.relevance)
}

/**
 * Highlight search terms in text
 */
export function highlightTerms(text: string, query: string): string {
  const queryLower = query.toLowerCase()
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi")
  return text.replace(regex, "<mark>$1</mark>")
}

/**
 * Extract location from browser (privacy-aware)
 */
export function getCurrentLocation(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by your browser"))
      return
    }

    navigator.geolocation.getCurrentPosition(
      resolve,
      reject,
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000, // Cache for 1 minute
      }
    )
  })
}

/**
 * Format distance for display
 */
export function formatDistance(distance?: number): string {
  if (!distance) return ""
  if (distance < 1) {
    return `${Math.round(distance * 1000)}m`
  }
  return `${distance.toFixed(1)}km`
}

