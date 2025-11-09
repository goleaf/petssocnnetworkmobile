import { randomBytes } from "crypto"

export const DELETION_RESTORE_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000 // 30 days

export interface DeletionRestoreRecord {
  token: string
  userId: string
  createdAt: number
  expiresAt: number
  consumedAt?: number
}

const tokenStore = new Map<string, DeletionRestoreRecord>()
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

export function createDeletionRestoreRecord(userId: string, ttlMs = DELETION_RESTORE_TOKEN_TTL_MS) {
  cleanupExpiredTokens()
  const existing = userTokenIndex.get(userId)
  if (existing) {
    tokenStore.delete(existing)
    userTokenIndex.delete(userId)
  }
  const token = generateToken()
  const now = Date.now()
  const record: DeletionRestoreRecord = {
    token,
    userId,
    createdAt: now,
    expiresAt: now + ttlMs,
  }
  tokenStore.set(token, record)
  userTokenIndex.set(userId, token)
  return record
}

export function consumeDeletionRestoreToken(token: string): DeletionRestoreRecord | undefined {
  cleanupExpiredTokens()
  const record = tokenStore.get(token)
  if (!record) return undefined
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

export function getDeletionRestoreRecordByUser(userId: string): DeletionRestoreRecord | undefined {
  cleanupExpiredTokens()
  const token = userTokenIndex.get(userId)
  if (!token) return undefined
  return tokenStore.get(token)
}

export function resetDeletionRestoreStore() {
  tokenStore.clear()
  userTokenIndex.clear()
}

