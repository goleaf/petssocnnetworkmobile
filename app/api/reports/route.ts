import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import type { ContentReport, ReportStatus, ReportPriority } from "@/lib/types"

// GET /api/reports - Get reports with filtering
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get("status") as ReportStatus | null
    const priority = searchParams.get("priority") as ReportPriority | null
    const contentType = searchParams.get("contentType")
    const assignedTo = searchParams.get("assignedTo")
    const page = parseInt(searchParams.get("page") || "1")
    const pageSize = parseInt(searchParams.get("pageSize") || "20")

    const where: any = {}
    if (status) where.status = status
    if (priority) where.priority = priority
    if (contentType) where.contentType = contentType
    if (assignedTo) where.assignedTo = assignedTo

    const [reports, total] = await Promise.all([
      prisma.contentReport.findMany({
        where,
        include: {
          reason: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.contentReport.count({ where }),
    ])

    return NextResponse.json({
      reports,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    })
  } catch (error) {
    console.error("Error fetching reports:", error)
    return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 })
  }
}

// POST /api/reports - Create a new report
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { reporterId, contentType, contentId, reasonId, customReason, description } = body

    if (!reporterId || !contentType || !contentId || !reasonId) {
      return NextResponse.json(
        { error: "Missing required fields: reporterId, contentType, contentId, reasonId" },
        { status: 400 }
      )
    }

    // Get reason to determine priority
    const reason = await prisma.reportReason.findUnique({
      where: { id: reasonId },
    })

    if (!reason) {
      return NextResponse.json({ error: "Invalid report reason" }, { status: 400 })
    }

    // Map severity to priority
    const severityToPriority: Record<string, ReportPriority> = {
      low: "low",
      medium: "medium",
      high: "high",
      critical: "urgent",
    }

    const priority = severityToPriority[reason.severity] || "low"

    // Create the report
    const report = await prisma.contentReport.create({
      data: {
        reporterId,
        contentType,
        contentId,
        reasonId,
        customReason,
        description,
        priority,
        status: "pending",
      },
      include: {
        reason: true,
      },
    })

    // Update or create moderation queue entry
    await prisma.moderationQueue.upsert({
      where: {
        contentType_contentId: {
          contentType,
          contentId,
        },
      },
      create: {
        contentType,
        contentId,
        priority,
        reportedBy: [reporterId],
        reportCount: 1,
        status: "pending",
      },
      update: {
        reportedBy: {
          push: reporterId,
        },
        reportCount: {
          increment: 1,
        },
        priority: priority, // Update if higher priority
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({ report }, { status: 201 })
  } catch (error) {
    console.error("Error creating report:", error)
    return NextResponse.json({ error: "Failed to create report" }, { status: 500 })
  }
}

