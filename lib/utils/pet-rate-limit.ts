/**
 * Rate Limiting for Pet API Endpoints
 * Requirements: 7.6, 8.8
 */

interface RateLimitEntry {
  count: number
  windowStart: number
}

// Separate rate limit stores for different operations
const uploadRateLimit = new Map<string, RateLimitEntry>()
const updateRateLimit = new Map<string, RateLimitEntry>()

// Rate limit configurations
export const UPLOAD_RATE_LIMIT_MAX = 10 // 10 requests per minute
export const UPLOAD_RATE_LIMIT_WINDOW_MS = 60 * 1000 // 1 minute

export const UPDATE_RATE_LIMIT_MAX = 20 // 20 requests per minute
export const UPDATE_RATE_LIMIT_WINDOW_MS = 60 * 1000 // 1 minute

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  retryAfterMs: number
}

function getEntry(
  store: Map<string, RateLimitEntry>,
  key: string,
  windowMs: number
): RateLimitEntry | undefined {
  const entry = store.get(key)
  if (!entry) return undefined

  // Check if window has expired
  if (Date.now() - entry.windowStart >= windowMs) {
    store.delete(key)
    return undefined
  }

  return entry
}

function checkRateLimit(
  store: Map<string, RateLimitEntry>,
  key: string,
  maxAttempts: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now()
  const entry = getEntry(store, key, windowMs)

  if (!entry) {
    // First request in window
    store.set(key, { count: 1, windowStart: now })
    return {
      allowed: true,
      remaining: maxAttempts - 1,
      retryAfterMs: windowMs,
    }
  }

  entry.count += 1
  store.set(key, entry)

  if (entry.count > maxAttempts) {
    const retryAfterMs = entry.windowStart + windowMs - now
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs,
    }
  }

  return {
    allowed: true,
    remaining: Math.max(0, maxAttempts - entry.count),
    retryAfterMs: entry.windowStart + windowMs - now,
  }
}

/**
 * Check rate limit for photo uploads
 * 10 requests per minute
 */
export function checkUploadRateLimit(userId: string): RateLimitResult {
  return checkRateLimit(
    uploadRateLimit,
    userId,
    UPLOAD_RATE_LIMIT_MAX,
    UPLOAD_RATE_LIMIT_WINDOW_MS
  )
}

/**
 * Check rate limit for pet updates
 * 20 requests per minute
 */
export function checkUpdateRateLimit(userId: string): RateLimitResult {
  return checkRateLimit(
    updateRateLimit,
    userId,
    UPDATE_RATE_LIMIT_MAX,
    UPDATE_RATE_LIMIT_WINDOW_MS
  )
}

/**
 * Reset all rate limits (for testing)
 */
export function resetRateLimits(): void {
  uploadRateLimit.clear()
  updateRateLimit.clear()
}
