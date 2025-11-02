"use server"

/**
 * Server Actions for Authentication
 * 
 * These server actions handle authentication operations on the server:
 * - Login
 * - Logout
 * - Register
 * - Get current session
 */

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import {
  getServerUsers,
  getServerUserByUsername,
  getServerUserById,
  serverEmailExists,
  serverUsernameExists,
  addServerUser,
  updateServerUser,
} from "../storage-server"
import {
  createSession,
  setSessionCookie,
  clearSession,
  getCurrentUser as getServerUser,
} from "../auth-server"
import type { User, UserRole } from "../types"

export interface AuthResult {
  success: boolean
  error?: string
}

export interface LoginInput {
  username: string
  password: string
}

export interface RegisterInput {
  email: string
  password: string
  username: string
  fullName: string
  role?: UserRole
}

/**
 * Login server action
 */
export async function loginAction(input: LoginInput): Promise<AuthResult> {
  // Validate input
  if (!input.username || input.username.trim() === "") {
    return { success: false, error: "Username is required" }
  }
  
  if (!input.password || input.password.trim() === "") {
    return { success: false, error: "Password is required" }
  }

  // Get user from server-safe storage (in production, query database)
  const user = getServerUserByUsername(input.username.trim())

  if (!user) {
    return { success: false, error: "Invalid username or password" }
  }

  // If user doesn't have a password set, set it from the provided password
  if (!user.password) {
    // Set the password for the user
    updateServerUser(user.id, { password: input.password })
    user.password = input.password
  } else {
    // Verify password matches if user has a password
    if (user.password !== input.password) {
      return { success: false, error: "Invalid username or password" }
    }
  }

  // Create session
  const sessionToken = createSession(user)
  await setSessionCookie(sessionToken)

  // Revalidate pages that depend on auth
  revalidatePath("/")
  
  return { success: true }
}

/**
 * Logout server action
 */
export async function logoutAction(): Promise<void> {
  await clearSession()
  revalidatePath("/")
  redirect("/")
}

/**
 * Register server action
 */
export async function registerAction(input: RegisterInput): Promise<AuthResult> {
  // Validate input
  if (!input.email || input.email.trim() === "") {
    return { success: false, error: "Email is required" }
  }
  
  if (!input.username || input.username.trim() === "") {
    return { success: false, error: "Username is required" }
  }
  
  if (!input.password || input.password.trim() === "") {
    return { success: false, error: "Password is required" }
  }
  
  if (!input.fullName || input.fullName.trim() === "") {
    return { success: false, error: "Full name is required" }
  }
  
  if (input.username.trim().length < 3) {
    return { success: false, error: "Username must be at least 3 characters" }
  }
  
  if (input.password.length < 6) {
    return { success: false, error: "Password must be at least 6 characters" }
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(input.email.trim())) {
    return { success: false, error: "Invalid email format" }
  }

  // Check if email or username already exists using server-safe storage
  if (serverEmailExists(input.email.trim())) {
    return { success: false, error: "Email already exists" }
  }
  
  if (serverUsernameExists(input.username.trim())) {
    return { success: false, error: "Username already taken" }
  }

  // Create new user
  const newUser: User = {
    id: String(Date.now()),
    email: input.email.trim(),
    username: input.username.trim(),
    password: input.password,
    fullName: input.fullName.trim(),
    role: input.role || "user",
    joinedAt: new Date().toISOString().split("T")[0],
    followers: [],
    following: [],
    followingPets: [],
  }

  // Save user using server-safe storage (in production, insert into database)
  addServerUser(newUser)

  // Create session and log user in
  const sessionToken = createSession(newUser)
  await setSessionCookie(sessionToken)

  // Revalidate pages that depend on auth
  revalidatePath("/")
  
  return { success: true }
}

/**
 * Get current user server action
 */
export async function getCurrentUserAction(): Promise<User | null> {
  return getServerUser()
}

/**
 * Complete onboarding server action
 * Validates preferences and marks user as having completed onboarding
 */
export async function completeOnboarding(
  userId: string,
  prefs: {
    speciesInterests: string[]
    locationConsent: boolean
    followsRequired: number
    followedUserIds?: string[]
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate preferences (if schema exists)
    const validated = {
      speciesInterests: prefs.speciesInterests,
      locationConsent: prefs.locationConsent,
      followsRequired: prefs.followsRequired,
      followedUserIds: prefs.followedUserIds || [],
    }

    // Verify user exists using server-safe storage
    const user = getServerUserById(userId)
    if (!user) {
      return { success: false, error: "User not found" }
    }

    // Verify user has followed required number of users
    const followedCount = validated.followedUserIds?.length || 0
    if (followedCount < validated.followsRequired) {
      return {
        success: false,
        error: `Please follow at least ${validated.followsRequired} users to continue`,
      }
    }

    // Update user with onboarding data using server-safe storage
    updateServerUser(userId, {
      onboardingCompleted: true,
      onboardingPreferences: validated as any,
      following: validated.followedUserIds || [],
    })

    revalidatePath("/")
    return { success: true }
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: "Invalid onboarding preferences" }
  }
}

/**
 * Issue magic link for passwordless login
 */
export async function issueMagicLink(
  email: string
): Promise<{ success: boolean; error?: string; token?: string }> {
  const { headers } = await import("next/headers")

  try {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      return { success: false, error: "Invalid email format" }
    }

    // Check if user exists using server-safe storage
    const users = getServerUsers()
    const user = users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase())
    if (!user) {
      // For security, don't reveal if email exists
      // But we'll still return success to prevent email enumeration
      return { success: true }
    }

    // Get device info from request
    const headersList = await headers()
    const userAgent = headersList.get("user-agent") || undefined
    const forwarded = headersList.get("x-forwarded-for")
    const ip = forwarded ? forwarded.split(",")[0].trim() : headersList.get("x-real-ip") || undefined

    // Generate magic link token (simplified - in production use proper token generation)
    const token = Buffer.from(`${email}:${Date.now()}`).toString("base64")

    // In production, send email here
    // For now, we'll return the token (in production, never return token to client)
    // TODO: Implement email sending service and proper token storage
    console.log(`Magic link for ${email}: ${token}`)

    return { success: true, token }
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: "Failed to issue magic link" }
  }
}

/**
 * Verify magic link token and create session
 */
export async function verifyMagicLink(
  token: string
): Promise<{ success: boolean; error?: string }> {
  const { headers } = await import("next/headers")

  try {
    // Decode token (simplified - in production use proper token validation)
    let email: string
    try {
      const decoded = Buffer.from(token, "base64").toString("utf-8")
      email = decoded.split(":")[0]
    } catch {
      return { success: false, error: "Invalid magic link token" }
    }

    // Find user by email using server-safe storage
    const users = getServerUsers()
    const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase())
    if (!user) {
      return { success: false, error: "User not found" }
    }

    // Get device info
    const headersList = await headers()
    const userAgent = headersList.get("user-agent") || undefined
    const forwarded = headersList.get("x-forwarded-for")
    const ip = forwarded ? forwarded.split(",")[0].trim() : headersList.get("x-real-ip") || undefined

    // Create session
    const sessionToken = createSession(user)
    await setSessionCookie(sessionToken)

    revalidatePath("/")
    return { success: true }
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: "Failed to verify magic link" }
  }
}

/**
 * Verify 2FA code
 */
export async function verify2FA(
  code: string
): Promise<{ success: boolean; error?: string }> {
  const { twoFactorCodeSchema } = await import("../validations/auth")
  const { getCurrentUser } = await import("../auth-server")

  try {
    // Validate code format
    const validated = twoFactorCodeSchema.parse(code)

    // Get current user (must be partially authenticated)
    const user = await getCurrentUser()
    if (!user || !user.twoFactorAuth?.enabled) {
      return { success: false, error: "2FA is not enabled for this account" }
    }

    // In production, use proper TOTP verification library (e.g., speakeasy)
    // For now, basic validation
    // TODO: Implement proper TOTP verification
    if (validated.length !== 6 || !/^\d{6}$/.test(validated)) {
      return { success: false, error: "Invalid 2FA code" }
    }

    // Verify TOTP code (simplified - implement proper TOTP in production)
    // const isValid = speakeasy.totp.verify({
    //   secret: user.twoFactorAuth.secret,
    //   encoding: 'base32',
    //   token: validated,
    //   window: 2
    // })

    // For now, return success (in production, implement proper verification)
    return { success: true }
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: "Failed to verify 2FA code" }
  }
}

// Helper functions for device detection
function detectDeviceType(userAgent?: string): "mobile" | "tablet" | "desktop" | "other" {
  if (!userAgent) return "other"
  const ua = userAgent.toLowerCase()
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return "tablet"
  }
  if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
    return "mobile"
  }
  return "desktop"
}

function getDeviceName(userAgent?: string): string {
  if (!userAgent) return "Unknown Device"
  // Extract device name from user agent
  const ua = userAgent
  if (ua.includes("iPhone")) return "iPhone"
  if (ua.includes("iPad")) return "iPad"
  if (ua.includes("Android")) {
    const match = ua.match(/Android [\d.]+; ([^)]+)/)
    return match ? match[1] : "Android Device"
  }
  if (ua.includes("Windows")) {
    const match = ua.match(/Windows NT [\d.]+; ([^)]+)/)
    return match ? match[1] : "Windows Device"
  }
  if (ua.includes("Mac OS X")) {
    const match = ua.match(/Mac OS X [\d_]+/)?.[0]
    return match ? `macOS ${match.replace("_", ".")}` : "macOS"
  }
  return "Device"
}

function getOS(userAgent?: string): string {
  if (!userAgent) return "Unknown"
  const ua = userAgent
  if (ua.includes("Windows")) return "Windows"
  if (ua.includes("Mac OS X")) return "macOS"
  if (ua.includes("Linux")) return "Linux"
  if (ua.includes("Android")) return "Android"
  if (ua.includes("iOS")) return "iOS"
  return "Unknown"
}

function getBrowser(userAgent?: string): string {
  if (!userAgent) return "Unknown"
  const ua = userAgent
  if (ua.includes("Chrome") && !ua.includes("Edg")) return "Chrome"
  if (ua.includes("Firefox")) return "Firefox"
  if (ua.includes("Safari") && !ua.includes("Chrome")) return "Safari"
  if (ua.includes("Edg")) return "Edge"
  if (ua.includes("Opera")) return "Opera"
  return "Unknown"
}

