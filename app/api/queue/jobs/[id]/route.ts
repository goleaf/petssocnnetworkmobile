/**
 * Queue job details API route
 */

import { NextRequest, NextResponse } from "next/server"
import { getJob, updateJob } from "@/lib/queue/queue"
import { processJobNow } from "@/lib/queue/worker"

export const runtime = "nodejs"

/**
 * GET /api/queue/jobs/[id] - Get job by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const job = await getJob(id)

    if (!job) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(job)
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to get job",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/queue/jobs/[id] - Update job
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { action, ...updates } = body

    // Handle special actions
    if (action === "retry") {
      const job = await getJob(id)
      if (!job) {
        return NextResponse.json(
          { error: "Job not found" },
          { status: 404 }
        )
      }

      await updateJob(id, {
        status: "pending",
        error: undefined,
        attempts: 0,
      })

      // Process immediately
      processJobNow().catch(console.error)

      const updatedJob = await getJob(id)
      return NextResponse.json(updatedJob)
    }

    // Regular update
    const job = await updateJob(id, updates)
    return NextResponse.json(job)
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to update job",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

