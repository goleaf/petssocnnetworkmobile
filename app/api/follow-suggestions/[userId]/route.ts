import { NextRequest, NextResponse } from "next/server"
import { getFriendSuggestions } from "@/lib/friend-suggestions"
import { getUsers } from "@/lib/storage"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      )
    }

    const allUsers = getUsers()
    const user = allUsers.find((u) => u.id === userId)

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // Parse limit from query params (default: 10)
    const searchParams = request.nextUrl.searchParams
    const limitParam = searchParams.get("limit")
    const limit = limitParam ? parseInt(limitParam, 10) : 10

    if (isNaN(limit) || limit < 1 || limit > 50) {
      return NextResponse.json(
        { error: "Limit must be between 1 and 50" },
        { status: 400 }
      )
    }

    const suggestions = getFriendSuggestions(user, { limit })

    return NextResponse.json({
      userId,
      suggestions,
      count: suggestions.length,
    })
  } catch (error) {
    console.error("Follow suggestions API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

