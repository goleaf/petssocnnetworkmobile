import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser, isAdmin } from "@/lib/auth-server"
import { prisma } from "@/lib/db"
import { writeAudit } from "@/lib/audit"

/**
 * GET /api/admin/notifications/templates
 * List all notification templates
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
    const type = searchParams.get("type")
    const enabled = searchParams.get("enabled")
    const page = parseInt(searchParams.get("page") || "1", 10)
    const limit = parseInt(searchParams.get("limit") || "50", 10)
    const skip = (page - 1) * limit

    const where: any = {}
    if (type) {
      where.type = type
    }
    if (enabled !== null && enabled !== undefined) {
      where.enabled = enabled === "true"
    }

    const [templates, total] = await Promise.all([
      prisma.notificationTemplate.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.notificationTemplate.count({ where }),
    ])

    return NextResponse.json({
      templates,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching templates:", error)
    return NextResponse.json(
      { error: "Failed to fetch templates" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/notifications/templates
 * Create a new notification template
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
    const { name, type, subject, body: bodyContent, variables, enabled } = body

    // Validation
    if (!name || !type || !bodyContent) {
      return NextResponse.json(
        { error: "Name, type, and body are required" },
        { status: 400 }
      )
    }

    // Validate type
    const validTypes = ["email", "push", "in_app"]
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Type must be one of: ${validTypes.join(", ")}` },
        { status: 400 }
      )
    }

    // Subject is required for email and push
    if ((type === "email" || type === "push") && !subject) {
      return NextResponse.json(
        { error: "Subject is required for email and push notifications" },
        { status: 400 }
      )
    }

    const template = await prisma.notificationTemplate.create({
      data: {
        name,
        type,
        subject: subject || null,
        body: bodyContent,
        variables: variables || null,
        enabled: enabled !== undefined ? enabled : true,
        createdBy: currentUser.id,
      },
    })

    // Audit log
    await writeAudit({
      actorId: currentUser.id,
      action: "create",
      targetType: "notification_template",
      targetId: template.id,
      metadata: { name, type },
    })

    return NextResponse.json({ template }, { status: 201 })
  } catch (error) {
    console.error("Error creating template:", error)
    return NextResponse.json(
      { error: "Failed to create template" },
      { status: 500 }
    )
  }
}

