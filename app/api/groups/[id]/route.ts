import { NextRequest, NextResponse } from "next/server"
import { getGroupById, getGroupBySlug } from "@/lib/storage"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const { searchParams } = new URL(request.url)
    const bySlug = searchParams.get("bySlug") === "true"

    let group
    if (bySlug) {
      group = getGroupBySlug(id)
    } else {
      group = getGroupById(id)
    }

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, group }, { status: 200 })
  } catch (error) {
    console.error("Error fetching group:", error)
    return NextResponse.json(
      { error: "Failed to fetch group" },
      { status: 500 }
    )
  }
}

