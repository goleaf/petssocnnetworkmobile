import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { z } from "zod"
import type { EntityType } from "../route"

// Request validation schema for recording telemetry
const telemetrySchema = z.object({
  query: z.string().min(1).max(200),
  entityTypes: z.array(z.enum(["pets", "posts", "wiki", "places", "groups"])).optional(),
  hasResults: z.boolean().optional(),
  resultCount: z.number().int().min(0).optional(),
  zeroResultQuery: z.boolean().optional(),
  filters: z.record(z.any()).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validation = telemetrySchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: validation.error.errors },
        { status: 400 }
      )
    }

    const { query, entityTypes, hasResults, resultCount, zeroResultQuery, filters } = validation.data

    const ipAddress = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip")
    const userAgent = request.headers.get("user-agent")

    const telemetry = await db.searchTelemetry.create({
      data: {
        query,
        resultCount: resultCount ?? 0,
        hasResults: hasResults ?? (resultCount ? resultCount > 0 : false),
        zeroResultQuery: zeroResultQuery ?? (resultCount === 0),
        entityTypes: entityTypes || [],
        filters: filters ? JSON.parse(JSON.stringify(filters)) : null,
        ipAddress: ipAddress ?? undefined,
        userAgent: userAgent ?? undefined,
      },
    })

    return NextResponse.json({ success: true, telemetry }, { status: 201 })
  } catch (error) {
    console.error("Telemetry API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// GET endpoint for retrieving telemetry (admin/analytics)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get("limit") || "100")
    const offset = parseInt(searchParams.get("offset") || "0")
    const zeroResultsOnly = searchParams.get("zeroResultsOnly") === "true"

    const where: any = {}
    if (zeroResultsOnly) {
      where.zeroResultQuery = true
    }

    const [telemetry, total] = await Promise.all([
      db.searchTelemetry.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      db.searchTelemetry.count({ where }),
    ])

    return NextResponse.json({
      telemetry,
      pagination: {
        total,
        limit,
        offset,
      },
    })
  } catch (error) {
    console.error("Telemetry GET error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

