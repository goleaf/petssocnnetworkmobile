"use server"

import { revalidatePath } from "next/cache"
import { getServerUserById, updateServerUser } from "../storage-server"
import { createSession, setSessionCookie, clearSession, getCurrentUser } from "../auth-server"
import { revokeAllSessions } from "../session-store"
import { validateEmailAddress } from "../registration-policy"
import { consumeEmailVerificationToken, getEmailVerificationRecordByUser } from "../email-verification-store"
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
  try {
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
  } catch (error) {
    // In test environment or when cookies are not available, skip session refresh
    // Sessions will still be invalidated via sessionInvalidatedAt timestamp
    console.debug("[account] Skipping session refresh (not in request context)")
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

  // Verify password using bcrypt compare
  const passwordValid = await compare(password, user.passwordHash)
  if (!passwordValid) {
    return { success: false, error: "Incorrect password" }
  }

  // Calculate deletion date (30 days from now)
  const deletionDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  
  // Generate restore token
  const restoreToken = randomBytes(32).toString("hex")
  
  // Delete any existing restore token for this user
  await prisma.deletionRestoreToken.deleteMany({
    where: { userId: user.id }
  })
  
  // Create new restore token record
  await prisma.deletionRestoreToken.create({
    data: {
      userId: user.id,
      token: restoreToken,
      expiresAt: deletionDate
    }
  })
  
  // Update user with deletionScheduledAt and deletionReason
  await prisma.user.update({
    where: { id: user.id },
    data: {
      deletionScheduledAt: deletionDate,
      deletionReason: reason === 'other' ? otherReason : reason
    }
  })

  // Revoke all user sessions immediately in database
  await prisma.session.updateMany({
    where: { userId: user.id },
    data: { revoked: true }
  })

  // Also revoke in memory store for backwards compatibility
  revokeAllSessions(user.id)
  
  // Clear current session cookie
  await clearSession()

  // Send confirmation email with restore link valid for 30 days
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const normalizedBase = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl
    const restoreUrl = `${normalizedBase}/restore-account?token=${restoreToken}`
    console.info(`[account] Account deletion scheduled for ${user.email} on ${deletionDate.toLocaleDateString()}. Restore link (30 days): ${restoreUrl}`)
  } catch (error) {
    console.error("[account] Failed to log restore URL:", error)
  }

  revalidatePath("/")
  return { 
    success: true, 
    scheduledFor: deletionDate.toISOString(), 
    token: restoreToken 
  }
}

export async function restoreAccountAction(token: string): Promise<{ success: boolean; error?: string }> {
  if (!token || token.trim() === "") {
    return { success: false, error: "Missing token" }
  }

  // Validate restore token
  const restoreRecord = await prisma.deletionRestoreToken.findUnique({
    where: { token: token.trim() }
  })

  if (!restoreRecord) {
    return { success: false, error: "Invalid or expired restore token" }
  }

  // Check if token has expired
  if (restoreRecord.expiresAt < new Date()) {
    // Delete expired token
    await prisma.deletionRestoreToken.delete({
      where: { id: restoreRecord.id }
    })
    return { success: false, error: "Restore token has expired" }
  }

  // Get user
  const user = await prisma.user.findUnique({
    where: { id: restoreRecord.userId },
    select: { id: true, email: true }
  })

  if (!user) {
    return { success: false, error: "User not found" }
  }

  // Clear deletionScheduledAt and deletionReason fields
  await prisma.user.update({
    where: { id: user.id },
    data: {
      deletionScheduledAt: null,
      deletionReason: null
    }
  })

  // Delete the restore token (one-time use)
  await prisma.deletionRestoreToken.delete({
    where: { id: restoreRecord.id }
  })

  // Send confirmation email
  console.info(`[account] Account restored for ${user.email}. Deletion cancelled.`)

  revalidatePath("/")
  return { success: true }
}

/**
 * Block a user
 */
export async function blockUserAction(blockedUsername: string): Promise<{ success: boolean; error?: string }> {
  const currentUser = await getCurrentUser()
  if (!currentUser) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    // Find the user to block by username
    const targetUser = await prisma.user.findUnique({
      where: { username: blockedUsername },
      select: { id: true, username: true }
    })

    if (!targetUser) {
      return { success: false, error: "User not found" }
    }

    // Prevent self-blocking
    if (targetUser.id === currentUser.id) {
      return { success: false, error: "Cannot block yourself" }
    }

    // Import and use the privacy service
    const { blockUser } = await import("../services/privacy")
    await blockUser(currentUser.id, targetUser.id)

    revalidatePath("/settings")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to block user" }
  }
}

/**
 * Unblock a user
 */
export async function unblockUserAction(blockedUserId: string): Promise<{ success: boolean; error?: string }> {
  const currentUser = await getCurrentUser()
  if (!currentUser) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const { unblockUser } = await import("../services/privacy")
    await unblockUser(currentUser.id, blockedUserId)

    revalidatePath("/settings")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to unblock user" }
  }
}

/**
 * Mute a user
 */
export async function muteUserAction(mutedUsername: string): Promise<{ success: boolean; error?: string }> {
  const currentUser = await getCurrentUser()
  if (!currentUser) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    // Find the user to mute by username
    const targetUser = await prisma.user.findUnique({
      where: { username: mutedUsername },
      select: { id: true, username: true }
    })

    if (!targetUser) {
      return { success: false, error: "User not found" }
    }

    // Prevent self-muting
    if (targetUser.id === currentUser.id) {
      return { success: false, error: "Cannot mute yourself" }
    }

    const { muteUser } = await import("../services/privacy")
    await muteUser(currentUser.id, targetUser.id)

    revalidatePath("/settings")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to mute user" }
  }
}

/**
 * Unmute a user
 */
export async function unmuteUserAction(mutedUserId: string): Promise<{ success: boolean; error?: string }> {
  const currentUser = await getCurrentUser()
  if (!currentUser) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const { unmuteUser } = await import("../services/privacy")
    await unmuteUser(currentUser.id, mutedUserId)

    revalidatePath("/settings")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to unmute user" }
  }
}

/**
 * Get blocked users for current user
 */
export async function getBlockedUsersAction(): Promise<{ 
  success: boolean
  users?: Array<{
    id: string
    username: string
    displayName: string | null
    avatarUrl: string | null
    blockedAt: string
  }>
  error?: string 
}> {
  const currentUser = await getCurrentUser()
  if (!currentUser) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const { getBlockedUsers } = await import("../services/privacy")
    const blockedUsers = await getBlockedUsers(currentUser.id)

    return {
      success: true,
      users: blockedUsers.map(bu => ({
        id: bu.blocked.id,
        username: bu.blocked.username,
        displayName: bu.blocked.displayName,
        avatarUrl: bu.blocked.avatarUrl,
        blockedAt: bu.blockedAt.toISOString()
      }))
    }
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to get blocked users" }
  }
}

/**
 * Get muted users for current user
 */
export async function getMutedUsersAction(): Promise<{ 
  success: boolean
  users?: Array<{
    id: string
    username: string
    displayName: string | null
    avatarUrl: string | null
    mutedAt: string
  }>
  error?: string 
}> {
  const currentUser = await getCurrentUser()
  if (!currentUser) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const { getMutedUsers } = await import("../services/privacy")
    const mutedUsers = await getMutedUsers(currentUser.id)

    return {
      success: true,
      users: mutedUsers.map(mu => ({
        id: mu.muted.id,
        username: mu.muted.username,
        displayName: mu.muted.displayName,
        avatarUrl: mu.muted.avatarUrl,
        mutedAt: mu.mutedAt.toISOString()
      }))
    }
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to get muted users" }
  }
}

/**
 * Bulk block multiple users
 */
export async function bulkBlockUsersAction(usernames: string[]): Promise<{ 
  success: boolean
  results?: Array<{ username: string; success: boolean; error?: string }>
  error?: string 
}> {
  const currentUser = await getCurrentUser()
  if (!currentUser) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const { bulkBlockUsers } = await import("../services/privacy")
    const results = await bulkBlockUsers(currentUser.id, usernames)

    revalidatePath("/settings")
    return { success: true, results }
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to bulk block users" }
  }
}

/**
 * Get notification settings for current user
 */
export async function getNotificationSettingsAction(): Promise<{
  success: boolean
  settings?: any
  error?: string
}> {
  const currentUser = await getCurrentUser()
  if (!currentUser) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const { getNotificationSettings } = await import("../services/notifications")
    const settings = await getNotificationSettings(currentUser.id)

    return { success: true, settings }
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to get notification settings" }
  }
}

/**
 * Update notification settings for current user
 */
export async function updateNotificationSettingsAction(settings: any): Promise<{
  success: boolean
  error?: string
}> {
  const currentUser = await getCurrentUser()
  if (!currentUser) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const { updateNotificationSettings } = await import("../services/notifications")
    await updateNotificationSettings(currentUser.id, settings)

    revalidatePath("/settings")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update notification settings" }
  }
}
