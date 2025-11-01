import { NextRequest, NextResponse } from "next/server"
import { toggleWatch, isWatching, getWatchEntryByTarget } from "@/lib/storage"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, targetId, targetType, watchEvents } = body

    if (!userId || !targetId || !targetType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (!["post", "wiki"].includes(targetType)) {
      return NextResponse.json({ error: "Invalid targetType. Must be 'post' or 'wiki'" }, { status: 400 })
    }

    const defaultWatchEvents = watchEvents || ["update", "comment", "reaction"]
    
    const watchEntry = toggleWatch(userId, targetId, targetType, defaultWatchEvents)

    return NextResponse.json({
      success: true,
      watching: watchEntry.enabled,
      watchEntry,
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to toggle watch",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get("userId")
    const targetId = searchParams.get("targetId")
    const targetType = searchParams.get("targetType") as "post" | "wiki" | null

    if (!userId || !targetId || !targetType) {
      return NextResponse.json({ error: "Missing required query parameters" }, { status: 400 })
    }

    if (!["post", "wiki"].includes(targetType)) {
      return NextResponse.json({ error: "Invalid targetType. Must be 'post' or 'wiki'" }, { status: 400 })
    }

    const watching = isWatching(userId, targetId, targetType)
    const watchEntry = getWatchEntryByTarget(userId, targetId, targetType)

    return NextResponse.json({
      watching,
      watchEntry,
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to get watch status",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

