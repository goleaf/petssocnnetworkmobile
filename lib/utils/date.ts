import { differenceInYears, formatDistanceToNow, isValid, parseISO } from "date-fns"

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
 * Note: This function should only be used on the client side to avoid hydration mismatches
 */
export function formatCommentDate(dateString: string, referenceDate?: Date): string {
  const date = new Date(dateString)
  // Use provided reference date or current time (only on client to avoid hydration mismatch)
  const now = referenceDate || (typeof window !== 'undefined' ? new Date() : new Date(0))
  const daysDiff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

  // If less than 30 days, show relative time
  if (daysDiff < 30 && typeof window !== 'undefined') {
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

/**
 * Calculates the age in whole years based on a birthday string.
 * Returns undefined when the input is missing or invalid.
 */
export function calculateAge(birthday: string | undefined, referenceDate: Date = new Date()): number | undefined {
  if (!birthday) {
    return undefined
  }

  let parsedBirthday: Date
  try {
    parsedBirthday = parseISO(birthday)
  } catch {
    parsedBirthday = new Date(birthday)
  }
  if (!isValid(parsedBirthday)) {
    return undefined
  }

  const safeReferenceDate = isValid(referenceDate) ? referenceDate : new Date()
  const rawAge = differenceInYears(safeReferenceDate, parsedBirthday)

  return rawAge < 0 ? 0 : rawAge
}
