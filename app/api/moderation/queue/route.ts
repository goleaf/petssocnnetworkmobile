import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import type { ReportPriority } from "@/lib/types"

// GET /api/moderation/queue - Get moderation queue
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get("status")
    const priority = searchParams.get("priority") as ReportPriority | null
    const assignedTo = searchParams.get("assignedTo")
    const page = parseInt(searchParams.get("page") || "1")
    const pageSize = parseInt(searchParams.get("pageSize") || "20")

    const where: any = {}
    if (status) where.status = status
    if (priority) where.priority = priority
    if (assignedTo) where.assignedTo = assignedTo

    const [items, total] = await Promise.all([
      prisma.moderationQueue.findMany({
        where,
        orderBy: [
          { priority: "desc" }, // urgent > high > medium > low
          { createdAt: "asc" }, // oldest first
        ],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.moderationQueue.count({ where }),
    ])

    return NextResponse.json({
      items,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    })
  } catch (error) {
    console.error("Error fetching moderation queue:", error)
    return NextResponse.json({ error: "Failed to fetch moderation queue" }, { status: 500 })
  }
}

// PATCH /api/moderation/queue - Update queue item
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { contentType, contentId, status, assignedTo, priority } = body

    if (!contentType || !contentId) {
      return NextResponse.json(
        { error: "Missing required fields: contentType, contentId" },
        { status: 400 }
      )
    }

    const updateData: any = {}
    if (status) updateData.status = status
    if (assignedTo !== undefined) updateData.assignedTo = assignedTo
    if (priority) updateData.priority = priority
    if (status === "in_review" || status === "resolved") {
      updateData.reviewedAt = new Date()
    }

    const item = await prisma.moderationQueue.update({
      where: {
        contentType_contentId: {
          contentType,
          contentId,
        },
      },
      data: updateData,
    })

    return NextResponse.json({ item })
  } catch (error) {
    console.error("Error updating moderation queue:", error)
    return NextResponse.json({ error: "Failed to update moderation queue" }, { status: 500 })
  }
}
