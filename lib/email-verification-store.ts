import { randomBytes } from "crypto"

export const EMAIL_VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours

export interface EmailVerificationRecord {
  token: string
  userId: string
  email: string
  createdAt: number
  expiresAt: number
  consumedAt?: number
}

const tokenStore = new Map<string, EmailVerificationRecord>()
const userTokenIndex = new Map<string, string>()

function generateToken(): string {
  return randomBytes(32).toString("hex")
}

function cleanupExpiredTokens() {
  const now = Date.now()
  for (const [token, record] of tokenStore.entries()) {
    if (record.expiresAt <= now) {
      tokenStore.delete(token)
      if (userTokenIndex.get(record.userId) === token) {
        userTokenIndex.delete(record.userId)
      }
    }
  }
}

export function createEmailVerificationRecord(userId: string, email: string, ttlMs = EMAIL_VERIFICATION_TOKEN_TTL_MS) {
  cleanupExpiredTokens()

  // Remove previous token for this user if it exists
  const existingToken = userTokenIndex.get(userId)
  if (existingToken) {
    tokenStore.delete(existingToken)
    userTokenIndex.delete(userId)
  }

  const token = generateToken()
  const now = Date.now()
  const record: EmailVerificationRecord = {
    token,
    userId,
    email,
    createdAt: now,
    expiresAt: now + ttlMs,
  }

  tokenStore.set(token, record)
  userTokenIndex.set(userId, token)
  return record
}

export function getEmailVerificationRecord(token: string): EmailVerificationRecord | undefined {
  cleanupExpiredTokens()
  return tokenStore.get(token)
}

export function getEmailVerificationRecordByUser(userId: string): EmailVerificationRecord | undefined {
  cleanupExpiredTokens()
  const token = userTokenIndex.get(userId)
  if (!token) {
    return undefined
  }
  return tokenStore.get(token)
}

export function consumeEmailVerificationToken(token: string): EmailVerificationRecord | undefined {
  cleanupExpiredTokens()
  const record = tokenStore.get(token)
  if (!record) {
    return undefined
  }
  if (record.expiresAt <= Date.now()) {
    tokenStore.delete(token)
    if (userTokenIndex.get(record.userId) === token) {
      userTokenIndex.delete(record.userId)
    }
    return undefined
  }

  tokenStore.delete(token)
  if (userTokenIndex.get(record.userId) === token) {
    userTokenIndex.delete(record.userId)
  }
  record.consumedAt = Date.now()
  return record
}

export function resetEmailVerificationStore() {
  tokenStore.clear()
  userTokenIndex.clear()
}
