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
  // Negative lookbehind to avoid matching @ in email addresses
  // Pattern: @username must be preceded by whitespace or start of string
  // and must not be followed by @ (which would indicate an email)
  const mentionRegex = /(?<![a-zA-Z0-9_.-]@)@([a-zA-Z_][a-zA-Z0-9_.-]*)(?!@)/g
  const matches = text.matchAll(mentionRegex)
  const usernames = new Set<string>()

  for (const match of matches) {
    const username = match[1]
    const fullMatch = match[0]
    const matchIndex = match.index ?? 0
    
    // Check if this is part of an email address
    // An email has the pattern: something@domain
    // So if there's a word character before @, it's likely an email
    if (matchIndex > 0) {
      const beforeAt = text.substring(Math.max(0, matchIndex - 50), matchIndex)
      // If there's a word character immediately before @, skip (it's an email)
      const lastChar = beforeAt[beforeAt.length - 1]
      if (lastChar && /[a-zA-Z0-9_.-]/.test(lastChar)) {
        continue
      }
    }
    
    if (username) {
      usernames.add(username)
    }
  }

  return Array.from(usernames)
}

