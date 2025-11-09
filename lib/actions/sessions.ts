"use server"

import { cookies, headers } from "next/headers"
import { getCurrentUser } from "../auth-server"
import {
  getUserSessions,
  revokeSession,
  revokeOtherSessions,
  updateSessionActivity,
} from "../session-store"
import { registerSession } from "../session-store"

import { SESSION_COOKIE_NAME } from "../auth-server"

export interface ActiveSessionDto {
  token: string
  deviceName?: string
  deviceType?: string
  os?: string
  browser?: string
  ip?: string
  city?: string
  country?: string
  createdAt: string
  lastActivityAt: string
  revoked?: boolean
  isCurrent?: boolean
}

export async function getActiveSessionsAction(): Promise<{ success: boolean; sessions?: ActiveSessionDto[]; error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { success: false, error: "Not authenticated" }
  const cookieStore = await cookies()
  const currentToken = cookieStore.get(SESSION_COOKIE_NAME)?.value

  let sessions = getUserSessions(user.id)
  // Ensure current session appears at least once
  if (currentToken && !sessions.find((s) => s.token === currentToken)) {
    const headersList = await headers()
    const userAgent = headersList.get("user-agent") || undefined
    const forwarded = headersList.get("x-forwarded-for")
    const ip = forwarded ? forwarded.split(",")[0].trim() : headersList.get("x-real-ip") || undefined
    registerSession(currentToken, user.id, userAgent, ip)
    sessions = getUserSessions(user.id)
  }

  const data = sessions.map((s) => ({
    token: s.token,
    deviceName: s.deviceName,
    deviceType: s.deviceType,
    os: s.os,
    browser: s.browser,
    ip: s.ip,
    city: s.city,
    country: s.country,
    createdAt: new Date(s.createdAt).toISOString(),
    lastActivityAt: new Date(s.lastActivityAt).toISOString(),
    revoked: s.revoked,
    isCurrent: !!currentToken && s.token === currentToken,
  }))
  return { success: true, sessions: data }
}

export async function logoutSessionAction(token: string): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { success: false, error: "Not authenticated" }
  // Only allow revoking sessions that belong to the current user
  const sessions = getUserSessions(user.id)
  if (!sessions.find((s) => s.token === token)) {
    return { success: false, error: "Session not found" }
  }
  revokeSession(token)
  return { success: true }
}

export async function logoutAllOtherSessionsAction(): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { success: false, error: "Not authenticated" }
  const cookieStore = await cookies()
  const currentToken = cookieStore.get(SESSION_COOKIE_NAME)?.value || ""
  revokeOtherSessions(user.id, currentToken)
  return { success: true }
}
