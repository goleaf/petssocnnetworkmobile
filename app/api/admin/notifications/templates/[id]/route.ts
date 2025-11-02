import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser, isAdmin } from "@/lib/auth-server"
import { prisma } from "@/lib/db"
import { writeAudit } from "@/lib/audit"

/**
 * GET /api/admin/notifications/templates/[id]
 * Get a single template by ID
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
    const template = await prisma.notificationTemplate.findUnique({
      where: { id },
    })

    if (!template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ template })
  } catch (error) {
    console.error("Error fetching template:", error)
    return NextResponse.json(
      { error: "Failed to fetch template" },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/admin/notifications/templates/[id]
 * Update a template
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

    // Check if template exists
    const existing = await prisma.notificationTemplate.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      )
    }

    // Validate type if provided
    if (body.type) {
      const validTypes = ["email", "push", "in_app"]
      if (!validTypes.includes(body.type)) {
        return NextResponse.json(
          { error: `Type must be one of: ${validTypes.join(", ")}` },
          { status: 400 }
        )
      }
    }

    // Validate subject requirement
    const finalType = body.type || existing.type
    if ((finalType === "email" || finalType === "push") && body.subject === "") {
      return NextResponse.json(
        { error: "Subject is required for email and push notifications" },
        { status: 400 }
      )
    }

    // Prepare update data
    const updateData: any = {}
    if (body.name !== undefined) updateData.name = body.name
    if (body.type !== undefined) updateData.type = body.type
    if (body.subject !== undefined) updateData.subject = body.subject
    if (body.body !== undefined) updateData.body = body.body
    if (body.variables !== undefined) updateData.variables = body.variables
    if (body.enabled !== undefined) updateData.enabled = body.enabled

    const template = await prisma.notificationTemplate.update({
      where: { id },
      data: updateData,
    })

    // Audit log
    await writeAudit({
      actorId: currentUser.id,
      action: "update",
      targetType: "notification_template",
      targetId: id,
      metadata: { changes: Object.keys(updateData) },
    })

    return NextResponse.json({ template })
  } catch (error) {
    console.error("Error updating template:", error)
    return NextResponse.json(
      { error: "Failed to update template" },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/notifications/templates/[id]
 * Delete a template
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

    // Check if template exists
    const existing = await prisma.notificationTemplate.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      )
    }

    await prisma.notificationTemplate.delete({
      where: { id },
    })

    // Audit log
    await writeAudit({
      actorId: currentUser.id,
      action: "delete",
      targetType: "notification_template",
      targetId: id,
      metadata: { name: existing.name },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting template:", error)
    return NextResponse.json(
      { error: "Failed to delete template" },
      { status: 500 }
    )
  }
}

