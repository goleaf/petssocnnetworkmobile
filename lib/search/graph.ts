/**
 * Graph signals system for finding related pages
 * Uses connections between entities (categories, tags, locations, breeds, etc.)
 */

import type { GraphSignal, RelatedPage, SearchResult, SearchCategory } from "@/lib/types/search"

/**
 * Calculate graph signals between two items
 */
export function calculateGraphSignals(
  sourceId: string,
  sourceCategory: SearchCategory,
  sourceMetadata: Record<string, unknown>,
  targetId: string,
  targetCategory: SearchCategory,
  targetMetadata: Record<string, unknown>
): GraphSignal[] {
  const signals: GraphSignal[] = []

  // Category-based signal
  if (sourceCategory === targetCategory) {
    signals.push({
      sourceId,
      targetId,
      type: "category",
      strength: 0.3,
    })
  }

  // Tag-based signals
  const sourceTags = (sourceMetadata.tags as string[] | undefined) || []
  const targetTags = (targetMetadata.tags as string[] | undefined) || []
  const commonTags = sourceTags.filter((tag) => targetTags.includes(tag))

  if (commonTags.length > 0) {
    const tagStrength = Math.min(0.8, commonTags.length * 0.2)
    signals.push({
      sourceId,
      targetId,
      type: "tag",
      strength: tagStrength,
    })
  }

  // Breed-based signals
  const sourceBreeds = (sourceMetadata.breeds as string[] | undefined) || []
  const targetBreeds = (targetMetadata.breeds as string[] | undefined) || []
  const commonBreeds = sourceBreeds.filter((breed) => targetBreeds.includes(breed))

  if (commonBreeds.length > 0) {
    signals.push({
      sourceId,
      targetId,
      type: "breed",
      strength: 0.5,
    })
  }

  // Location-based signals
  const sourceLocation = sourceMetadata.location as
    | { lat: number; lng: number }
    | undefined
  const targetLocation = targetMetadata.location as
    | { lat: number; lng: number }
    | undefined

  if (sourceLocation && targetLocation) {
    // Calculate distance (simplified - would use proper distance calculation)
    const latDiff = Math.abs(sourceLocation.lat - targetLocation.lat)
    const lngDiff = Math.abs(sourceLocation.lng - targetLocation.lng)
    const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff)

    // Closer locations have stronger signals
    const locationStrength = Math.max(0, 0.6 - distance * 10)
    if (locationStrength > 0) {
      signals.push({
        sourceId,
        targetId,
        type: "location",
        strength: locationStrength,
      })
    }
  }

  // Species-based signals
  const sourceSpecies = (sourceMetadata.species as string[] | undefined) || []
  const targetSpecies = (targetMetadata.species as string[] | undefined) || []
  const commonSpecies = sourceSpecies.filter((s) => targetSpecies.includes(s))

  if (commonSpecies.length > 0) {
    signals.push({
      sourceId,
      targetId,
      type: "category", // Using category type for species
      strength: 0.4,
    })
  }

  return signals
}

/**
 * Find related pages for a given search result
 */
export function findRelatedPages(
  currentResult: SearchResult,
  allResults: SearchResult[],
  maxResults: number = 5
): RelatedPage[] {
  const related: Array<RelatedPage & { totalStrength: number }> = []

  for (const result of allResults) {
    // Skip the current result
    if (result.id === currentResult.id) {
      continue
    }

    // Calculate graph signals
    const signals = calculateGraphSignals(
      currentResult.id,
      currentResult.category,
      currentResult.metadata || {},
      result.id,
      result.category,
      result.metadata || {}
    )

    // Sum up signal strengths
    const totalStrength = signals.reduce((sum, signal) => sum + signal.strength, 0)

    if (totalStrength > 0.2) {
      // Determine reason for relation
      const strongestSignal = signals.reduce((max, signal) =>
        signal.strength > max.strength ? signal : max
      )

      let reason = "Related content"
      switch (strongestSignal.type) {
        case "tag":
          reason = "Similar tags"
          break
        case "breed":
          reason = "Same breed"
          break
        case "location":
          reason = "Nearby location"
          break
        case "category":
          reason = "Same category"
          break
      }

      related.push({
        id: result.id,
        title: result.title,
        url: result.url,
        category: result.category,
        relevance: totalStrength,
        reason,
        totalStrength,
      })
    }
  }

  // Sort by total strength and return top results
  return related
    .sort((a, b) => b.totalStrength - a.totalStrength)
    .slice(0, maxResults)
    .map(({ totalStrength, ...rest }) => rest)
}

/**
 * Build a graph of connections from search results
 */
export function buildGraphFromResults(results: SearchResult[]): GraphSignal[] {
  const graph: GraphSignal[] = []

  for (let i = 0; i < results.length; i++) {
    for (let j = i + 1; j < results.length; j++) {
      const source = results[i]
      const target = results[j]

      const signals = calculateGraphSignals(
        source.id,
        source.category,
        source.metadata || {},
        target.id,
        target.category,
        target.metadata || {}
      )

      graph.push(...signals)
    }
  }

  return graph
}

