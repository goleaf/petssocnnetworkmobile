import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { z } from "zod"

const synonymSchema = z.object({
  term: z.string().min(1).max(100),
  synonyms: z.array(z.string().min(1).max(100)).min(1),
})

export async function GET() {
  try {
    const synonyms = await db.synonym.findMany({
      orderBy: { term: "asc" },
    })

    return NextResponse.json(
      synonyms.map((s) => ({
        id: s.id,
        term: s.term,
        synonyms: s.synonyms,
        createdAt: s.createdAt.toISOString(),
        updatedAt: s.updatedAt.toISOString(),
      }))
    )
  } catch (error) {
    console.error("Error fetching synonyms:", error)
    return NextResponse.json(
      { error: "Failed to fetch synonyms" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = synonymSchema.parse(body)

    const synonym = await db.synonym.create({
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
    console.error("Error creating synonym:", error)
    return NextResponse.json(
      { error: "Failed to create synonym" },
      { status: 500 }
    )
  }
}