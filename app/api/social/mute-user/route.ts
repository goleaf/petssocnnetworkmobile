import { NextRequest, NextResponse } from "next/server"
import { muteUser, unmuteUser } from "@/lib/storage"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, targetUserId, action = "mute" } = body

    if (!userId || !targetUserId) {
      return NextResponse.json(
        { error: "userId and targetUserId are required" },
        { status: 400 },
      )
    }

    if (userId === targetUserId) {
      return NextResponse.json({ error: "Cannot mute yourself" }, { status: 400 })
    }

    if (action === "mute") {
      muteUser(userId, targetUserId)
      return NextResponse.json({ success: true, message: "User muted" })
    } else if (action === "unmute") {
      unmuteUser(userId, targetUserId)
      return NextResponse.json({ success: true, message: "User unmuted" })
    } else {
      return NextResponse.json({ error: "Invalid action. Use 'mute' or 'unmute'" }, { status: 400 })
    }
  } catch (error) {
    console.error("Error muting/unmuting user:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

