import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { z } from "zod"
import type { EntityType } from "../route"
import { performCrossEntitySearch } from "../route"

// Request validation schema for saved search
const savedSearchSchema = z.object({
  query: z.string().min(1).max(200),
  entityTypes: z.array(z.enum(["pets", "posts", "wiki", "places", "groups"])).optional(),
  filters: z.record(z.any()).optional(),
  latLng: z
    .object({
      lat: z.number(),
      lng: z.number(),
    })
    .optional(),
  radius: z.number().positive().optional(),
  alertEnabled: z.boolean().optional(),
  userId: z.string().optional(), // Optional - can be anonymous
})

// GET - List saved searches
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    const where: any = {}
    if (userId) {
      where.userId = userId
    } else {
      // If no userId, return searches with null userId (anonymous)
      where.userId = null
    }

    const savedSearches = await db.savedSearch.findMany({
      where,
      include: {
        alerts: {
          orderBy: { createdAt: "desc" },
          take: 5, // Get recent alerts
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ savedSearches })
  } catch (error) {
    console.error("Saved searches GET error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST - Create saved search
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validation = savedSearchSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: validation.error.errors },
        { status: 400 }
      )
    }

    const { query, entityTypes, filters, latLng, radius, alertEnabled, userId } = validation.data

    const savedSearch = await db.savedSearch.create({
      data: {
        query,
        entityTypes: entityTypes || [],
        filters: filters ? JSON.parse(JSON.stringify(filters)) : {},
        latLng: latLng ? JSON.parse(JSON.stringify(latLng)) : null,
        radius: radius ?? null,
        alertEnabled: alertEnabled ?? false,
        userId: userId ?? null,
      },
    })

    return NextResponse.json({ success: true, savedSearch }, { status: 201 })
  } catch (error) {
    console.error("Saved search creation error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// PUT - Update saved search
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 })
    }

    const validation = savedSearchSchema.partial().safeParse(updateData)

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: validation.error.errors },
        { status: 400 }
      )
    }

    const updateFields: any = {}
    if (updateData.query !== undefined) updateFields.query = updateData.query
    if (updateData.entityTypes !== undefined) updateFields.entityTypes = updateData.entityTypes
    if (updateData.filters !== undefined) updateFields.filters = JSON.parse(JSON.stringify(updateData.filters))
    if (updateData.latLng !== undefined) updateFields.latLng = updateData.latLng ? JSON.parse(JSON.stringify(updateData.latLng)) : null
    if (updateData.radius !== undefined) updateFields.radius = updateData.radius ?? null
    if (updateData.alertEnabled !== undefined) updateFields.alertEnabled = updateData.alertEnabled

    const savedSearch = await db.savedSearch.update({
      where: { id },
      data: updateFields,
    })

    return NextResponse.json({ success: true, savedSearch })
  } catch (error) {
    console.error("Saved search update error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// DELETE - Delete saved search
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 })
    }

    await db.savedSearch.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Saved search deletion error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

