import { NextRequest, NextResponse } from "next/server"
import { joinGroup } from "@/lib/groups"

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: groupId } = params
    const body = await request.json()
    const { userId } = body as { userId: string }

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      )
    }

    const result = joinGroup({ groupId, userId })

    if (!result.success) {
      return NextResponse.json(
        { error: result.message || "Failed to join group" },
        { status: result.status === "error" ? 400 : 403 }
      )
    }

    return NextResponse.json({ success: true, ...result }, { status: 200 })
  } catch (error) {
    console.error("Error joining group:", error)
    return NextResponse.json(
      { error: "Failed to join group" },
      { status: 500 }
    )
  }
}

