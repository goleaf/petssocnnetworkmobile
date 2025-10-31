import { formatDistanceToNow } from "date-fns"

/**
 * Formats a date to YYYY-MM-DD format
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

/**
 * Formats a date in human-readable format (e.g., "2 hours ago")
 * Falls back to YYYY-MM-DD format for dates older than 30 days
 */
export function formatCommentDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const daysDiff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

  // If less than 30 days, show relative time
  if (daysDiff < 30) {
    return formatDistanceToNow(date, { addSuffix: true })
  }

  // Otherwise, show YYYY-MM-DD format
  return formatDate(dateString)
}

/**
 * Formats a date to YYYY-MM-DD HH:MM:SS format (for timestamps)
 */
export function formatDateTime(dateString: string): string {
  const date = new Date(dateString)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  const hours = String(date.getHours()).padStart(2, "0")
  const minutes = String(date.getMinutes()).padStart(2, "0")
  const seconds = String(date.getSeconds()).padStart(2, "0")
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}
