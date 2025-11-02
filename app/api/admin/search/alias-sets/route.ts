import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { z } from "zod"

const aliasSetSchema = z.object({
  name: z.string().min(1).max(100),
  aliases: z.array(z.string().min(1).max(100)).min(1),
})

export async function GET() {
  try {
    const aliasSets = await db.aliasSet.findMany({
      orderBy: { name: "asc" },
    })

    return NextResponse.json(
      aliasSets.map((a) => ({
        id: a.id,
        name: a.name,
        aliases: a.aliases,
        createdAt: a.createdAt.toISOString(),
        updatedAt: a.updatedAt.toISOString(),
      }))
    )
  } catch (error) {
    console.error("Error fetching alias sets:", error)
    return NextResponse.json(
      { error: "Failed to fetch alias sets" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = aliasSetSchema.parse(body)

    const aliasSet = await db.aliasSet.create({
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
    console.error("Error creating alias set:", error)
    return NextResponse.json(
      { error: "Failed to create alias set" },
      { status: 500 }
    )
  }
}
