/**
 * Queue worker service to process jobs
 */

import { getNextPendingJob, updateJob, getJob } from "./queue"
import {
  processLinkCheck,
  processNotifyUser,
  processRebuildSearchIndex,
} from "./processors"
import type {
  LinkCheckJobPayload,
  NotifyUserJobPayload,
  RebuildSearchIndexJobPayload,
} from "@/lib/types/queue"

let isRunning = false
let processingInterval: NodeJS.Timeout | null = null

/**
 * Process a single job
 */
async function processJob(): Promise<void> {
  const job = await getNextPendingJob()

  if (!job) {
    return
  }

  try {
    // Mark as processing
    await updateJob(job.id, {
      status: "processing",
      attempts: job.attempts + 1,
      startedAt: new Date(),
    })

    // Process based on job type
    switch (job.type) {
      case "linkCheck": {
        const payload = job.payload as LinkCheckJobPayload
        await processLinkCheck(job.id, payload)
        break
      }

      case "notifyUser": {
        const payload = job.payload as NotifyUserJobPayload
        await processNotifyUser(job.id, payload)
        break
      }

      case "rebuildSearchIndex": {
        const payload = job.payload as RebuildSearchIndexJobPayload
        await processRebuildSearchIndex(job.id, payload)
        break
      }

      default:
        throw new Error(`Unknown job type: ${job.type}`)
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    const jobData = await getJob(job.id)

    if (jobData && jobData.attempts >= jobData.maxAttempts) {
      // Max attempts reached, mark as failed
      await updateJob(job.id, {
        status: "failed",
        error: errorMessage,
        completedAt: new Date(),
      })
    } else {
      // Retry later
      await updateJob(job.id, {
        status: "pending",
        error: errorMessage,
      })
    }
  }
}

/**
 * Start the worker (processes jobs every few seconds)
 */
export function startWorker(intervalMs: number = 2000): void {
  if (isRunning) {
    console.warn("Worker is already running")
    return
  }

  isRunning = true
  console.log(`Starting queue worker (interval: ${intervalMs}ms)`)

  // Process immediately
  processJob().catch(console.error)

  // Then process periodically
  processingInterval = setInterval(() => {
    processJob().catch(console.error)
  }, intervalMs)
}

/**
 * Stop the worker
 */
export function stopWorker(): void {
  if (!isRunning) {
    return
  }

  isRunning = false

  if (processingInterval) {
    clearInterval(processingInterval)
    processingInterval = null
  }

  console.log("Queue worker stopped")
}

/**
 * Process a single job immediately (useful for API routes)
 */
export async function processJobNow(): Promise<void> {
  await processJob()
}

/**
 * Check if worker is running
 */
export function isWorkerRunning(): boolean {
  return isRunning
}

