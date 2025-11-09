import { NextRequest, NextResponse } from "next/server"
import { updateRelevanceScores } from "@/lib/jobs/relevance-scheduler"

export async function GET() {
  try {
    const result = updateRelevanceScores(7)
    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Unknown" }, { status: 500 })
  }
}

export async function POST() {
  return GET()
}

