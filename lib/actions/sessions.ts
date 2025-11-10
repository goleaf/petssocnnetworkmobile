"use server"

import { cookies, headers } from "next/headers"
import { getCurrentUser, SESSION_MAX_AGE } from "../auth-server"
import { prisma } from "../prisma"
import { SESSION_COOKIE_NAME } from "../auth-server"
import * as UAParser from "ua-parser-js"

export interface ActiveSessionDto {
  token: string
  customName?: string
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

/**
 * Helper function to parse device information from User-Agent
 */
function parseDeviceInfo(userAgent?: string) {
  if (!userAgent) {
    return {
      deviceName: "Unknown Device",
      deviceType: "desktop" as const,
      os: "Unknown",
      browser: "Unknown",
    }
  }

  const parser = new (UAParser as any)(userAgent)
  const result = parser.getResult()

  let deviceType: "mobile" | "tablet" | "desktop" = "desktop"
  if (result.device.type === "mobile") deviceType = "mobile"
  else if (result.device.type === "tablet") deviceType = "tablet"

  const deviceName = result.device.model || result.device.vendor || result.os.name || "Unknown Device"
  const os = result.os.name || "Unknown"
  const browser = result.browser.name || "Unknown"

  return { deviceName, deviceType, os, browser }
}

/**
 * Helper function to perform IP geolocation (simplified)
 */
function geolocateIp(ip?: string): { city?: string; country?: string } {
  if (!ip) return {}
  if (ip.startsWith("127.")) return { city: "Localhost", country: "—" }
  if (ip.startsWith("192.168.") || ip.startsWith("10.") || ip.startsWith("172.16.")) {
    return { city: "Private", country: "LAN" }
  }
  // In production, use a real geolocation service like MaxMind or ipapi
  return { city: "Unknown", country: "Unknown" }
}

export async function getActiveSessionsAction(): Promise<{ success: boolean; sessions?: ActiveSessionDto[]; error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { success: false, error: "Not authenticated" }
  
  const cookieStore = await cookies()
  const currentToken = cookieStore.get(SESSION_COOKIE_NAME)?.value

  // Fetch active sessions from database
  const sessions = await prisma.session.findMany({
    where: {
      userId: user.id,
      revoked: false,
      expiresAt: { gt: new Date() },
    },
    orderBy: { lastActivityAt: "desc" },
  })

  // Ensure current session exists in database
  if (currentToken && !sessions.find((s: any) => s.token === currentToken)) {
    const headersList = await headers()
    const userAgent = headersList.get("user-agent") || undefined
    const forwarded = headersList.get("x-forwarded-for")
    const ip = forwarded ? forwarded.split(",")[0].trim() : headersList.get("x-real-ip") || undefined
    
    const deviceInfo = parseDeviceInfo(userAgent)
    const location = geolocateIp(ip)
    
    // Create session in database
    await prisma.session.create({
      data: {
        userId: user.id,
        token: currentToken,
        deviceName: deviceInfo.deviceName,
        deviceType: deviceInfo.deviceType,
        os: deviceInfo.os,
        browser: deviceInfo.browser,
        ip,
        city: location.city,
        country: location.country,
        expiresAt: new Date(Date.now() + SESSION_MAX_AGE * 1000),
      },
    })
    
    // Refetch sessions
    const updatedSessions = await prisma.session.findMany({
      where: {
        userId: user.id,
        revoked: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { lastActivityAt: "desc" },
    })
    
    const data = updatedSessions.map((s: any) => ({
      token: s.token,
      customName: s.customName || undefined,
      deviceName: s.deviceName || undefined,
      deviceType: s.deviceType || undefined,
      os: s.os || undefined,
      browser: s.browser || undefined,
      ip: s.ip || undefined,
      city: s.city || undefined,
      country: s.country || undefined,
      createdAt: s.createdAt.toISOString(),
      lastActivityAt: s.lastActivityAt.toISOString(),
      revoked: s.revoked,
      isCurrent: s.token === currentToken,
    }))
    
    return { success: true, sessions: data }
  }

  const data = sessions.map((s: any) => ({
    token: s.token,
    customName: s.customName || undefined,
    deviceName: s.deviceName || undefined,
    deviceType: s.deviceType || undefined,
    os: s.os || undefined,
    browser: s.browser || undefined,
    ip: s.ip || undefined,
    city: s.city || undefined,
    country: s.country || undefined,
    createdAt: s.createdAt.toISOString(),
    lastActivityAt: s.lastActivityAt.toISOString(),
    revoked: s.revoked,
    isCurrent: !!currentToken && s.token === currentToken,
  }))
  
  return { success: true, sessions: data }
}

export async function logoutSessionAction(token: string): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { success: false, error: "Not authenticated" }
  
  // Only allow revoking sessions that belong to the current user
  const session = await prisma.session.findUnique({
    where: { token },
    select: { userId: true },
  })
  
  if (!session || session.userId !== user.id) {
    return { success: false, error: "Session not found" }
  }
  
  // Revoke the session
  await prisma.session.update({
    where: { token },
    data: { revoked: true },
  })
  
  return { success: true }
}

export async function logoutAllOtherSessionsAction(): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { success: false, error: "Not authenticated" }
  
  const cookieStore = await cookies()
  const currentToken = cookieStore.get(SESSION_COOKIE_NAME)?.value || ""
  
  // Revoke all sessions except the current one
  await prisma.session.updateMany({
    where: {
      userId: user.id,
      token: { not: currentToken },
    },
    data: { revoked: true },
  })
  
  return { success: true }
}

export async function renameSessionDeviceAction(token: string, name: string): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { success: false, error: "Not authenticated" }
  
  if (!token || !name || name.trim().length === 0) {
    return { success: false, error: "Invalid name" }
  }
  
  // Ensure this token belongs to the current user
  const session = await prisma.session.findUnique({
    where: { token },
    select: { userId: true },
  })
  
  if (!session || session.userId !== user.id) {
    return { success: false, error: "Session not found" }
  }
  
  // Update the custom name
  await prisma.session.update({
    where: { token },
    data: { customName: name.trim() },
  })
  
  return { success: true }
}
