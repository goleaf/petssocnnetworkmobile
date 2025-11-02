import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser, isAdmin } from "@/lib/auth-server"
import type { PrivacyRequest, PrivacyRequestStatus, PrivacyRequestType, PrivacyRequestMetrics } from "@/lib/types"
import { differenceInMinutes, isAfter } from "date-fns"

// Mock storage - replace with actual database calls
let mockPrivacyRequests: PrivacyRequest[] = [
  {
    id: "1",
    userId: "user1",
    type: "data_export",
    status: "pending",
    requestedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    slaDeadline: new Date(Date.now() + 22 * 60 * 60 * 1000).toISOString(),
    slaWarningThreshold: 60,
    priority: "normal",
    metadata: { exportFormat: "json" },
  },
  {
    id: "2",
    userId: "user2",
    type: "data_deletion",
    status: "in_progress",
    requestedAt: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
    startedAt: new Date(Date.now() - 19 * 60 * 60 * 1000).toISOString(),
    slaDeadline: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
    slaWarningThreshold: 60,
    priority: "urgent",
    assignedTo: "admin1",
  },
]

/**
 * GET /api/admin/privacy
 * Returns paginated list of privacy requests with filters
 * Requires admin role
 */
export async function GET(request: NextRequest) {
  try {
    // Check admin permission
    const currentUser = await getCurrentUser()
    if (!currentUser || !(await isAdmin())) {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 403 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get("status") as PrivacyRequestStatus | null
    const type = searchParams.get("type") as PrivacyRequestType | null
    const priority = searchParams.get("priority") || ""
    const search = searchParams.get("search") || ""
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")

    // Filter requests
    let filtered = [...mockPrivacyRequests]

    if (status) {
      filtered = filtered.filter((req) => req.status === status)
    }

    if (type) {
      filtered = filtered.filter((req) => req.type === type)
    }

    if (priority) {
      filtered = filtered.filter((req) => req.priority === priority)
    }

    if (search) {
      const searchLower = search.toLowerCase()
      filtered = filtered.filter(
        (req) =>
          req.id.toLowerCase().includes(searchLower) ||
          req.userId.toLowerCase().includes(searchLower) ||
          req.type.toLowerCase().includes(searchLower)
      )
    }

    // Sort by priority and SLA deadline
    filtered.sort((a, b) => {
      const priorityOrder = { urgent: 4, high: 3, normal: 2, low: 1 }
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority]
      if (priorityDiff !== 0) return priorityDiff

      const aDeadline = new Date(a.slaDeadline)
      const bDeadline = new Date(b.slaDeadline)
      return aDeadline.getTime() - bDeadline.getTime()
    })

    // Apply pagination
    const total = filtered.length
    const start = (page - 1) * limit
    const end = start + limit
    const paginated = filtered.slice(start, end)

    return NextResponse.json(
      {
        requests: paginated,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    )
  } catch (error) {
    console.error("Error fetching privacy requests:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/privacy
 * Create a new privacy request (for users to submit)
 */
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { type, metadata } = body

    if (!type || !["data_export", "data_deletion", "content_takedown"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid request type" },
        { status: 400 }
      )
    }

    // Calculate SLA deadline based on request type
    const slaHours = {
      data_export: 24,
      data_deletion: 30,
      content_takedown: 48,
    }

    const now = new Date()
    const deadline = new Date(now.getTime() + slaHours[type as PrivacyRequestType] * 60 * 60 * 1000)

    const newRequest: PrivacyRequest = {
      id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: currentUser.id,
      type: type as PrivacyRequestType,
      status: "pending",
      requestedAt: now.toISOString(),
      slaDeadline: deadline.toISOString(),
      slaWarningThreshold: 60, // 60 minutes before deadline
      priority: "normal",
      metadata: metadata || {},
    }

    mockPrivacyRequests.push(newRequest)

    return NextResponse.json(
      { request: newRequest },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error creating privacy request:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

