import type { CorporateEmailMetadata } from "./types"

export const RFC_5322_EMAIL_REGEX =
  /^(?:[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-zA-Z0-9-]*[a-zA-Z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])$/

const DISPOSABLE_EMAIL_DOMAINS = new Set([
  "10minutemail.com",
  "guerrillamail.com",
  "mailinator.com",
  "trashmail.com",
  "tempmail.com",
  "yopmail.com",
  "getnada.com",
  "throwawaymail.com",
  "fakeinbox.com",
  "mintemail.com",
  "sharklasers.com",
  "spambog.com",
  "maildrop.cc",
  "spambox.us",
  "dispostable.com",
  "tempr.email",
  "moakt.com",
  "luxusmail.org",
])

const PERSONAL_EMAIL_PROVIDERS = new Set([
  "gmail.com",
  "yahoo.com",
  "yahoo.co.uk",
  "outlook.com",
  "hotmail.com",
  "live.com",
  "msn.com",
  "icloud.com",
  "me.com",
  "mac.com",
  "protonmail.com",
  "pm.me",
  "aol.com",
  "gmx.com",
  "zoho.com",
  "hey.com",
])

interface CorporateDomainPolicy {
  organization: string
  requiresEmployeeId?: boolean
}

const CORPORATE_DOMAIN_POLICIES: Record<string, CorporateDomainPolicy> = {
  "petsmart.com": { organization: "PetSmart" },
  "petco.com": { organization: "Petco" },
  "chewy.com": { organization: "Chewy" },
  "banfield.com": { organization: "Banfield Pet Hospital", requiresEmployeeId: true },
  "vspca.org": { organization: "Veterinary Society for Pet Care Association" },
  "petpartners.org": { organization: "Pet Partners" },
}

export interface EmailValidationResult {
  valid: boolean
  reason?: string
  domain?: string
  isDisposable?: boolean
  corporate?: CorporateEmailMetadata
}

export function getEmailDomain(email: string): string | null {
  const parts = email.trim().toLowerCase().split("@")
  if (parts.length !== 2) return null
  return parts[1]
}

export function describeCorporateEmail(email: string): CorporateEmailMetadata | undefined {
  const domain = getEmailDomain(email)
  if (!domain) return undefined

  if (DISPOSABLE_EMAIL_DOMAINS.has(domain)) {
    return {
      domain,
      isCorporate: false,
      verified: false,
      reason: "Disposable email domains are not eligible for corporate verification.",
    }
  }

  if (PERSONAL_EMAIL_PROVIDERS.has(domain)) {
    return {
      domain,
      isCorporate: false,
      verified: false,
    }
  }

  const policy = CORPORATE_DOMAIN_POLICIES[domain]
  if (policy) {
    return {
      domain,
      isCorporate: true,
      verified: true,
      organization: policy.organization,
      requiresManualReview: Boolean(policy.requiresEmployeeId),
    }
  }

  return {
    domain,
    isCorporate: true,
    verified: false,
    requiresManualReview: true,
    reason: "Domain not yet in the approved corporate directory.",
  }
}

export function isDisposableEmail(email: string): boolean {
  const domain = getEmailDomain(email)
  if (!domain) return false
  return DISPOSABLE_EMAIL_DOMAINS.has(domain)
}

export function validateEmailAddress(email: string): EmailValidationResult {
  const trimmed = email.trim()
  if (!RFC_5322_EMAIL_REGEX.test(trimmed)) {
    return { valid: false, reason: "Invalid email format" }
  }

  const domain = getEmailDomain(trimmed)
  if (!domain) {
    return { valid: false, reason: "Invalid email domain" }
  }

  if (DISPOSABLE_EMAIL_DOMAINS.has(domain)) {
    return {
      valid: false,
      reason: "Disposable email domains are not allowed",
      domain,
      isDisposable: true,
    }
  }

  return {
    valid: true,
    domain,
    isDisposable: false,
    corporate: describeCorporateEmail(trimmed),
  }
}
