import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { z } from "zod"

const termBoostSchema = z.object({
  term: z.string().min(1).max(100),
  boost: z.number().min(0).max(10),
  field: z.string().max(50).optional(),
})

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const termBoost = await db.termBoost.findUnique({
      where: { id },
    })

    if (!termBoost) {
      return NextResponse.json(
        { error: "Term boost not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      id: termBoost.id,
      term: termBoost.term,
      boost: termBoost.boost,
      field: termBoost.field,
      createdAt: termBoost.createdAt.toISOString(),
      updatedAt: termBoost.updatedAt.toISOString(),
    })
  } catch (error) {
    console.error("Error fetching term boost:", error)
    return NextResponse.json(
      { error: "Failed to fetch term boost" },
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
    const data = termBoostSchema.parse(body)

    const { id } = await context.params
    const termBoost = await db.termBoost.update({
      where: { id },
      data: {
        term: data.term.toLowerCase(),
        boost: data.boost,
        field: data.field,
      },
    })

    return NextResponse.json({
      id: termBoost.id,
      term: termBoost.term,
      boost: termBoost.boost,
      field: termBoost.field,
      createdAt: termBoost.createdAt.toISOString(),
      updatedAt: termBoost.updatedAt.toISOString(),
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      )
    }
    console.error("Error updating term boost:", error)
    return NextResponse.json(
      { error: "Failed to update term boost" },
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
    await db.termBoost.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting term boost:", error)
    return NextResponse.json(
      { error: "Failed to delete term boost" },
      { status: 500 }
    )
  }
}
