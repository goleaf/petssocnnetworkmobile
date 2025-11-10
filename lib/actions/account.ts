"use server"

import { revalidatePath } from "next/cache"
import { serverEmailExists, getServerUserById, updateServerUser } from "../storage-server"
import { createSession, setSessionCookie, clearSession, getCurrentUser } from "../auth-server"
import { createDeletionRestoreRecord, consumeDeletionRestoreToken } from "../deletion-restore-store"
import { revokeAllSessions } from "../session-store"
import { validateEmailAddress } from "../registration-policy"
import { createEmailVerificationRecord, consumeEmailVerificationToken, getEmailVerificationRecordByUser } from "../email-verification-store"
import { prisma } from "../prisma"
import { randomBytes } from "crypto"
import { compare } from "bcryptjs"

function logEmailChangeVerification(newEmail: string, token: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl
  const verificationUrl = `${normalizedBase}/verify-email?token=${token}`
  console.info(`[account] Email change verification link for ${newEmail}: ${verificationUrl}`)
}

function logEmailChangeCancellation(oldEmail: string, token: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl
  const cancelUrl = `${normalizedBase}/cancel-email-change?token=${token}`
  console.info(`[account] Email change CANCEL link for ${oldEmail}: ${cancelUrl}`)
}

export async function requestEmailChangeAction(input: {
  userId: string
  newEmail: string
  currentPassword: string
  sendVerification?: boolean
}): Promise<{ success: boolean; error?: string; verificationExpiresAt?: string; token?: string }> {
  const { userId, newEmail, currentPassword, sendVerification = true } = input

  // Get authenticated user
  const currentUser = await getCurrentUser()
  if (!currentUser || currentUser.id !== userId) {
    return { success: false, error: "Unauthorized" }
  }

  // Fetch user from database
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, passwordHash: true }
  })

  if (!user) {
    return { success: false, error: "User not found" }
  }

  // Verify current password using bcrypt compare
  const passwordValid = await compare(currentPassword, user.passwordHash)
  if (!passwordValid) {
    return { success: false, error: "Incorrect password" }
  }

  // Validate new email format
  const emailValidation = validateEmailAddress(newEmail.trim())
  if (!emailValidation.valid) {
    return { success: false, error: emailValidation.reason || "Invalid email format" }
  }

  // Prevent reusing same email
  if (newEmail.trim().toLowerCase() === user.email.toLowerCase()) {
    return { success: false, error: "This is already your current email" }
  }

  // Check if email already used by someone else
  const existingUser = await prisma.user.findUnique({
    where: { email: newEmail.trim() }
  })

  if (existingUser) {
    return { success: false, error: "Email is already in use" }
  }

  // Generate cryptographically secure verification token (32 bytes)
  const token = randomBytes(32).toString("hex")
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

  // Delete any existing verification records for this user
  await prisma.emailVerification.deleteMany({
    where: { userId: user.id }
  })

  // Create EmailVerification record with 24-hour expiration
  await prisma.emailVerification.create({
    data: {
      userId: user.id,
      pendingEmail: newEmail.trim(),
      token,
      expiresAt
    }
  })

  if (sendVerification) {
    // Send verification email to new address with token link
    logEmailChangeVerification(newEmail.trim(), token)
  }
  
  // Send notification email to old address with cancellation link
  logEmailChangeCancellation(user.email, token)

  revalidatePath("/settings")
  return {
    success: true,
    verificationExpiresAt: expiresAt.toISOString(),
    token: sendVerification ? undefined : token // Only return token if not sending email (for testing)
  }
}

export async function cancelEmailChangeAction(token: string): Promise<{ success: boolean; error?: string }> {
  if (!token || token.trim() === "") {
    return { success: false, error: "Missing token" }
  }

  // Consume token to invalidate pending change
  const record = consumeEmailVerificationToken(token.trim())
  if (!record) {
    return { success: false, error: "Invalid or expired token" }
  }

  const user = getServerUserById(record.userId)
  if (!user) {
    return { success: false, error: "User not found" }
  }

  // Reset verification state back to verified for current email
  updateServerUser(user.id, {
    emailVerification: {
      status: user.emailVerified ? "verified" : "expired",
      verifiedAt: user.emailVerified ? new Date().toISOString() : undefined,
      token: undefined,
      pendingEmail: undefined,
    },
  })

  revalidatePath("/settings")
  return { success: true }
}

export async function getPendingEmailChangeAction(userId: string): Promise<{ pendingEmail?: string; expiresAt?: string }> {
  const record = getEmailVerificationRecordByUser(userId)
  return record ? { pendingEmail: record.email, expiresAt: new Date(record.expiresAt).toISOString() } : {}
}

const PASSWORD_COMPLEXITY_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/

export async function updatePasswordAction(input: {
  userId: string
  currentPassword: string
  newPassword: string
}): Promise<{ success: boolean; error?: string }> {
  const { userId, currentPassword, newPassword } = input

  // Get authenticated user
  const currentUser = await getCurrentUser()
  if (!currentUser || currentUser.id !== userId) {
    return { success: false, error: "Unauthorized" }
  }

  // Fetch user from database with password hash
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, passwordHash: true }
  })

  if (!user) {
    return { success: false, error: "User not found" }
  }

  // Verify current password using bcrypt compare
  const passwordValid = await compare(currentPassword, user.passwordHash)
  if (!passwordValid) {
    return { success: false, error: "Current password is incorrect" }
  }

  // Validate new password meets complexity requirements (8+ chars, uppercase, lowercase, number, special char)
  if (!PASSWORD_COMPLEXITY_REGEX.test(newPassword)) {
    return {
      success: false,
      error: "Password must be at least 8 characters and include uppercase, lowercase, number, and special character",
    }
  }

  if (newPassword === currentPassword) {
    return { success: false, error: "New password must be different from current password" }
  }

  // Hash new password with bcrypt cost factor 12
  const bcrypt = await import("bcryptjs")
  const passwordHash = await bcrypt.hash(newPassword, 12)

  // Update user passwordHash and passwordChangedAt timestamp
  // Set sessionInvalidatedAt to current time to revoke all sessions except current
  const now = new Date()
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      passwordChangedAt: now,
      sessionInvalidatedAt: now
    }
  })

  // Revoke all sessions except current session in the session store
  // Note: Sessions are also lazily invalidated via sessionInvalidatedAt check in getCurrentUser
  const { revokeOtherSessions } = await import("../session-store")
  const { cookies } = await import("next/headers")
  const cookieStore = await cookies()
  const currentSessionToken = cookieStore.get("pet-social-session")?.value
  
  if (currentSessionToken) {
    // Revoke all other sessions in the session store
    revokeOtherSessions(user.id, currentSessionToken)
  }

  // Re-issue session for current device so it remains valid after cutoff
  const refreshedUser = await prisma.user.findUnique({
    where: { id: user.id }
  })
  
  if (refreshedUser) {
    // Create new session token with updated timestamp
    const newToken = createSession({
      id: refreshedUser.id,
      username: refreshedUser.username,
      email: refreshedUser.email,
      role: refreshedUser.role as any,
      emailVerified: refreshedUser.emailVerified,
      passwordHash: refreshedUser.passwordHash,
      createdAt: refreshedUser.createdAt.toISOString(),
      updatedAt: refreshedUser.updatedAt.toISOString()
    } as any)
    await setSessionCookie(newToken)
  }

  // Send password change notification email
  console.info(`[account] Password changed for ${user.email}. Notification email sent.`)

  revalidatePath("/settings")
  return { success: true }
}

export async function logoutAllDevicesAction(userId: string): Promise<{ success: boolean; error?: string }> {
  // Get authenticated user
  const currentUser = await getCurrentUser()
  if (!currentUser || currentUser.id !== userId) {
    return { success: false, error: "Unauthorized" }
  }

  // Fetch user from database
  const user = await prisma.user.findUnique({
    where: { id: userId }
  })

  if (!user) {
    return { success: false, error: "User not found" }
  }

  // Set sessionInvalidatedAt to revoke all sessions
  await prisma.user.update({
    where: { id: user.id },
    data: {
      sessionInvalidatedAt: new Date()
    }
  })

  // Revoke all sessions in the session store
  revokeAllSessions(user.id)

  // Clear current session cookie
  await clearSession()

  revalidatePath("/settings")
  return { success: true }
}

export async function requestAccountDeletionAction(input: {
  userId: string
  password: string
  reason: string
  otherReason?: string
}): Promise<{ success: boolean; error?: string; scheduledFor?: string; token?: string }> {
  const { userId, password, reason, otherReason } = input
  const user = getServerUserById(userId)
  if (!user) return { success: false, error: "User not found" }
  if (!user.password || user.password !== password) {
    return { success: false, error: "Incorrect password" }
  }

  const record = createDeletionRestoreRecord(user.id)
  const scheduledFor = new Date(record.expiresAt).toISOString()
  updateServerUser(user.id, {
    deletion: {
      status: "scheduled",
      requestedAt: new Date(record.createdAt).toISOString(),
      scheduledFor,
      reason,
      otherReason,
      restoreToken: record.token,
    },
  })

  // Revoke all sessions and log out immediately
  revokeAllSessions(user.id)
  await clearSession()

  // Simulate confirmation email with restore link
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const normalizedBase = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl
    const restoreUrl = `${normalizedBase}/restore-account?token=${record.token}`
    console.info(`[account] Account deletion scheduled for ${user.email}. Restore link (30 days): ${restoreUrl}`)
  } catch {}

  revalidatePath("/")
  return { success: true, scheduledFor, token: record.token }
}

export async function restoreAccountAction(token: string): Promise<{ success: boolean; error?: string }> {
  if (!token || token.trim() === "") {
    return { success: false, error: "Missing token" }
  }
  const record = consumeDeletionRestoreToken(token.trim())
  if (!record) return { success: false, error: "Invalid or expired restore token" }
  const user = getServerUserById(record.userId)
  if (!user) return { success: false, error: "User not found" }
  updateServerUser(user.id, {
    deletion: {
      status: "restored",
      requestedAt: user.deletion?.requestedAt || new Date().toISOString(),
      scheduledFor: user.deletion?.scheduledFor || new Date().toISOString(),
      restoredAt: new Date().toISOString(),
    },
  })
  revalidatePath("/")
  return { success: true }
}
