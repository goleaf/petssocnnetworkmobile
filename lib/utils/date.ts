import { formatDistanceToNow } from "date-fns"

/**
 * Formats a date in human-readable format (e.g., "2 hours ago")
 * Falls back to European format (DD/MM/YYYY) for dates older than 30 days
 */
export function formatCommentDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const daysDiff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

  // If less than 30 days, show relative time
  if (daysDiff < 30) {
    return formatDistanceToNow(date, { addSuffix: true })
  }

  // Otherwise, show European format (DD/MM/YYYY)
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
  })
}

