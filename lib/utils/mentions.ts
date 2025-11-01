/**
 * Extract mention usernames from text content
 * Matches @username patterns
 * @param text - The text to extract mentions from
 * @returns Array of unique usernames (without @ prefix)
 */
export function extractMentions(text: string): string[] {
  if (!text || typeof text !== "string") return []

  // Match @username patterns
  // Username can contain letters, numbers, underscores, hyphens, and dots
  // Must start with a letter or underscore after @
  // Must be word-boundary aware (not part of email addresses, etc.)
  const mentionRegex = /@([a-zA-Z_][a-zA-Z0-9_.-]*)/g
  const matches = text.matchAll(mentionRegex)
  const usernames = new Set<string>()

  for (const match of matches) {
    const username = match[1]
    if (username) {
      usernames.add(username)
    }
  }

  return Array.from(usernames)
}

