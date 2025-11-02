/**
 * CSRF Token utilities
 * Generates and validates CSRF tokens for admin actions
 */

function generateCSRFToken(): string {
  const array = new Uint8Array(32)
  if (typeof window !== "undefined" && window.crypto) {
    window.crypto.getRandomValues(array)
  } else {
    // Fallback for server-side or environments without crypto
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256)
    }
  }
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("")
}

const CSRF_TOKEN_KEY = "admin_csrf_token"
const CSRF_TOKEN_EXPIRY = 3600000 // 1 hour

interface CSRFTokenData {
  token: string
  expiresAt: number
}

export function getCSRFToken(): string {
  if (typeof window === "undefined") {
    // Server-side: generate a new token (in production, use session-based tokens)
    return generateCSRFToken()
  }

  const stored = localStorage.getItem(CSRF_TOKEN_KEY)
  if (stored) {
    try {
      const data = JSON.parse(stored) as CSRFTokenData
      if (data.expiresAt > Date.now()) {
        return data.token
      }
    } catch {
      // Invalid stored data, generate new token
    }
  }

  // Generate new token
  const token = generateCSRFToken()
  const data: CSRFTokenData = {
    token,
    expiresAt: Date.now() + CSRF_TOKEN_EXPIRY,
  }
  localStorage.setItem(CSRF_TOKEN_KEY, JSON.stringify(data))
  return token
}

export function validateCSRFToken(token: string): boolean {
  if (!token || token.length === 0) {
    return false
  }

  if (typeof window === "undefined") {
    // Server-side validation (in production, validate against session)
    // For now, accept tokens that match the expected format
    return token.length >= 32 && /^[a-f0-9]+$/i.test(token)
  }

  const stored = localStorage.getItem(CSRF_TOKEN_KEY)
  if (!stored) return false

  try {
    const data = JSON.parse(stored) as CSRFTokenData
    if (data.expiresAt <= Date.now()) {
      return false // Token expired
    }
    return data.token === token
  } catch {
    return false
  }
}

