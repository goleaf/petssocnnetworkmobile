import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser, isAdmin } from "@/lib/auth-server"
import { prisma } from "@/lib/db"
import { writeAudit } from "@/lib/audit"

/**
 * GET /api/admin/announcements/[id]
 * Get a single announcement by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser || !(await isAdmin())) {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 403 }
      )
    }

    const { id } = await params
    const announcement = await prisma.announcement.findUnique({
      where: { id },
    })

    if (!announcement) {
      return NextResponse.json(
        { error: "Announcement not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ announcement })
  } catch (error) {
    console.error("Error fetching announcement:", error)
    return NextResponse.json(
      { error: "Failed to fetch announcement" },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/admin/announcements/[id]
 * Update an announcement
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser || !(await isAdmin())) {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 403 }
      )
    }

    const { id } = await params
    const body = await request.json()

    // Check if announcement exists
    const existing = await prisma.announcement.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json(
        { error: "Announcement not found" },
        { status: 404 }
      )
    }

    // Validate time window if both dates are provided
    if (body.startAt && body.endAt) {
      const start = new Date(body.startAt)
      const end = new Date(body.endAt)
      if (start >= end) {
        return NextResponse.json(
          { error: "endAt must be after startAt" },
          { status: 400 }
        )
      }
    }

    // Validate priority if provided
    if (body.priority) {
      const validPriorities = ["low", "normal", "high", "urgent"]
      if (!validPriorities.includes(body.priority)) {
        return NextResponse.json(
          { error: `Priority must be one of: ${validPriorities.join(", ")}` },
          { status: 400 }
        )
      }
    }

    // Validate status if provided
    if (body.status) {
      const validStatuses = ["draft", "active", "expired", "archived"]
      if (!validStatuses.includes(body.status)) {
        return NextResponse.json(
          { error: `Status must be one of: ${validStatuses.join(", ")}` },
          { status: 400 }
        )
      }
    }

    // Prepare update data
    const updateData: any = {}
    if (body.title !== undefined) updateData.title = body.title
    if (body.body !== undefined) updateData.body = body.body
    if (body.startAt !== undefined) updateData.startAt = body.startAt ? new Date(body.startAt) : null
    if (body.endAt !== undefined) updateData.endAt = body.endAt ? new Date(body.endAt) : null
    if (body.priority !== undefined) updateData.priority = body.priority
    if (body.dismissible !== undefined) updateData.dismissible = body.dismissible
    if (body.status !== undefined) updateData.status = body.status

    const announcement = await prisma.announcement.update({
      where: { id },
      data: updateData,
    })

    // Audit log
    await writeAudit({
      actorId: currentUser.id,
      action: "update",
      targetType: "announcement",
      targetId: id,
      metadata: { changes: Object.keys(updateData) },
    })

    return NextResponse.json({ announcement })
  } catch (error) {
    console.error("Error updating announcement:", error)
    return NextResponse.json(
      { error: "Failed to update announcement" },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/announcements/[id]
 * Delete an announcement
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser || !(await isAdmin())) {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 403 }
      )
    }

    const { id } = await params

    // Check if announcement exists
    const existing = await prisma.announcement.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json(
        { error: "Announcement not found" },
        { status: 404 }
      )
    }

    await prisma.announcement.delete({
      where: { id },
    })

    // Audit log
    await writeAudit({
      actorId: currentUser.id,
      action: "delete",
      targetType: "announcement",
      targetId: id,
      metadata: { title: existing.title },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting announcement:", error)
    return NextResponse.json(
      { error: "Failed to delete announcement" },
      { status: 500 }
    )
  }
}

