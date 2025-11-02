import { NextRequest, NextResponse } from "next/server"
import { addNotification } from "@/lib/notifications"
import { checkRateLimit } from "@/lib/rate-limit"
import { validateCSRFToken } from "@/lib/csrf"
import type { Notification, NotificationChannel, NotificationPriority, NotificationCategory } from "@/lib/types"

type Locale = "en" | "es" | "fr" | "de" | "pt"
type Role = "admin" | "moderator" | "all"
type Group = "vets" | "shelters" | "all"

interface NotificationPayload {
  template: "email" | "push" | "in_app"
  title: string
  message: string
  priority: NotificationPriority
  category: NotificationCategory
  locales: Locale[]
  roles: Role[]
  groups: Group[]
  rateLimitEnabled: boolean
  rateLimitValue: number
  quietHoursEnabled: boolean
  quietHoursStart: string
  quietHoursEnd: string
}

interface NotificationAuditLog {
  id: string
  timestamp: string
  adminId: string
  notificationId: string
  template: string
  title: string
  targetCount: number
  segments: {
    locales: Locale[]
    roles: Role[]
    groups: Group[]
  }
  settings: {
    rateLimit: number | null
    quietHours: { start: string; end: string } | null
  }
}

// Audit logs would be stored in database in production
// For now, we'll return empty arrays
function saveAuditLog(entry: NotificationAuditLog) {
  // In production, save to database
  console.log("Audit log entry:", entry)
}

function getAuditLogs(limit = 50): NotificationAuditLog[] {
  // In production, fetch from database
  return []
}

function getTargetUserIds(roles: Role[], groups: Group[]): string[] {
  // In a real app, this would query the database
  // For now, we'll simulate with mock data
  const mockUsers = [
    { id: "user_1", role: "admin" as const, group: "all" as const },
    { id: "user_2", role: "moderator" as const, group: "vets" as const },
    { id: "user_3", role: "all" as const, group: "shelters" as const },
  ]

  return mockUsers
    .filter((user) => roles.includes("all") || roles.includes(user.role) || (user.role === "all" && roles.includes("all")))
    .filter((user) => groups.includes("all") || groups.includes(user.group))
    .map((user) => user.id)
}

function shouldDeliverDuringQuietHours(quietHours: { start: string; end: string }): boolean {
  const now = new Date()
  const [startHour, startMin] = quietHours.start.split(":").map(Number)
  const [endHour, endMin] = quietHours.end.split(":").map(Number)

  const startTime = new Date()
  startTime.setHours(startHour, startMin, 0, 0)

  const endTime = new Date()
  endTime.setHours(endHour, endMin, 0, 0)

  // Handle overnight quiet hours (e.g., 22:00 to 08:00)
  if (endTime < startTime) {
    return now >= startTime || now < endTime
  }

  return now >= startTime && now < endTime
}

export async function POST(request: NextRequest) {
  try {
    const body: NotificationPayload = await request.json()

    // CSRF protection - check for CSRF token in headers
    const csrfToken = request.headers.get("x-csrf-token")
    if (!csrfToken || !validateCSRFToken(csrfToken)) {
      return NextResponse.json({ error: "Invalid or missing CSRF token" }, { status: 403 })
    }

    // Rate limiting for admin actions
    const rateLimitKey = "admin:notification:send"
    const rateLimitCheck = checkRateLimit(rateLimitKey, { maxAttempts: 10, windowMs: 60000, blockDurationMs: 300000 })

    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded", retryAfter: rateLimitCheck.retryAfter },
        { status: 429 },
      )
    }

    // Validate payload
    if (!body.message || body.message.trim().length === 0) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    if (!body.title && (body.template === "email" || body.template === "push")) {
      return NextResponse.json({ error: "Title is required for email and push notifications" }, { status: 400 })
    }

    // Check quiet hours
    if (body.quietHoursEnabled) {
      const inQuietHours = shouldDeliverDuringQuietHours({
        start: body.quietHoursStart,
        end: body.quietHoursEnd,
      })

      if (inQuietHours) {
        return NextResponse.json(
          { error: "Quiet hours active - delivery delayed", scheduled: true },
          { status: 202 },
        )
      }
    }

    // Get target user IDs
    const targetUserIds = getTargetUserIds(body.roles, body.groups)

    if (targetUserIds.length === 0) {
      return NextResponse.json({ error: "No users match the selected criteria" }, { status: 400 })
    }

    // Determine notification channels based on template
    const channels: NotificationChannel[] = [body.template]

    // Create notifications for each target user
    // Note: In a real app, these would be stored in a database
    // For now, we'll simulate by returning success
    const notificationIds: string[] = []

    for (const userId of targetUserIds) {
      // Apply per-user rate limiting if enabled
      if (body.rateLimitEnabled) {
        const userRateLimitKey = `notification:${userId}`
        const userRateLimitCheck = checkRateLimit(userRateLimitKey, {
          maxAttempts: body.rateLimitValue,
          windowMs: 3600000, // 1 hour
        })

        if (!userRateLimitCheck.allowed) {
          continue // Skip this user if rate limited
        }
      }

      const notification: Notification = {
        id: `notif_${Date.now()}_${Math.random().toString(16).slice(2)}`,
        userId,
        type: "post", // Using "post" as a generic type for admin notifications
        actorId: "system",
        targetId: "admin_notification",
        targetType: "post",
        message: body.message,
        read: false,
        createdAt: new Date().toISOString(),
        priority: body.priority,
        category: body.category,
        channels,
        metadata: {
          adminNotification: true,
          title: body.title,
          template: body.template,
        },
      }

      // In production, save to database and trigger delivery
      // For now, we'll queue the notification
      // The client-side notification system will pick it up
      notificationIds.push(notification.id)
      
      // Note: addNotification is client-side only
      // In production, use a queue system or database
      console.log("Notification queued:", notification)
    }

    // Record audit log
    const auditEntry: NotificationAuditLog = {
      id: `audit_${Date.now()}_${Math.random().toString(16).slice(2)}`,
      timestamp: new Date().toISOString(),
      adminId: "admin_user", // In real app, get from session
      notificationId: notificationIds[0] || "unknown",
      template: body.template,
      title: body.title,
      targetCount: notificationIds.length,
      segments: {
        locales: body.locales,
        roles: body.roles,
        groups: body.groups,
      },
      settings: {
        rateLimit: body.rateLimitEnabled ? body.rateLimitValue : null,
        quietHours: body.quietHoursEnabled
          ? {
              start: body.quietHoursStart,
              end: body.quietHoursEnd,
            }
          : null,
      },
    }

    saveAuditLog(auditEntry)

    return NextResponse.json({
      success: true,
      sent: notificationIds.length,
      total: targetUserIds.length,
      notifications: notificationIds,
    })
  } catch (error) {
    console.error("Error sending notification:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// GET endpoint to retrieve audit logs
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const limit = Number.parseInt(searchParams.get("limit") || "50", 10)

    const logs = getAuditLogs(limit)

    return NextResponse.json({
      success: true,
      logs,
      total: logs.length,
    })
  } catch (error) {
    console.error("Error retrieving audit logs:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

