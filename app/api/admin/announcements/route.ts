import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser, isAdmin } from "@/lib/auth-server"
import { prisma } from "@/lib/db"
import { writeAudit } from "@/lib/audit"

/**
 * GET /api/admin/announcements
 * List all announcements with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser || !(await isAdmin())) {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 403 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get("status")
    const priority = searchParams.get("priority")
    const page = parseInt(searchParams.get("page") || "1", 10)
    const limit = parseInt(searchParams.get("limit") || "50", 10)
    const skip = (page - 1) * limit

    const where: any = {}
    if (status) {
      where.status = status
    }
    if (priority) {
      where.priority = priority
    }

    const [announcements, total] = await Promise.all([
      prisma.announcement.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.announcement.count({ where }),
    ])

    return NextResponse.json({
      announcements,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching announcements:", error)
    return NextResponse.json(
      { error: "Failed to fetch announcements" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/announcements
 * Create a new announcement
 */
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser || !(await isAdmin())) {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { title, body: bodyContent, startAt, endAt, priority, dismissible, status } = body

    // Validation
    if (!title || !bodyContent) {
      return NextResponse.json(
        { error: "Title and body are required" },
        { status: 400 }
      )
    }

    // Validate time window
    if (startAt && endAt) {
      const start = new Date(startAt)
      const end = new Date(endAt)
      if (start >= end) {
        return NextResponse.json(
          { error: "endAt must be after startAt" },
          { status: 400 }
        )
      }
    }

    // Validate priority
    const validPriorities = ["low", "normal", "high", "urgent"]
    if (priority && !validPriorities.includes(priority)) {
      return NextResponse.json(
        { error: `Priority must be one of: ${validPriorities.join(", ")}` },
        { status: 400 }
      )
    }

    // Validate status
    const validStatuses = ["draft", "active", "expired", "archived"]
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Status must be one of: ${validStatuses.join(", ")}` },
        { status: 400 }
      )
    }

    const announcement = await prisma.announcement.create({
      data: {
        title,
        body: bodyContent,
        startAt: startAt ? new Date(startAt) : null,
        endAt: endAt ? new Date(endAt) : null,
        priority: priority || "normal",
        dismissible: dismissible !== undefined ? dismissible : true,
        status: status || "draft",
        createdBy: currentUser.id,
      },
    })

    // Audit log
    await writeAudit({
      actorId: currentUser.id,
      action: "create",
      targetType: "announcement",
      targetId: announcement.id,
      metadata: { title, priority, status },
    })

    return NextResponse.json({ announcement }, { status: 201 })
  } catch (error) {
    console.error("Error creating announcement:", error)
    return NextResponse.json(
      { error: "Failed to create announcement" },
      { status: 500 }
    )
  }
}

