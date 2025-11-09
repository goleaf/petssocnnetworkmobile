import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser, isAdmin } from "@/lib/auth-server"
import type { PrivacyRequest, PrivacyRequestStatus } from "@/lib/types"

// Mock storage - replace with actual database calls
let mockPrivacyRequests: PrivacyRequest[] = []

/**
 * GET /api/admin/privacy/[id]
 * Get a specific privacy request by ID
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser || !(await isAdmin())) {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 403 }
      )
    }

    const { id } = await context.params
    const request = mockPrivacyRequests.find((req) => req.id === id)

    if (!request) {
      return NextResponse.json(
        { error: "Request not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ request }, { status: 200 })
  } catch (error) {
    console.error("Error fetching privacy request:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/admin/privacy/[id]
 * Update a privacy request (assign, complete, reject, etc.)
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser || !(await isAdmin())) {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { action, notes, rejectionReason } = body

    const { id } = await context.params
    const requestIndex = mockPrivacyRequests.findIndex((req) => req.id === id)

    if (requestIndex === -1) {
      return NextResponse.json(
        { error: "Request not found" },
        { status: 404 }
      )
    }

    const existingRequest = mockPrivacyRequests[requestIndex]
    const updatedRequest: PrivacyRequest = { ...existingRequest }

    switch (action) {
      case "assign":
        updatedRequest.assignedTo = currentUser.id
        updatedRequest.status = "in_progress"
        updatedRequest.startedAt = new Date().toISOString()
        break

      case "complete":
        if (existingRequest.status !== "in_progress") {
          return NextResponse.json(
            { error: "Can only complete requests in progress" },
            { status: 400 }
          )
        }
        updatedRequest.status = "completed"
        updatedRequest.completedAt = new Date().toISOString()
        break

      case "reject":
        if (!rejectionReason) {
          return NextResponse.json(
            { error: "Rejection reason is required" },
            { status: 400 }
          )
        }
        updatedRequest.status = "rejected"
        updatedRequest.rejectionReason = rejectionReason
        break

      case "update_status":
        const { status } = body
        if (!["pending", "in_progress", "completed", "rejected", "cancelled"].includes(status)) {
          return NextResponse.json(
            { error: "Invalid status" },
            { status: 400 }
          )
        }
        updatedRequest.status = status as PrivacyRequestStatus
        if (status === "in_progress" && !updatedRequest.startedAt) {
          updatedRequest.startedAt = new Date().toISOString()
        }
        if (status === "completed" && !updatedRequest.completedAt) {
          updatedRequest.completedAt = new Date().toISOString()
        }
        break

      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        )
    }

    // Add notes if provided
    if (notes) {
      updatedRequest.adminNotes = [
        ...(updatedRequest.adminNotes || []),
        `${new Date().toISOString()}: ${notes}`,
      ]
    }

    mockPrivacyRequests[requestIndex] = updatedRequest

    return NextResponse.json(
      { request: updatedRequest },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error updating privacy request:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
