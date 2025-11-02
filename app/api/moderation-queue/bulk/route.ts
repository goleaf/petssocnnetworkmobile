import { NextRequest, NextResponse } from "next/server"
import {
  bulkProcessModerationActions,
  getQueueItemsByType,
} from "@/lib/utils/moderation-queue"
import type {
  ModerationContentType,
  ModerationAction,
} from "@/lib/types"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { items } = body as {
      items: Array<{
        queueItemId: string
        action: ModerationAction
        performedBy: string
        justification: string
      }>
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Items array is required and must not be empty" },
        { status: 400 }
      )
    }

    // Validate all items have required fields
    for (const item of items) {
      if (!item.queueItemId || !item.action || !item.performedBy || !item.justification) {
        return NextResponse.json(
          { error: "All items must have queueItemId, action, performedBy, and justification" },
          { status: 400 }
        )
      }
    }

    const result = bulkProcessModerationActions(items)

    return NextResponse.json({
      success: true,
      ...result,
    })
  } catch (error) {
    console.error("Error processing bulk actions:", error)
    return NextResponse.json(
      { error: "Failed to process bulk actions" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const contentType = searchParams.get("contentType") as ModerationContentType | null
    const page = parseInt(searchParams.get("page") || "1", 10)
    const pageSize = parseInt(searchParams.get("pageSize") || "20", 10)
    const status = searchParams.get("status") as "pending" | "in_review" | "resolved" | null
    const sortBy = searchParams.get("sortBy") as "priority" | "aiScore" | "createdAt" | null
    const sortOrder = searchParams.get("sortOrder") as "asc" | "desc" | null

    if (!contentType) {
      return NextResponse.json(
        { error: "contentType query parameter is required" },
        { status: 400 }
      )
    }

    const result = getQueueItemsByType(
      contentType,
      { page, pageSize },
      {
        status: status || undefined,
        sortBy: sortBy || undefined,
        sortOrder: sortOrder || undefined,
      }
    )

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error fetching queue items:", error)
    return NextResponse.json(
      { error: "Failed to fetch queue items" },
      { status: 500 }
    )
  }
}

