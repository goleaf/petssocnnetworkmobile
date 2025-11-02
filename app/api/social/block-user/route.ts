import { NextRequest, NextResponse } from "next/server"
import { blockUser, unblockUser } from "@/lib/storage"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, targetUserId, action = "block" } = body

    if (!userId || !targetUserId) {
      return NextResponse.json(
        { error: "userId and targetUserId are required" },
        { status: 400 },
      )
    }

    if (userId === targetUserId) {
      return NextResponse.json({ error: "Cannot block yourself" }, { status: 400 })
    }

    if (action === "block") {
      blockUser(userId, targetUserId)
      return NextResponse.json({ success: true, message: "User blocked" })
    } else if (action === "unblock") {
      unblockUser(userId, targetUserId)
      return NextResponse.json({ success: true, message: "User unblocked" })
    } else {
      return NextResponse.json({ error: "Invalid action. Use 'block' or 'unblock'" }, { status: 400 })
    }
  } catch (error) {
    console.error("Error blocking/unblocking user:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

