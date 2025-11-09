import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser, isAdmin } from "@/lib/auth-server"
import {
  getServerUserById,
  updateServerUser,
} from "@/lib/storage-server"
import type { User, UserRole, UserStatus } from "@/lib/types"

/**
 * GET /api/admin/users/[id]
 * Get user details by ID
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
    const user = getServerUserById(id)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error("Error fetching user:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/admin/users/[id]
 * Update user: adjust roles, issue warning, mute/suspend
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

    const { id } = await context.params
    const user = getServerUserById(id)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const body = await request.json()
    const {
      action,
      roles,
      warningTemplate,
      muteExpiry,
      suspendExpiry,
      moderationCaseId,
    } = body

    const updates: Partial<User> = {}

    // Adjust roles
    if (action === "adjustRoles" && roles) {
      updates.roles = roles as UserRole[]
      // Also update legacy role field for backwards compatibility
      updates.role = roles[0] as UserRole
    }

    // Issue warning (increment strikes)
    if (action === "issueWarning") {
      const currentStrikes = user.strikes || 0
      updates.strikes = currentStrikes + 1

      // Optionally link to moderation case
      if (moderationCaseId) {
        updates.moderationCaseId = moderationCaseId
      }

      // Send notification (would be implemented with actual notification system)
      // await sendNotification(user.id, {
      //   type: "warning",
      //   template: warningTemplate,
      //   message: `You have received a warning. Total strikes: ${updates.strikes}`,
      // })
    }

    // Mute user
    if (action === "mute" && muteExpiry) {
      updates.status = "muted"
      updates.muteExpiry = muteExpiry

      // Send notification
      // await sendNotification(user.id, {
      //   type: "mute",
      //   message: `Your account has been muted until ${muteExpiry}`,
      // })
    }

    // Suspend user
    if (action === "suspend" && suspendExpiry) {
      updates.status = "suspended"
      updates.suspendExpiry = suspendExpiry

      // Send notification
      // await sendNotification(user.id, {
      //   type: "suspension",
      //   message: `Your account has been suspended until ${suspendExpiry}`,
      // })
    }

    // Update lastSeen if provided
    if (body.lastSeen) {
      updates.lastSeen = body.lastSeen
    }

    // Apply updates
    updateServerUser(id, updates)

    // Get updated user
    const updatedUser = getServerUserById(id)

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: "User updated successfully",
    })
  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
