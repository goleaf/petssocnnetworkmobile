import { NextRequest, NextResponse } from "next/server"
import { createGroupResource } from "@/lib/groups"
import type { CreateGroupResourceParams } from "@/lib/groups"

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: groupId } = await context.params
    const body = await request.json()
    const {
      createdBy,
      title,
      description,
      url,
      type,
      tags,
    } = body as Omit<CreateGroupResourceParams, "groupId">

    if (!createdBy || !title) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    const result = createGroupResource({
      groupId,
      createdBy,
      title,
      description,
      url,
      type,
      tags,
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.message || "Failed to create resource" },
        { status: 403 }
      )
    }

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error("Error creating resource:", error)
    return NextResponse.json(
      { error: "Failed to create resource" },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: groupId } = await context.params
    const { getGroupResourcesByGroupId } = await import("@/lib/storage")

    const resources = getGroupResourcesByGroupId(groupId)

    return NextResponse.json({ success: true, resources }, { status: 200 })
  } catch (error) {
    console.error("Error fetching group resources:", error)
    return NextResponse.json(
      { error: "Failed to fetch resources" },
      { status: 500 }
    )
  }
}
