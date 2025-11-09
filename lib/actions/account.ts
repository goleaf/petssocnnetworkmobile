"use server"

import { revalidatePath } from "next/cache"
import { serverEmailExists, getServerUserById, updateServerUser } from "../storage-server"
import { createSession, setSessionCookie, clearSession } from "../auth-server"
import { validateEmailAddress } from "../registration-policy"
import { createEmailVerificationRecord, consumeEmailVerificationToken, getEmailVerificationRecordByUser } from "../email-verification-store"

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

  const user = getServerUserById(userId)
  if (!user) return { success: false, error: "User not found" }

  // Basic password check (prototype). In production, verify hash.
  if (!user.password || user.password !== currentPassword) {
    return { success: false, error: "Incorrect password" }
  }

  const emailValidation = validateEmailAddress(newEmail.trim())
  if (!emailValidation.valid) {
    return { success: false, error: emailValidation.reason || "Invalid email format" }
  }

  // Prevent reusing same email
  if (newEmail.trim().toLowerCase() === user.email.toLowerCase()) {
    return { success: false, error: "This is already your current email" }
  }

  // Check if email already used by someone else
  if (serverEmailExists(newEmail.trim())) {
    return { success: false, error: "Email is already in use" }
  }

  // Issue verification token for new email
  const record = createEmailVerificationRecord(user.id, newEmail.trim())

  // Update user state to reflect pending change (does not change current email yet)
  updateServerUser(user.id, {
    emailVerification: {
      status: "pending",
      token: record.token,
      requestedAt: new Date(record.createdAt).toISOString(),
      expiresAt: new Date(record.expiresAt).toISOString(),
      pendingEmail: newEmail.trim(),
    },
  })

  if (sendVerification) {
    logEmailChangeVerification(newEmail.trim(), record.token)
  }
  // Notify old email with cancel link
  logEmailChangeCancellation(user.email, record.token)

  revalidatePath("/settings")
  return {
    success: true,
    verificationExpiresAt: new Date(record.expiresAt).toISOString(),
    token: record.token,
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

  const user = getServerUserById(userId)
  if (!user) return { success: false, error: "User not found" }

  if (!currentPassword || user.password !== currentPassword) {
    return { success: false, error: "Current password is incorrect" }
  }

  if (!PASSWORD_COMPLEXITY_REGEX.test(newPassword)) {
    return {
      success: false,
      error: "Password must be at least 8 characters and include uppercase, lowercase, number, and special character",
    }
  }

  if (newPassword === currentPassword) {
    return { success: false, error: "New password must be different" }
  }

  // Update password and bump passwordChangedAt
  const passwordChangedAt = new Date().toISOString()
  updateServerUser(user.id, { password: newPassword, passwordChangedAt })

  // Re-issue session for current device so it remains valid after cutoff
  const refreshedUser = getServerUserById(user.id)!
  const newToken = createSession(refreshedUser)
  await setSessionCookie(newToken)

  // Simulate sending an email notification
  console.info(`[account] Password changed for ${refreshedUser.email}. Notification email sent.`)

  revalidatePath("/settings")
  return { success: true }
}

export async function logoutAllDevicesAction(userId: string): Promise<{ success: boolean; error?: string }> {
  const user = getServerUserById(userId)
  if (!user) return { success: false, error: "User not found" }
  const sessionInvalidatedAt = new Date().toISOString()
  updateServerUser(user.id, { sessionInvalidatedAt })
  await clearSession()
  return { success: true }
}
