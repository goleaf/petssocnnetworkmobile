/**
 * Cookie Consent Management
 * 
 * Functions for managing GDPR/CCPA compliant cookie consent preferences
 */

export interface CookieConsent {
  preferences: {
    necessary: boolean
    analytics: boolean
    marketing: boolean
    functional: boolean
  }
  timestamp: string
}

const COOKIE_CONSENT_KEY = "cookie_consent"

/**
 * Get stored cookie consent preferences
 */
export function getCookieConsent(): CookieConsent | null {
  if (typeof window === "undefined") {
    return null
  }

  try {
    const stored = localStorage.getItem(COOKIE_CONSENT_KEY)
    if (!stored) {
      return null
    }
    return JSON.parse(stored) as CookieConsent
  } catch {
    return null
  }
}

/**
 * Store cookie consent preferences
 */
export function setCookieConsent(consent: CookieConsent): void {
  if (typeof window === "undefined") {
    return
  }

  try {
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(consent))
  } catch (error) {
    console.error("Failed to store cookie consent:", error)
  }
}

/**
 * Check if a specific cookie category is consented
 */
export function hasCookieConsent(category: keyof CookieConsent["preferences"]): boolean {
  const consent = getCookieConsent()
  if (!consent) {
    return category === "necessary" // Only necessary cookies allowed by default
  }
  return consent.preferences[category] ?? false
}

/**
 * Clear cookie consent (for testing or reset)
 */
export function clearCookieConsent(): void {
  if (typeof window === "undefined") {
    return
  }
  localStorage.removeItem(COOKIE_CONSENT_KEY)
}

