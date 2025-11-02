import { NextRequest, NextResponse } from "next/server"
import { setCloseFriends } from "@/lib/storage"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, closeFriendIds } = body

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 })
    }

    if (!Array.isArray(closeFriendIds)) {
      return NextResponse.json(
        { error: "closeFriendIds must be an array" },
        { status: 400 },
      )
    }

    // Validate all IDs are strings
    if (!closeFriendIds.every((id) => typeof id === "string")) {
      return NextResponse.json(
        { error: "All closeFriendIds must be strings" },
        { status: 400 },
      )
    }

    setCloseFriends(userId, closeFriendIds)
    return NextResponse.json({
      success: true,
      message: "Close friends list updated",
      count: closeFriendIds.length,
    })
  } catch (error) {
    console.error("Error setting close friends:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
