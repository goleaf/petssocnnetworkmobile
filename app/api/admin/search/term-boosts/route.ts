import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { z } from "zod"

const termBoostSchema = z.object({
  term: z.string().min(1).max(100),
  boost: z.number().min(0).max(10),
  field: z.string().max(50).optional(),
})

export async function GET() {
  try {
    const termBoosts = await db.termBoost.findMany({
      orderBy: { term: "asc" },
    })

    return NextResponse.json(
      termBoosts.map((t) => ({
        id: t.id,
        term: t.term,
        boost: t.boost,
        field: t.field,
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
      }))
    )
  } catch (error) {
    console.error("Error fetching term boosts:", error)
    return NextResponse.json(
      { error: "Failed to fetch term boosts" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = termBoostSchema.parse(body)

    const termBoost = await db.termBoost.create({
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
    console.error("Error creating term boost:", error)
    return NextResponse.json(
      { error: "Failed to create term boost" },
      { status: 500 }
    )
  }
}
