import { NextRequest, NextResponse } from "next/server"
import { getProfileOverview } from "@/lib/utils/profile-overview"

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

    const overview = getProfileOverview(userId)

    if (!overview) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(overview)
  } catch (error) {
    console.error("Profile overview API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

