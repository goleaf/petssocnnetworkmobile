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
import { headers } from "next/headers"
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
import { registerSession } from "../session-store"
import type { User, UserRole } from "../types"
import { validateEmailAddress, describeCorporateEmail } from "../registration-policy"
import { createEmailVerificationRecord, consumeEmailVerificationToken } from "../email-verification-store"
import { incrementRegistrationAttempts } from "../server-rate-limit"

export interface AuthResult {
  success: boolean
  error?: string
  requiresVerification?: boolean
  verificationExpiresAt?: string
  sessionCreated?: boolean
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
  dateOfBirth: string
  acceptedPolicies: boolean
  role?: UserRole
}

const USERNAME_REGEX = /^[a-zA-Z0-9_-]{3,20}$/
const PASSWORD_COMPLEXITY_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/

function calculateAge(dateOfBirth: string): number | null {
  if (!dateOfBirth) {
    return null
  }
  const parsed = new Date(dateOfBirth)
  if (Number.isNaN(parsed.getTime())) {
    return null
  }
  const now = new Date()
  let age = now.getFullYear() - parsed.getFullYear()
  const monthDiff = now.getMonth() - parsed.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < parsed.getDate())) {
    age--
  }
  return age
}

/**
 * Login server action
 */
async function getClientIp(): Promise<string> {
  try {
    const requestHeaders = await headers()
    const forwardedFor = requestHeaders.get("x-forwarded-for")
    if (forwardedFor) {
      return forwardedFor.split(",")[0]?.trim() || "unknown"
    }
    const realIp = requestHeaders.get("x-real-ip")
    return realIp || "unknown"
  } catch {
    return "unknown"
  }
}

function logVerificationEmail(email: string, token: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl
  const verificationUrl = `${normalizedBase}/verify-email?token=${token}`
  console.info(`[auth] Verification link for ${email}: ${verificationUrl}`)
}

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

  if (user.emailVerified === false) {
    return {
      success: false,
      error: "Please verify your email before logging in.",
    }
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

  // Register session in database with metadata
  try {
    const { prisma } = await import("../prisma")
    const UAParser = (await import("ua-parser-js")).default
    const requestHeaders = await headers()
    const userAgent = requestHeaders.get("user-agent") || undefined
    const forwarded = requestHeaders.get("x-forwarded-for")
    const ip = forwarded ? forwarded.split(",")[0].trim() : requestHeaders.get("x-real-ip") || undefined
    
    // Parse device information
    const parser = new (UAParser as any)(userAgent)
    const result = parser.getResult()
    
    let deviceType: "mobile" | "tablet" | "desktop" = "desktop"
    if (result.device.type === "mobile") deviceType = "mobile"
    else if (result.device.type === "tablet") deviceType = "tablet"
    
    const deviceName = result.device.model || result.device.vendor || result.os.name || "Unknown Device"
    const os = result.os.name || "Unknown"
    const browser = result.browser.name || "Unknown"
    
    // Simple geolocation (in production, use a real service)
    let city: string | undefined
    let country: string | undefined
    if (ip) {
      if (ip.startsWith("127.")) {
        city = "Localhost"
        country = "—"
      } else if (ip.startsWith("192.168.") || ip.startsWith("10.") || ip.startsWith("172.16.")) {
        city = "Private"
        country = "LAN"
      } else {
        city = "Unknown"
        country = "Unknown"
      }
    }
    
    // Create or update session in database
    const { SESSION_MAX_AGE } = await import("../auth-server")
    await prisma.session.upsert({
      where: { token: sessionToken },
      create: {
        userId: user.id,
        token: sessionToken,
        deviceName,
        deviceType,
        os,
        browser,
        ip,
        city,
        country,
        expiresAt: new Date(Date.now() + SESSION_MAX_AGE * 1000),
      },
      update: {
        lastActivityAt: new Date(),
      },
    })
  } catch (error) {
    console.error("Failed to register session in database:", error)
  }

  // Revalidate pages that depend on auth
  revalidatePath("/")
  
  return { success: true, sessionCreated: true }
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
  const trimmedFullName = input.fullName.trim()
  if (trimmedFullName.length < 2 || trimmedFullName.length > 50) {
    return { success: false, error: "Full name must be between 2 and 50 characters" }
  }
  
  const normalizedUsername = input.username.trim()
  if (!USERNAME_REGEX.test(normalizedUsername)) {
    return { success: false, error: "Username must be 3-20 characters and can include letters, numbers, underscores, or hyphens" }
  }
  
  const passwordComplexityError = validatePasswordComplexity(input.password)
  if (passwordComplexityError) {
    return { success: false, error: passwordComplexityError }
  }
  
  if (!input.dateOfBirth) {
    return { success: false, error: "Date of birth is required" }
  }
  const age = calculateAge(input.dateOfBirth)
  if (age === null) {
    return { success: false, error: "Invalid date of birth" }
  }
  if (age < 13) {
    return { success: false, error: "You must be at least 13 years old to register" }
  }
  
  if (!input.acceptedPolicies) {
    return { success: false, error: "You must accept the Terms of Service and Privacy Policy" }
  }

  const rateLimitResult = incrementRegistrationAttempts(await getClientIp())
  if (!rateLimitResult.allowed) {
    const retryMinutes = Math.max(1, Math.ceil(rateLimitResult.retryAfterMs / 60000))
    return {
      success: false,
      error: `Too many registration attempts. Try again in ${retryMinutes} minute(s).`,
    }
  }

  const emailValidation = validateEmailAddress(input.email.trim())
  if (!emailValidation.valid) {
    return { success: false, error: emailValidation.reason || "Invalid email format" }
  }

  // Check if email or username already exists using server-safe storage
  if (serverEmailExists(input.email.trim())) {
    return { success: false, error: "Email already exists" }
  }
  
  if (serverUsernameExists(normalizedUsername)) {
    return { success: false, error: "Username already taken" }
  }

  // Create new user
  const userId = String(Date.now())
  const verificationRecord = createEmailVerificationRecord(userId, input.email.trim())

  const newUser: User = {
    id: userId,
    email: input.email.trim(),
    username: normalizedUsername,
    password: input.password,
    fullName: trimmedFullName,
    role: input.role || "user",
    joinedAt: new Date().toISOString().split("T")[0],
    followers: [],
    following: [],
    followingPets: [],
    dateOfBirth: input.dateOfBirth,
    acceptedPoliciesAt: new Date().toISOString(),
    emailVerified: false,
    emailVerification: {
      status: "pending",
      token: verificationRecord.token,
      requestedAt: new Date(verificationRecord.createdAt).toISOString(),
      expiresAt: new Date(verificationRecord.expiresAt).toISOString(),
    },
    corporateEmail: emailValidation.corporate || describeCorporateEmail(input.email.trim()),
  }

  // Save user using server-safe storage (in production, insert into database)
  addServerUser(newUser)

  logVerificationEmail(newUser.email, verificationRecord.token)
  
  return {
    success: true,
    requiresVerification: true,
    verificationExpiresAt: newUser.emailVerification.expiresAt,
  }
}

/**
 * Get current user server action
 */
export async function getCurrentUserAction(): Promise<User | null> {
  return getServerUser()
}

export async function verifyEmailAction(token: string): Promise<AuthResult> {
  if (!token || token.trim() === "") {
    return { success: false, error: "Missing verification token" }
  }

  const record = consumeEmailVerificationToken(token.trim())
  if (!record) {
    return { success: false, error: "Invalid or expired verification token" }
  }

  const user = getServerUserById(record.userId)
  if (!user) {
    return { success: false, error: "User not found" }
  }

  // If this token came from an email change request, update the email
  const oldEmail = user.email
  const newEmail = record.email

  updateServerUser(user.id, {
    email: newEmail,
    emailVerified: true,
    emailVerification: {
      ...(user.emailVerification || {}),
      status: "verified",
      verifiedAt: new Date().toISOString(),
      token: undefined,
      pendingEmail: undefined,
    },
  })

  // Log confirmations to both addresses
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const normalizedBase = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl
    console.info(`[auth] Email change confirmed for user ${user.username}. Old: ${oldEmail} → New: ${newEmail}`)
    console.info(`[auth] Confirmation notices sent to ${oldEmail} and ${newEmail} (simulated). See ${normalizedBase}/settings`)
  } catch {}

  revalidatePath("/")
  return { success: true }
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
    
    // Register session in database
    try {
      const { prisma } = await import("../prisma")
      const UAParser = (await import("ua-parser-js")).default
      const userAgent = headersList.get("user-agent") || undefined
      const forwarded = headersList.get("x-forwarded-for")
      const ip = forwarded ? forwarded.split(",")[0].trim() : headersList.get("x-real-ip") || undefined
      
      // Parse device information
      const parser = new (UAParser as any)(userAgent)
      const result = parser.getResult()
      
      let deviceType: "mobile" | "tablet" | "desktop" = "desktop"
      if (result.device.type === "mobile") deviceType = "mobile"
      else if (result.device.type === "tablet") deviceType = "tablet"
      
      const deviceName = result.device.model || result.device.vendor || result.os.name || "Unknown Device"
      const os = result.os.name || "Unknown"
      const browser = result.browser.name || "Unknown"
      
      // Simple geolocation
      let city: string | undefined
      let country: string | undefined
      if (ip) {
        if (ip.startsWith("127.")) {
          city = "Localhost"
          country = "—"
        } else if (ip.startsWith("192.168.") || ip.startsWith("10.") || ip.startsWith("172.16.")) {
          city = "Private"
          country = "LAN"
        } else {
          city = "Unknown"
          country = "Unknown"
        }
      }
      
      const { SESSION_MAX_AGE } = await import("../auth-server")
      await prisma.session.upsert({
        where: { token: sessionToken },
        create: {
          userId: user.id,
          token: sessionToken,
          deviceName,
          deviceType,
          os,
          browser,
          ip,
          city,
          country,
          expiresAt: new Date(Date.now() + SESSION_MAX_AGE * 1000),
        },
        update: {
          lastActivityAt: new Date(),
        },
      })
    } catch (error) {
      console.error("Failed to register session in database:", error)
    }

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
function validatePasswordComplexity(password: string): string | null {
  if (!PASSWORD_COMPLEXITY_REGEX.test(password)) {
    return "Password must be at least 8 characters and include uppercase, lowercase, number, and special character (!@#$%^&*)"
  }
  return null
}
