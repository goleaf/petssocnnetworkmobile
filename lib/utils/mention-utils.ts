/**
 * Utility functions for handling @mentions in text
 */

export interface MentionPart {
  type: "text" | "mention"
  content: string
  username?: string
  index?: number
}

/**
 * Parse text and split into parts with mentions identified
 * Returns array of parts that can be rendered as text or links
 */
export function parseMentions(text: string): MentionPart[] {
  if (!text) return []

  // Regex to match @username (alphanumeric, underscore, hyphen)
  const mentionRegex = /@([a-zA-Z0-9_-]+)/g
  const parts: MentionPart[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = mentionRegex.exec(text)) !== null) {
    // Add text before mention
    if (match.index > lastIndex) {
      parts.push({
        type: "text",
        content: text.substring(lastIndex, match.index),
      })
    }

    // Add mention
    const username = match[1]
    parts.push({
      type: "mention",
      content: `@${username}`,
      username,
      index: match.index,
    })

    lastIndex = match.index + match[0].length
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push({
      type: "text",
      content: text.substring(lastIndex),
    })
  }

  return parts.length > 0 ? parts : [{ type: "text", content: text }]
}

/**
 * Extract all mentions from text
 * Returns array of usernames (without @)
 */
export function extractMentions(text: string): string[] {
  if (!text) return []

  const mentionRegex = /@([a-zA-Z0-9_-]+)/g
  const mentions: string[] = []
  let match: RegExpExecArray | null

  while ((match = mentionRegex.exec(text)) !== null) {
    mentions.push(match[1])
  }

  return mentions
}

/**
 * Check if text contains any mentions
 */
export function hasMentions(text: string): boolean {
  if (!text) return false
  return /@([a-zA-Z0-9_-]+)/.test(text)
}

/**
 * Count the number of mentions in text
 */
export function countMentions(text: string): number {
  return extractMentions(text).length
}

/**
 * Validate mention format
 */
export function isValidMention(mention: string): boolean {
  // Remove @ if present
  const username = mention.startsWith("@") ? mention.substring(1) : mention
  // Username should be 3-20 chars, alphanumeric with underscore/hyphen
  return /^[a-zA-Z0-9_-]{3,20}$/.test(username)
}
