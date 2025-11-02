/**
 * Mention Parsing and Processing Utilities
 * 
 * Functions for parsing @mentions from text and handling mention notifications
 */

import type { Mention } from "../types/discussion"
import { createMentionNotification } from "../notifications"

const MENTION_PATTERN = /@(\w+)/g

export interface ParsedMention {
  username: string
  startIndex: number
  endIndex: number
}

/**
 * Parse @mentions from text
 */
export function parseMentions(text: string): ParsedMention[] {
  const mentions: ParsedMention[] = []
  let match

  while ((match = MENTION_PATTERN.exec(text)) !== null) {
    mentions.push({
      username: match[1],
      startIndex: match.index,
      endIndex: match.index + match[0].length,
    })
  }

  return mentions
}

/**
 * Create Mention objects from parsed mentions
 */
export function createMentions(
  parsedMentions: ParsedMention[],
  userIdMap: Record<string, string> // username -> userId mapping
): Mention[] {
  return parsedMentions
    .filter((mention) => userIdMap[mention.username])
    .map((mention, index) => ({
      id: `mention-${Date.now()}-${index}`,
      userId: userIdMap[mention.username],
      username: mention.username,
      startIndex: mention.startIndex,
      endIndex: mention.endIndex,
      notified: false,
    }))
}

/**
 * Replace @mentions in text with links or styled spans
 */
export function renderMentions(
  text: string,
  mentions: ParsedMention[],
  renderFn?: (username: string, mention: ParsedMention) => string
): string {
  if (!mentions.length) return text

  // Sort mentions by start index in reverse order to avoid index shifting
  const sortedMentions = [...mentions].sort((a, b) => b.startIndex - a.startIndex)

  let result = text
  for (const mention of sortedMentions) {
    const before = result.substring(0, mention.startIndex)
    const mentionText = result.substring(mention.startIndex, mention.endIndex)
    const after = result.substring(mention.endIndex)

    const rendered = renderFn
      ? renderFn(mention.username, mention)
      : `<span class="mention">${mentionText}</span>`

    result = before + rendered + after
  }

  return result
}

/**
 * Send notifications for mentions
 */
export async function notifyMentions(
  mentions: Mention[],
  context: {
    targetId: string
    targetType: "post" | "wiki" | "comment" | "rfc"
    actorId: string
    content?: string
  }
): Promise<void> {
  for (const mention of mentions) {
    if (!mention.notified) {
      await createMentionNotification({
        userId: mention.userId,
        actorId: context.actorId,
        targetId: context.targetId,
        targetType: context.targetType,
        content: context.content,
      })

      mention.notified = true
      mention.notifiedAt = new Date().toISOString()
    }
  }
}

/**
 * Extract unique usernames from text
 */
export function extractUsernames(text: string): string[] {
  const mentions = parseMentions(text)
  const usernames = new Set(mentions.map((m) => m.username))
  return Array.from(usernames)
}

/**
 * Extract unique usernames from text (alias for extractUsernames)
 */
export const extractMentions = extractUsernames

/**
 * Validate if a username exists (would need user lookup)
 */
export function validateUsernames(
  usernames: string[],
  validUsernames: string[]
): { valid: string[]; invalid: string[] } {
  const valid: string[] = []
  const invalid: string[] = []

  for (const username of usernames) {
    if (validUsernames.includes(username)) {
      valid.push(username)
    } else {
      invalid.push(username)
    }
  }

  return { valid, invalid }
}
