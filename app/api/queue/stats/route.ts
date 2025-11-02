/**
 * Queue stats API route
 */

import { NextRequest, NextResponse } from "next/server"
import { getJobStats } from "@/lib/queue/queue"

export const runtime = "nodejs"

/**
 * GET /api/queue/stats - Get queue statistics
 */
export async function GET(request: NextRequest) {
  try {
    const stats = await getJobStats()
    return NextResponse.json(stats)
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to get queue stats",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

