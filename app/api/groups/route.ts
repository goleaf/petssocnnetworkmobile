import { NextRequest, NextResponse } from "next/server"
import { createGroup } from "@/lib/groups"
import type { CreateGroupParams } from "@/lib/groups"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name,
      description,
      type,
      membershipType,
      categoryId,
      subcategoryId,
      coverImage,
      avatar,
      tags,
      rules,
      pinnedRules,
      welcomeMessage,
      city,
      ownerId,
    } = body as CreateGroupParams & { ownerId: string }

    // Validation
    if (!name || !description || !type || !categoryId || !ownerId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    const params: CreateGroupParams = {
      name,
      description,
      type,
      membershipType: membershipType || "open",
      categoryId,
      subcategoryId,
      coverImage,
      avatar,
      tags,
      rules,
      pinnedRules,
      welcomeMessage,
      city,
      ownerId,
    }

    const group = createGroup(params)

    return NextResponse.json({ success: true, group }, { status: 201 })
  } catch (error) {
    console.error("Error creating group:", error)
    return NextResponse.json(
      { error: "Failed to create group" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get("categoryId")
    const search = searchParams.get("search")

    const { getGroups, getGroupsByCategory, searchGroups } = await import(
      "@/lib/storage"
    )

    let groups
    if (search) {
      groups = searchGroups(search)
    } else if (categoryId) {
      groups = getGroupsByCategory(categoryId)
    } else {
      groups = getGroups()
    }

    return NextResponse.json({ success: true, groups }, { status: 200 })
  } catch (error) {
    console.error("Error fetching groups:", error)
    return NextResponse.json(
      { error: "Failed to fetch groups" },
      { status: 500 }
    )
  }
}

