/**
 * Utility functions for formatting rate limit error messages
 */

/**
 * Format milliseconds into a human-readable time string
 * @param ms - Milliseconds to format
 * @returns Formatted time string (e.g., "5 minutes", "2 hours")
 */
export function formatRetryAfter(ms: number): string {
  const totalSeconds = Math.ceil(ms / 1000)
  const totalMinutes = Math.ceil(ms / 60000)
  const totalHours = Math.ceil(ms / 3600000)

  // Use hours if >= 1 hour
  if (ms >= 3600000) {
    return `${totalHours} hour${totalHours > 1 ? 's' : ''}`
  }
  // Use minutes if >= 1 minute
  if (ms >= 60000) {
    return `${totalMinutes} minute${totalMinutes > 1 ? 's' : ''}`
  }
  // Otherwise use seconds
  return `${totalSeconds} second${totalSeconds > 1 ? 's' : ''}`
}

/**
 * Generate a user-friendly error message for rate limit exceeded
 * @param retryAfterMs - Milliseconds until the user can retry
 * @param isHourly - Whether this is an hourly limit (true) or daily limit (false)
 * @returns Formatted error message
 */
export function getRateLimitErrorMessage(retryAfterMs: number, isHourly: boolean = true): string {
  const timeString = formatRetryAfter(retryAfterMs)
  const limitType = isHourly ? 'hourly' : 'daily'
  const limitCount = isHourly ? '10' : '50'
  
  return `You have exceeded the ${limitType} edit limit of ${limitCount} edits. Please try again in ${timeString}.`
}

/**
 * Create a structured error response for API routes
 * @param retryAfterMs - Milliseconds until the user can retry
 * @param isHourly - Whether this is an hourly limit (true) or daily limit (false)
 * @returns Error response object
 */
export interface RateLimitErrorResponse {
  error: string
  code: string
  retryAfterMs: number
  retryAfter: string
}

export function createRateLimitErrorResponse(
  retryAfterMs: number,
  isHourly: boolean = true
): RateLimitErrorResponse {
  return {
    error: getRateLimitErrorMessage(retryAfterMs, isHourly),
    code: 'RATE_LIMIT_EXCEEDED',
    retryAfterMs,
    retryAfter: formatRetryAfter(retryAfterMs),
  }
}
