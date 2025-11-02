import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { z } from "zod"

const synonymSchema = z.object({
  term: z.string().min(1).max(100),
  synonyms: z.array(z.string().min(1).max(100)).min(1),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const synonym = await db.synonym.findUnique({
      where: { id: params.id },
    })

    if (!synonym) {
      return NextResponse.json(
        { error: "Synonym not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      id: synonym.id,
      term: synonym.term,
      synonyms: synonym.synonyms,
      createdAt: synonym.createdAt.toISOString(),
      updatedAt: synonym.updatedAt.toISOString(),
    })
  } catch (error) {
    console.error("Error fetching synonym:", error)
    return NextResponse.json(
      { error: "Failed to fetch synonym" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const data = synonymSchema.parse(body)

    const synonym = await db.synonym.update({
      where: { id: params.id },
      data: {
        term: data.term.toLowerCase(),
        synonyms: data.synonyms.map((s) => s.toLowerCase()),
      },
    })

    return NextResponse.json({
      id: synonym.id,
      term: synonym.term,
      synonyms: synonym.synonyms,
      createdAt: synonym.createdAt.toISOString(),
      updatedAt: synonym.updatedAt.toISOString(),
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      )
    }
    console.error("Error updating synonym:", error)
    return NextResponse.json(
      { error: "Failed to update synonym" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await db.synonym.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting synonym:", error)
    return NextResponse.json(
      { error: "Failed to delete synonym" },
      { status: 500 }
    )
  }
}
