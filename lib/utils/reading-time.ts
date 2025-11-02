/**
 * Calculate reading time in minutes based on text content
 * Average reading speed: 200-250 words per minute
 * We use 225 words/minute as a reasonable average
 */
export function calculateReadingTime(content: string): number {
  if (!content) return 0

  // Remove HTML tags and markdown syntax for accurate word count
  const plainText = content
    .replace(/<[^>]*>/g, " ") // Remove HTML tags
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1") // Convert markdown links to text
    .replace(/[#*`_~]/g, " ") // Remove markdown formatting
    .replace(/\s+/g, " ") // Normalize whitespace
    .trim()

  const words = plainText.split(/\s+/).filter((word) => word.length > 0)
  const wordCount = words.length

  // Reading speed: 225 words per minute
  const readingSpeed = 225
  const minutes = Math.ceil(wordCount / readingSpeed)

  return Math.max(1, minutes) // At least 1 minute
}

/**
 * Format reading time as a human-readable string
 */
export function formatReadingTime(minutes: number): string {
  if (minutes === 1) return "1 min read"
  return `${minutes} min read`
}

