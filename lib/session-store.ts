/**
 * In-memory Session Store (prototype)
 * Tracks active session tokens with device + IP metadata and activity timestamps.
 * In production replace with a persistent store (e.g., Redis or DB).
 */

import { randomUUID } from "crypto"

export type SessionDeviceType = "mobile" | "tablet" | "desktop" | "other"

export interface SessionRecord {
  token: string
  userId: string
  createdAt: number
  lastActivityAt: number
  userAgent?: string
  ip?: string
  deviceType?: SessionDeviceType
  deviceName?: string
  os?: string
  browser?: string
  city?: string
  country?: string
  revoked?: boolean
}

const tokenStore = new Map<string, SessionRecord>()
const userIndex = new Map<string, Set<string>>()

function parseDevice(userAgent?: string): {
  deviceType: SessionDeviceType
  deviceName: string
  os: string
  browser: string
} {
  if (!userAgent) return { deviceType: "other", deviceName: "Device", os: "Unknown", browser: "Unknown" }
  const ua = userAgent
  const lower = ua.toLowerCase()
  let deviceType: SessionDeviceType = "other"
  if (/(ipad|tablet|playbook|silk)/.test(lower)) deviceType = "tablet"
  else if (/(mobile|iphone|ipod|android)/.test(lower)) deviceType = "mobile"
  else if (/(windows|mac os x|linux)/.test(lower)) deviceType = "desktop"

  let deviceName = "Device"
  if (ua.includes("iPhone")) deviceName = "iPhone"
  else if (ua.includes("iPad")) deviceName = "iPad"
  else if (ua.includes("Android")) deviceName = "Android Device"
  else if (ua.includes("Windows")) deviceName = "Windows PC"
  else if (ua.includes("Mac OS X")) deviceName = "Mac"

  let os = "Unknown"
  if (ua.includes("Windows")) os = "Windows"
  else if (ua.includes("Mac OS X")) os = "macOS"
  else if (ua.includes("Android")) os = "Android"
  else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS"
  else if (ua.includes("Linux")) os = "Linux"

  let browser = "Unknown"
  if (/Chrome\//.test(ua)) browser = "Chrome"
  else if (/Safari\//.test(ua) && !/Chrome\//.test(ua)) browser = "Safari"
  else if (/Firefox\//.test(ua)) browser = "Firefox"
  else if (/Edg\//.test(ua)) browser = "Edge"

  return { deviceType, deviceName, os, browser }
}

function geolocateIp(ip?: string): { city?: string; country?: string } {
  if (!ip) return {}
  if (ip.startsWith("127.")) return { city: "Localhost", country: "—" }
  if (ip.startsWith("192.168.")) return { city: "Private", country: "LAN" }
  if (ip.startsWith("10.")) return { city: "Private", country: "LAN" }
  if (ip.startsWith("172.16.")) return { city: "Private", country: "LAN" }
  return { city: "Unknown", country: "Unknown" }
}

export function registerSession(token: string, userId: string, userAgent?: string, ip?: string): SessionRecord {
  const now = Date.now()
  const meta = parseDevice(userAgent)
  const loc = geolocateIp(ip)
  const record: SessionRecord = {
    token,
    userId,
    createdAt: now,
    lastActivityAt: now,
    userAgent,
    ip,
    deviceType: meta.deviceType,
    deviceName: meta.deviceName,
    os: meta.os,
    browser: meta.browser,
    city: loc.city,
    country: loc.country,
    revoked: false,
  }
  tokenStore.set(token, record)
  if (!userIndex.has(userId)) userIndex.set(userId, new Set())
  userIndex.get(userId)!.add(token)
  return record
}

export function updateSessionActivity(token: string): void {
  const rec = tokenStore.get(token)
  if (rec && !rec.revoked) {
    rec.lastActivityAt = Date.now()
    tokenStore.set(token, rec)
  }
}

export function revokeSession(token: string): void {
  const rec = tokenStore.get(token)
  if (!rec) return
  rec.revoked = true
  tokenStore.set(token, rec)
}

export function revokeAllSessions(userId: string): void {
  const set = userIndex.get(userId)
  if (!set) return
  for (const token of set) {
    const rec = tokenStore.get(token)
    if (rec) {
      rec.revoked = true
      tokenStore.set(token, rec)
    }
  }
}

export function revokeOtherSessions(userId: string, keepToken: string): void {
  const set = userIndex.get(userId)
  if (!set) return
  for (const token of set) {
    if (token === keepToken) continue
    const rec = tokenStore.get(token)
    if (rec) {
      rec.revoked = true
      tokenStore.set(token, rec)
    }
  }
}

export function isSessionRevoked(token: string): boolean {
  const rec = tokenStore.get(token)
  return !!rec?.revoked
}

export function getUserSessions(userId: string): SessionRecord[] {
  const set = userIndex.get(userId)
  if (!set) return []
  const sessions: SessionRecord[] = []
  for (const token of set) {
    const rec = tokenStore.get(token)
    if (rec) sessions.push(rec)
  }
  // Sort: current first handled in UI; here sort by last activity desc
  return sessions.sort((a, b) => (b.lastActivityAt || 0) - (a.lastActivityAt || 0))
}

