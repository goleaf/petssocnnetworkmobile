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
