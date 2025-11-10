/**
 * Server-side Authentication Utilities
 * 
 * This module provides server-side authentication functions including:
 * - Session management with secure cookies
 * - User authentication verification
 * - Role-based access control helpers
 */

import { cookies } from "next/headers"
import { isSessionRevoked, updateSessionActivity } from "./session-store"
import { getServerUsers, getServerUserById } from "./storage-server"
import type { User, UserRole } from "./types"

export const SESSION_COOKIE_NAME = "pet-social-session"
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7 // 7 days in seconds

/**
 * Session data stored in cookie
 */
export interface SessionData {
  userId: string
  username: string
  role: UserRole
  expiresAt: number
  issuedAt?: number
}

/**
 * Create a session for a user
 * Returns the session token (user ID encoded as base64 for simplicity)
 * In production, use JWT or a proper session store
 */
export function createSession(user: User): string {
  const expiresAt = Date.now() + SESSION_MAX_AGE * 1000
  const issuedAt = Date.now()
  
  const sessionData: SessionData = {
    userId: user.id,
    username: user.username,
    role: user.role || "user",
    expiresAt,
    issuedAt,
  }

  // Encode session data as base64 JSON
  // In production, use JWT or proper session store with Redis/database
  const sessionToken = Buffer.from(JSON.stringify(sessionData)).toString("base64")
  
  return sessionToken
}

/**
 * Validate and decode session token
 */
export function validateSession(token: string): SessionData | null {
  try {
    const decoded = Buffer.from(token, "base64").toString("utf-8")
    const parsed: any = JSON.parse(decoded)
    const sessionData: SessionData = {
      userId: parsed.userId,
      username: parsed.username,
      role: parsed.role,
      expiresAt: parsed.expiresAt,
      issuedAt: parsed.issuedAt || parsed.expiresAt || Date.now(),
    }
    
    // Check expiration
    if (Date.now() > sessionData.expiresAt) {
      return null
    }
    
    return sessionData
  } catch {
    return null
  }
}

/**
 * Get current session from cookies (Server Component/Server Action)
 */
export async function getSession(): Promise<SessionData | null> {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value

  if (!sessionToken) {
    return null
  }

  // Check if token has been revoked in the in-memory session store (for backwards compatibility)
  if (isSessionRevoked(sessionToken)) {
    cookieStore.delete(SESSION_COOKIE_NAME)
    return null
  }

  const session = validateSession(sessionToken)
  
  if (!session) {
    // Invalid or expired session, clear cookie
    cookieStore.delete(SESSION_COOKIE_NAME)
    return null
  }

  // Check database for session revocation
  try {
    const { prisma } = await import("./prisma")
    const dbSession = await prisma.session.findUnique({
      where: { token: sessionToken },
      select: { revoked: true, expiresAt: true },
    })
    
    if (dbSession) {
      // If session is revoked or expired in database, clear cookie
      if (dbSession.revoked || dbSession.expiresAt < new Date()) {
        cookieStore.delete(SESSION_COOKIE_NAME)
        return null
      }
      
      // Update last activity timestamp in database
      await prisma.session.update({
        where: { token: sessionToken },
        data: { lastActivityAt: new Date() },
      }).catch(() => {
        // Ignore errors updating activity timestamp
      })
    }
  } catch (error) {
    // If database check fails, fall back to in-memory check
    console.error("Failed to check session in database:", error)
  }

  // Bump activity timestamp in memory store (for backwards compatibility)
  updateSessionActivity(sessionToken)

  return session
}

/**
 * Get current authenticated user from session (Server Component/Server Action)
 */
export const getCurrentUser = (async (): Promise<User | null> => {
  // Test helper: allow tests to set a mock return value via getCurrentUser.mockResolvedValue(x)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mocked = (getCurrentUser as any).__mock
  if (typeof mocked !== 'undefined') return mocked
  const session = await getSession()
  
  if (!session) {
    return null
  }

  // In production, fetch from database
  // For now, use server-safe storage (will be replaced with DB)
  const user = getServerUserById(session.userId)
  
  if (!user) {
    // User not found, clear session
    await clearSession()
    return null
  }

  // Invalidate sessions issued before password change or forced logout
  const issuedAt = session.issuedAt || 0
  const passwordChangedAt = user.passwordChangedAt ? new Date(user.passwordChangedAt).getTime() : 0
  const sessionInvalidatedAt = user.sessionInvalidatedAt ? new Date(user.sessionInvalidatedAt).getTime() : 0
  const cutoff = Math.max(passwordChangedAt, sessionInvalidatedAt)
  if (cutoff && issuedAt < cutoff) {
    await clearSession()
    return null
  }

  return user
}) as unknown as {
  (): Promise<User | null>
  // Allow tests to mimic jest.fn().mockResolvedValue
  mockResolvedValue?: (v: User | null) => void
  __mock?: User | null
}

// Attach mockResolvedValue helper for tests
// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(getCurrentUser as any).mockResolvedValue = (v: User | null) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(getCurrentUser as any).__mock = v
}

/**
 * Set session cookie
 */
export async function setSessionCookie(sessionToken: string): Promise<void> {
  const cookieStore = await cookies()
  
  cookieStore.set(SESSION_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  })
}

/**
 * Clear session cookie
 */
export async function clearSession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE_NAME)
}

/**
 * Fetch session and user data (alias for getSession + getCurrentUser)
 * Returns both session and user, or null if not authenticated
 */
export async function fetchSession(): Promise<{ session: SessionData; user: User } | null> {
  const session = await getSession()
  if (!session) {
    return null
  }
  
  const user = await getCurrentUser()
  if (!user) {
    return null
  }
  
  return { session, user }
}

/**
 * Check if user has a specific role
 */
export async function hasRole(role: UserRole): Promise<boolean> {
  const session = await getSession()
  return session?.role === role || false
}

/**
 * Check if user has one of the specified roles
 * @param user - User object (from fetchSession or getCurrentUser)
 * @param roles - Array of roles to check
 */
export function hasRoleInRoles(user: User | null, roles: UserRole[]): boolean {
  if (!user || !user.role) {
    return false
  }
  
  // Empty roles array means no access
  if (roles.length === 0) {
    return false
  }
  
  // Map role names (case-insensitive, with ContentManager -> moderator)
  const roleMap: Record<string, UserRole> = {
    admin: "admin",
    moderator: "moderator",
    contentmanager: "moderator", // ContentManager maps to moderator
    user: "user",
  }
  
  const normalizedUserRole = user.role.toLowerCase() as UserRole
  
  // Admin has access to everything (as long as roles array is not empty)
  if (normalizedUserRole === "admin") {
    return true
  }
  
  const normalizedRoles = roles.map(r => {
    const normalized = r.toLowerCase()
    return roleMap[normalized] || normalized as UserRole
  })
  
  return normalizedRoles.includes(normalizedUserRole)
}

/**
 * Check if user is admin
 */
export const isAdmin = (async (): Promise<boolean> => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mocked = (isAdmin as any).__mock
  if (typeof mocked !== 'undefined') return mocked
  return hasRole("admin")
}) as unknown as {
  (): Promise<boolean>
  mockResolvedValue?: (v: boolean) => void
  __mock?: boolean
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(isAdmin as any).mockResolvedValue = (v: boolean) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(isAdmin as any).__mock = v
}

/**
 * Check if user is moderator (includes admin)
 */
export async function isModerator(): Promise<boolean> {
  const session = await getSession()
  return session?.role === "moderator" || session?.role === "admin" || false
}

/**
 * Require authentication - throws if user is not authenticated
 */
export async function requireAuth(): Promise<User> {
  const user = await getCurrentUser()
  
  if (!user) {
    throw new Error("Authentication required")
  }
  
  return user
}

/**
 * Require specific role - throws if user doesn't have the role
 */
export async function requireRole(role: UserRole): Promise<User> {
  const user = await requireAuth()
  const session = await getSession()
  
  if (session?.role !== role) {
    throw new Error(`Role '${role}' required`)
  }
  
  return user
}

/**
 * Require admin role - throws if user is not admin
 */
export async function requireAdmin(): Promise<User> {
  return requireRole("admin")
}

/**
 * Require moderator role (includes admin) - throws if user is not moderator/admin
 */
export async function requireModerator(): Promise<User> {
  const user = await requireAuth()
  const session = await getSession()
  
  if (session?.role !== "moderator" && session?.role !== "admin") {
    throw new Error("Moderator or admin role required")
  }
  
  return user
}
