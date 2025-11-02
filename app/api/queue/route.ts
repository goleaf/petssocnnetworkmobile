/**
 * Queue API routes
 */

import { NextRequest, NextResponse } from "next/server"
import { enqueueJob, listJobs } from "@/lib/queue/queue"
import { processJobNow } from "@/lib/queue/worker"
import type {
  LinkCheckJobPayload,
  NotifyUserJobPayload,
  RebuildSearchIndexJobPayload,
} from "@/lib/types/queue"

export const runtime = "nodejs"

/**
 * POST /api/queue - Enqueue a new job
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, payload, priority, maxAttempts } = body

    if (!type || !payload) {
      return NextResponse.json(
        { error: "Missing 'type' or 'payload' parameter" },
        { status: 400 }
      )
    }

    // Validate payload based on type
    switch (type) {
      case "linkCheck": {
        const linkPayload = payload as LinkCheckJobPayload
        if (!linkPayload.url) {
          return NextResponse.json(
            { error: "Missing 'url' in payload" },
            { status: 400 }
          )
        }
        break
      }
      case "notifyUser": {
        const notifyPayload = payload as NotifyUserJobPayload
        if (!notifyPayload.userId || !notifyPayload.templateId) {
          return NextResponse.json(
            { error: "Missing 'userId' or 'templateId' in payload" },
            { status: 400 }
          )
        }
        break
      }
      case "rebuildSearchIndex": {
        // Optional payload validation
        break
      }
      default:
        return NextResponse.json(
          { error: `Unknown job type: ${type}` },
          { status: 400 }
        )
    }

    const job = await enqueueJob(type, payload, {
      priority: priority ?? 0,
      maxAttempts: maxAttempts ?? 3,
    })

    // Process job immediately if requested
    if (body.processNow) {
      processJobNow().catch(console.error)
    }

    return NextResponse.json(job)
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to enqueue job",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/queue - List jobs
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get("type") as "linkCheck" | "notifyUser" | "rebuildSearchIndex" | null
    const status = searchParams.get("status") as "pending" | "processing" | "completed" | "failed" | null
    const limit = parseInt(searchParams.get("limit") || "50", 10)
    const offset = parseInt(searchParams.get("offset") || "0", 10)

    const result = await listJobs({
      type: type ?? undefined,
      status: status ?? undefined,
      limit,
      offset,
    })

    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to list jobs",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

