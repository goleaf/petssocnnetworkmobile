"use client"

interface RateLimitConfig {
  maxAttempts: number
  windowMs: number
  blockDurationMs?: number
}

interface RateLimitEntry {
  count: number
  firstAttempt: number
  blockedUntil?: number
}

const rateLimits = new Map<string, RateLimitEntry>()

export function checkRateLimit(key: string, config: RateLimitConfig): { allowed: boolean; retryAfter?: number } {
  const now = Date.now()
  const entry = rateLimits.get(key)

  // Check if currently blocked
  if (entry?.blockedUntil && entry.blockedUntil > now) {
    return {
      allowed: false,
      retryAfter: Math.ceil((entry.blockedUntil - now) / 1000),
    }
  }

  // Clean up old entry or create new one
  if (!entry || now - entry.firstAttempt > config.windowMs) {
    rateLimits.set(key, {
      count: 1,
      firstAttempt: now,
    })
    return { allowed: true }
  }

  // Increment count
  entry.count++

  // Check if limit exceeded
  if (entry.count > config.maxAttempts) {
    const blockDuration = config.blockDurationMs || config.windowMs * 2
    entry.blockedUntil = now + blockDuration
    rateLimits.set(key, entry)
    return {
      allowed: false,
      retryAfter: Math.ceil(blockDuration / 1000),
    }
  }

  rateLimits.set(key, entry)
  return { allowed: true }
}

// Predefined rate limit configs
export const RATE_LIMITS = {
  POST_CREATE: { maxAttempts: 5, windowMs: 60000, blockDurationMs: 300000 }, // 5 posts per minute, block 5 min
  COMMENT_CREATE: { maxAttempts: 10, windowMs: 60000, blockDurationMs: 180000 }, // 10 comments per minute
  FOLLOW_ACTION: { maxAttempts: 20, windowMs: 60000, blockDurationMs: 120000 }, // 20 follows per minute
  LIKE_ACTION: { maxAttempts: 30, windowMs: 60000 }, // 30 likes per minute
  SEARCH_QUERY: { maxAttempts: 30, windowMs: 60000 }, // 30 searches per minute
  LOGIN_ATTEMPT: { maxAttempts: 5, windowMs: 300000, blockDurationMs: 900000 }, // 5 attempts per 5 min, block 15 min
  PROFILE_UPDATE: { maxAttempts: 3, windowMs: 60000, blockDurationMs: 300000 }, // 3 updates per minute
}

export function getRateLimitKey(userId: string, action: string): string {
  return `${userId}:${action}`
}
