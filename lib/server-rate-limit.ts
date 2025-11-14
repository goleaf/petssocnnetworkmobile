interface IpRateLimitEntry {
  count: number
  windowStart: number
}

const registrationRateLimit = new Map<string, IpRateLimitEntry>()

export const REGISTRATION_RATE_LIMIT_MAX_ATTEMPTS = 5
export const REGISTRATION_RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000 // 1 hour

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  retryAfterMs: number
}

function getEntry(key: string): IpRateLimitEntry | undefined {
  const entry = registrationRateLimit.get(key)
  if (!entry) return undefined
  if (Date.now() - entry.windowStart >= REGISTRATION_RATE_LIMIT_WINDOW_MS) {
    registrationRateLimit.delete(key)
    return undefined
  }
  return entry
}

export function incrementRegistrationAttempts(key: string): RateLimitResult {
  const now = Date.now()
  const entry = getEntry(key)
  if (!entry) {
    registrationRateLimit.set(key, { count: 1, windowStart: now })
    return {
      allowed: true,
      remaining: REGISTRATION_RATE_LIMIT_MAX_ATTEMPTS - 1,
      retryAfterMs: REGISTRATION_RATE_LIMIT_WINDOW_MS,
    }
  }

  entry.count += 1
  registrationRateLimit.set(key, entry)

  if (entry.count > REGISTRATION_RATE_LIMIT_MAX_ATTEMPTS) {
    const retryAfterMs = entry.windowStart + REGISTRATION_RATE_LIMIT_WINDOW_MS - now
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs,
    }
  }

  return {
    allowed: true,
    remaining: Math.max(0, REGISTRATION_RATE_LIMIT_MAX_ATTEMPTS - entry.count),
    retryAfterMs: entry.windowStart + REGISTRATION_RATE_LIMIT_WINDOW_MS - now,
  }
}

export function resetRegistrationRateLimit() {
  registrationRateLimit.clear()
}

// Edit submission rate limiting
const editSubmissionRateLimit = new Map<string, IpRateLimitEntry>()
const editSubmissionDailyRateLimit = new Map<string, IpRateLimitEntry>()

export const EDIT_SUBMISSION_HOURLY_LIMIT = 10
export const EDIT_SUBMISSION_DAILY_LIMIT = 50
export const EDIT_SUBMISSION_HOURLY_WINDOW_MS = 60 * 60 * 1000 // 1 hour
export const EDIT_SUBMISSION_DAILY_WINDOW_MS = 24 * 60 * 60 * 1000 // 24 hours

function getEditEntry(key: string, isDaily: boolean): IpRateLimitEntry | undefined {
  const map = isDaily ? editSubmissionDailyRateLimit : editSubmissionRateLimit
  const windowMs = isDaily ? EDIT_SUBMISSION_DAILY_WINDOW_MS : EDIT_SUBMISSION_HOURLY_WINDOW_MS
  
  const entry = map.get(key)
  if (!entry) return undefined
  if (Date.now() - entry.windowStart >= windowMs) {
    map.delete(key)
    return undefined
  }
  return entry
}

/**
 * Check and increment edit submission rate limit for a user
 * Enforces both hourly (10 edits) and daily (50 edits) limits
 * 
 * @param userId - User ID to check rate limit for
 * @returns Rate limit result with allowed status and retry information
 */
export function checkEditSubmissionRateLimit(userId: string): RateLimitResult {
  const now = Date.now()
  
  // Check hourly limit
  const hourlyEntry = getEditEntry(userId, false)
  if (!hourlyEntry) {
    editSubmissionRateLimit.set(userId, { count: 1, windowStart: now })
  } else {
    hourlyEntry.count += 1
    editSubmissionRateLimit.set(userId, hourlyEntry)
    
    if (hourlyEntry.count > EDIT_SUBMISSION_HOURLY_LIMIT) {
      const retryAfterMs = hourlyEntry.windowStart + EDIT_SUBMISSION_HOURLY_WINDOW_MS - now
      return {
        allowed: false,
        remaining: 0,
        retryAfterMs,
      }
    }
  }
  
  // Check daily limit
  const dailyEntry = getEditEntry(userId, true)
  if (!dailyEntry) {
    editSubmissionDailyRateLimit.set(userId, { count: 1, windowStart: now })
  } else {
    dailyEntry.count += 1
    editSubmissionDailyRateLimit.set(userId, dailyEntry)
    
    if (dailyEntry.count > EDIT_SUBMISSION_DAILY_LIMIT) {
      const retryAfterMs = dailyEntry.windowStart + EDIT_SUBMISSION_DAILY_WINDOW_MS - now
      return {
        allowed: false,
        remaining: 0,
        retryAfterMs,
      }
    }
  }
  
  // Calculate remaining from both limits
  const hourlyRemaining = Math.max(0, EDIT_SUBMISSION_HOURLY_LIMIT - (hourlyEntry?.count || 1))
  const dailyRemaining = Math.max(0, EDIT_SUBMISSION_DAILY_LIMIT - (dailyEntry?.count || 1))
  const remaining = Math.min(hourlyRemaining, dailyRemaining)
  
  const hourlyRetryAfter = (hourlyEntry?.windowStart || now) + EDIT_SUBMISSION_HOURLY_WINDOW_MS - now
  const dailyRetryAfter = (dailyEntry?.windowStart || now) + EDIT_SUBMISSION_DAILY_WINDOW_MS - now
  const retryAfterMs = Math.min(hourlyRetryAfter, dailyRetryAfter)
  
  return {
    allowed: true,
    remaining,
    retryAfterMs,
  }
}

/**
 * Reset edit submission rate limits (for testing)
 */
export function resetEditSubmissionRateLimit() {
  editSubmissionRateLimit.clear()
  editSubmissionDailyRateLimit.clear()
}
