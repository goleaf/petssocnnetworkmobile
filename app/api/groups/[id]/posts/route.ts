import { NextRequest, NextResponse } from "next/server"
import { postToGroup } from "@/lib/groups"

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: groupId } = params
    const body = await request.json()
    const { userId, title, content, tags } = body as {
      userId: string
      title: string
      content: string
      tags?: string[]
    }

    if (!userId || !title || !content) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    const result = postToGroup({
      groupId,
      userId,
      title,
      content,
      tags,
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.message || "Failed to create post" },
        { status: 403 }
      )
    }

    return NextResponse.json({ success: true, ...result }, { status: 201 })
  } catch (error) {
    console.error("Error creating post:", error)
    return NextResponse.json(
      { error: "Failed to create post" },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: groupId } = params
    const { getGroupTopicsByGroupId } = await import("@/lib/storage")

    const topics = getGroupTopicsByGroupId(groupId)

    return NextResponse.json({ success: true, topics }, { status: 200 })
  } catch (error) {
    console.error("Error fetching group posts:", error)
    return NextResponse.json(
      { error: "Failed to fetch posts" },
      { status: 500 }
    )
  }
}

