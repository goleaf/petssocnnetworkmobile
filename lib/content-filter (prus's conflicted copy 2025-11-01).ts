"use client"

// Profanity filter with common bad words (abbreviated list for demonstration)
const PROFANITY_LIST = [
  "damn",
  "hell",
  "crap",
  "stupid",
  "idiot",
  "dumb",
  "hate",
  // Add more as needed
]

// Spam patterns
const SPAM_PATTERNS = [
  /(.)\1{4,}/gi, // Repeated characters (aaaaa)
  /https?:\/\/[^\s]+/gi, // Multiple URLs
  /\b(buy|click|free|win|prize|money)\b/gi, // Spam keywords
  /[A-Z]{10,}/g, // Excessive caps
]

export interface ContentFilterResult {
  isClean: boolean
  filtered: string
  violations: string[]
}

export function filterProfanity(text: string): ContentFilterResult {
  const violations: string[] = []
  let filtered = text

  // Check for profanity
  PROFANITY_LIST.forEach((word) => {
    const regex = new RegExp(`\\b${word}\\b`, "gi")
    if (regex.test(filtered)) {
      violations.push(`profanity: ${word}`)
      filtered = filtered.replace(regex, "*".repeat(word.length))
    }
  })

  return {
    isClean: violations.length === 0,
    filtered,
    violations,
  }
}

export function detectSpam(text: string): ContentFilterResult {
  const violations: string[] = []
  let filtered = text

  // Check for spam patterns
  SPAM_PATTERNS.forEach((pattern, index) => {
    if (pattern.test(text)) {
      violations.push(`spam pattern ${index + 1}`)
    }
  })

  // Check for excessive URLs
  const urlMatches = text.match(/https?:\/\/[^\s]+/gi)
  if (urlMatches && urlMatches.length > 3) {
    violations.push("excessive URLs")
  }

  // Check for excessive caps
  const capsRatio = (text.match(/[A-Z]/g) || []).length / text.length
  if (capsRatio > 0.5 && text.length > 20) {
    violations.push("excessive capitalization")
    filtered = text.toLowerCase()
  }

  return {
    isClean: violations.length === 0,
    filtered,
    violations,
  }
}

export function checkDuplicateContent(content: string, recentContent: string[]): boolean {
  const normalized = content.toLowerCase().trim()
  return recentContent.some((recent) => recent.toLowerCase().trim() === normalized)
}

export function validateContent(
  text: string,
  options: {
    checkProfanity?: boolean
    checkSpam?: boolean
    minLength?: number
    maxLength?: number
  } = {},
): {
  isValid: boolean
  filtered: string
  errors: string[]
} {
  const errors: string[] = []
  let filtered = text

  // Length validation
  if (options.minLength && text.length < options.minLength) {
    errors.push(`Content must be at least ${options.minLength} characters`)
  }
  if (options.maxLength && text.length > options.maxLength) {
    errors.push(`Content must be less than ${options.maxLength} characters`)
  }

  // Profanity check
  if (options.checkProfanity !== false) {
    const profanityResult = filterProfanity(filtered)
    if (!profanityResult.isClean) {
      filtered = profanityResult.filtered
      errors.push(...profanityResult.violations)
    }
  }

  // Spam check
  if (options.checkSpam !== false) {
    const spamResult = detectSpam(filtered)
    if (!spamResult.isClean) {
      errors.push(...spamResult.violations)
    }
  }

  return {
    isValid: errors.length === 0,
    filtered,
    errors,
  }
}
