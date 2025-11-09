import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import type { ReportStatus, ReportPriority } from "@/lib/types"

// GET /api/reports/[id] - Get a specific report
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const report = await prisma.contentReport.findUnique({
      where: { id },
      include: {
        reason: true,
      },
    })

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 })
    }

    return NextResponse.json({ report })
  } catch (error) {
    console.error("Error fetching report:", error)
    return NextResponse.json({ error: "Failed to fetch report" }, { status: 500 })
  }
}

// PATCH /api/reports/[id] - Update a report
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json()
    const { status, priority, assignedTo, notes } = body

    const updateData: any = {}
    if (status) updateData.status = status
    if (priority) updateData.priority = priority
    if (assignedTo !== undefined) updateData.assignedTo = assignedTo
    if (notes !== undefined) updateData.notes = notes
    if (status === "resolved" || status === "dismissed") {
      updateData.resolvedAt = new Date()
    }

    const { id } = await context.params
    const report = await prisma.contentReport.update({
      where: { id },
      data: updateData,
      include: {
        reason: true,
      },
    })

    // If resolved, update moderation queue
    if (status === "resolved" || status === "dismissed") {
      await prisma.moderationQueue.updateMany({
        where: {
          contentType: report.contentType,
          contentId: report.contentId,
        },
        data: {
          status: "resolved",
          reviewedAt: new Date(),
        },
      })
    }

    return NextResponse.json({ report })
  } catch (error) {
    console.error("Error updating report:", error)
    return NextResponse.json({ error: "Failed to update report" }, { status: 500 })
  }
}
