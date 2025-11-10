import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { performCrossEntitySearch } from "../../../route"
import type { LatLng } from "@/lib/utils/geo-search"

// GET /api/search/saved/[id]/check - Check for new results since last check
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const savedSearch = await db.savedSearch.findUnique({
      where: { id },
      include: {
        alerts: {
          select: {
            matchedEntityId: true,
            matchedEntityType: true,
          },
        },
      },
    })

    if (!savedSearch) {
      return NextResponse.json({ error: "Saved search not found" }, { status: 404 })
    }

    // Get existing alert entity IDs to exclude
    const existingAlertIds = new Set(
      savedSearch.alerts.map((a) => `${a.matchedEntityType}:${a.matchedEntityId}`)
    )

    // Perform search with saved search parameters
    const filters = savedSearch.filters as any
    const latLng = savedSearch.latLng as LatLng | null

    const results = await performCrossEntitySearch(
      savedSearch.query,
      savedSearch.entityTypes.length > 0 ? savedSearch.entityTypes : undefined,
      100, // Get more results to check
      0,
      filters,
      latLng || undefined,
      savedSearch.radius || undefined
    )

    // Filter out results that already have alerts
    const newResults = results.filter((result) => {
      const resultKey = `${result.entityType}:${result.id}`
      return !existingAlertIds.has(resultKey)
    })

    // If there are new results and alerts are enabled, create alert records
    if (newResults.length > 0 && savedSearch.alertEnabled) {
      const alerts = await Promise.all(
        newResults.map((result) =>
          db.searchAlert.create({
            data: {
              savedSearchId: id,
              matchedEntityId: result.id,
              matchedEntityType: result.entityType,
            },
          })
        )
      )

      // Update lastCheckedAt
      await db.savedSearch.update({
        where: { id },
        data: { lastCheckedAt: new Date() },
      })

      return NextResponse.json({
        success: true,
        newResultsCount: newResults.length,
        newResults: newResults.slice(0, 10), // Return first 10
        alerts,
      })
    }

    // Update lastCheckedAt even if no new results
    await db.savedSearch.update({
      where: { id },
      data: { lastCheckedAt: new Date() },
    })

    return NextResponse.json({
      success: true,
      newResultsCount: 0,
      newResults: [],
    })
  } catch (error) {
    console.error("Check saved search error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

