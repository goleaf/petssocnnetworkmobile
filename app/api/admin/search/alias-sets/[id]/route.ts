import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { z } from "zod"

const aliasSetSchema = z.object({
  name: z.string().min(1).max(100),
  aliases: z.array(z.string().min(1).max(100)).min(1),
})

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const aliasSet = await db.aliasSet.findUnique({
      where: { id },
    })

    if (!aliasSet) {
      return NextResponse.json(
        { error: "Alias set not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      id: aliasSet.id,
      name: aliasSet.name,
      aliases: aliasSet.aliases,
      createdAt: aliasSet.createdAt.toISOString(),
      updatedAt: aliasSet.updatedAt.toISOString(),
    })
  } catch (error) {
    console.error("Error fetching alias set:", error)
    return NextResponse.json(
      { error: "Failed to fetch alias set" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json()
    const data = aliasSetSchema.parse(body)

    const { id } = await context.params
    const aliasSet = await db.aliasSet.update({
      where: { id },
      data: {
        name: data.name,
        aliases: data.aliases.map((a) => a.toLowerCase()),
      },
    })

    return NextResponse.json({
      id: aliasSet.id,
      name: aliasSet.name,
      aliases: aliasSet.aliases,
      createdAt: aliasSet.createdAt.toISOString(),
      updatedAt: aliasSet.updatedAt.toISOString(),
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      )
    }
    console.error("Error updating alias set:", error)
    return NextResponse.json(
      { error: "Failed to update alias set" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    await db.aliasSet.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting alias set:", error)
    return NextResponse.json(
      { error: "Failed to delete alias set" },
      { status: 500 }
    )
  }
}
