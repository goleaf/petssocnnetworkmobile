import { NextRequest, NextResponse } from "next/server"
import { enqueueJob } from "@/lib/queue/queue"
import type { TranscodeVideoJobPayload } from "@/lib/types/queue"

export const runtime = "nodejs"

// POST /api/upload/transcode-video
// Enqueues a background job to transcode a video to a target preset.
// This is a stub implementation that integrates with the existing queue system.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, fileUrl, preset = "mobile", processNow = false } = body || {}

    if (!userId || !fileUrl) {
      return NextResponse.json(
        { error: "Missing 'userId' or 'fileUrl'" },
        { status: 400 },
      )
    }

    const payload: TranscodeVideoJobPayload = { fileUrl, preset, userId }
    const job = await enqueueJob("transcodeVideo", payload, {
      priority: 1,
      maxAttempts: 1,
    })

    return NextResponse.json({ ok: true, job })
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to enqueue transcode", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
