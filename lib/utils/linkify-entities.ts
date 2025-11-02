import { extractMentions } from "./mentions"
import { findWikiTermsInText } from "./wiki-linking"
import { getUserByUsername } from "@/lib/storage"

export type EntityType = "mention" | "hashtag" | "wiki"

export interface EntityRange {
  startIndex: number
  endIndex: number
  entityId: string
  type: EntityType
  text: string
}

export interface LinkifyEntitiesResult {
  ranges: EntityRange[]
}

/**
 * Extracts all entities (mentions, hashtags, wiki terms) from text and returns their ranges
 * @param text - The text to extract entities from
 * @returns Object with ranges array containing entity positions, IDs, and types
 */
export function linkifyEntities(text: string): LinkifyEntitiesResult {
  if (!text || typeof text !== "string") {
    return { ranges: [] }
  }

  const ranges: EntityRange[] = []

  // Extract mentions (@username)
  const mentionRegex = /(?<![a-zA-Z0-9_.-]@)@([a-zA-Z_][a-zA-Z0-9_.-]*)(?!@)/g
  let mentionMatch: RegExpExecArray | null
  while ((mentionMatch = mentionRegex.exec(text)) !== null) {
    const username = mentionMatch[1]
    const matchIndex = mentionMatch.index ?? 0
    const fullMatch = mentionMatch[0]

    // Check if this is part of an email address
    if (matchIndex > 0) {
      const beforeAt = text.substring(Math.max(0, matchIndex - 50), matchIndex)
      const lastChar = beforeAt[beforeAt.length - 1]
      if (lastChar && /[a-zA-Z0-9_.-]/.test(lastChar)) {
        continue // Skip, it's an email
      }
    }

    // Get user ID from username (or use username as entityId if not found)
    const user = getUserByUsername(username)
    const entityId = user?.id || username

    ranges.push({
      startIndex: matchIndex,
      endIndex: matchIndex + fullMatch.length,
      entityId,
      type: "mention",
      text: fullMatch,
    })
  }

  // Extract hashtags (#tag)
  const hashtagRegex = /#([a-zA-Z0-9_]+)/g
  let hashtagMatch: RegExpExecArray | null
  while ((hashtagMatch = hashtagRegex.exec(text)) !== null) {
    const tag = hashtagMatch[1]
    const matchIndex = hashtagMatch.index ?? 0
    const fullMatch = hashtagMatch[0]

    ranges.push({
      startIndex: matchIndex,
      endIndex: matchIndex + fullMatch.length,
      entityId: tag.toLowerCase(), // Use lowercase for hashtag ID
      type: "hashtag",
      text: fullMatch,
    })
  }

  // Extract wiki terms
  const wikiMatches = findWikiTermsInText(text)
  wikiMatches.forEach((match) => {
    ranges.push({
      startIndex: match.startIndex,
      endIndex: match.endIndex,
      entityId: match.article.id,
      type: "wiki",
      text: match.term,
    })
  })

  // Sort ranges by start index, and remove overlaps (prioritize longer matches)
  const sortedRanges = ranges.sort((a, b) => {
    if (a.startIndex !== b.startIndex) {
      return a.startIndex - b.startIndex
    }
    // If same start, prioritize longer matches
    return b.endIndex - a.endIndex
  })

  // Remove overlapping ranges (keep first/longest)
  const nonOverlappingRanges: EntityRange[] = []
  for (const range of sortedRanges) {
    const overlaps = nonOverlappingRanges.some(
      (existing) =>
        (range.startIndex >= existing.startIndex && range.startIndex < existing.endIndex) ||
        (range.endIndex > existing.startIndex && range.endIndex <= existing.endIndex) ||
        (range.startIndex <= existing.startIndex && range.endIndex >= existing.endIndex)
    )

    if (!overlaps) {
      nonOverlappingRanges.push(range)
    }
  }

  // Sort final result by start index
  nonOverlappingRanges.sort((a, b) => a.startIndex - b.startIndex)

  return { ranges: nonOverlappingRanges }
}

