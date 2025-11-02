/**
 * Queue service for managing background jobs
 */

import { prisma } from "@/lib/prisma"
import type {
  QueueJob,
  JobType,
  JobStatus,
  LinkCheckJobPayload,
  NotifyUserJobPayload,
  RebuildSearchIndexJobPayload,
} from "@/lib/types/queue"

/**
 * Enqueue a new job
 */
export async function enqueueJob<T extends Record<string, unknown>>(
  type: JobType,
  payload: T,
  options?: {
    priority?: number
    maxAttempts?: number
  }
): Promise<QueueJob> {
  const job = await prisma.queueJob.create({
    data: {
      type,
      payload: payload as Record<string, unknown>,
      priority: options?.priority ?? 0,
      maxAttempts: options?.maxAttempts ?? 3,
      status: "pending",
      progress: 0,
      attempts: 0,
    },
  })

  return {
    ...job,
    createdAt: job.createdAt,
    startedAt: job.startedAt ?? undefined,
    completedAt: job.completedAt ?? undefined,
  }
}

/**
 * Get job by ID
 */
export async function getJob(id: string): Promise<QueueJob | null> {
  const job = await prisma.queueJob.findUnique({
    where: { id },
  })

  if (!job) return null

  return {
    ...job,
    createdAt: job.createdAt,
    startedAt: job.startedAt ?? undefined,
    completedAt: job.completedAt ?? undefined,
  }
}

/**
 * Update job status and progress
 */
export async function updateJob(
  id: string,
  updates: {
    status?: JobStatus
    progress?: number
    progressMessage?: string
    result?: Record<string, unknown>
    error?: string
    startedAt?: Date
    completedAt?: Date
    attempts?: number
  }
): Promise<QueueJob> {
  const job = await prisma.queueJob.update({
    where: { id },
    data: {
      ...updates,
      attempts: updates.attempts !== undefined ? updates.attempts : undefined,
    },
  })

  return {
    ...job,
    createdAt: job.createdAt,
    startedAt: job.startedAt ?? undefined,
    completedAt: job.completedAt ?? undefined,
  }
}

/**
 * Get next pending job to process (highest priority first)
 */
export async function getNextPendingJob(): Promise<QueueJob | null> {
  // Fetch pending jobs ordered by priority and creation time
  // Filter out jobs that have exceeded max attempts
  const jobs = await prisma.queueJob.findMany({
    where: {
      status: "pending",
    },
    orderBy: [
      { priority: "desc" },
      { createdAt: "asc" },
    ],
    take: 100, // Process up to 100 jobs to find one that hasn't exceeded attempts
  })

  // Find first job that hasn't exceeded max attempts
  const job = jobs.find((j: { attempts: number; maxAttempts: number }) => j.attempts < j.maxAttempts)

  if (!job) return null

  return {
    ...job,
    createdAt: job.createdAt,
    startedAt: job.startedAt ?? undefined,
    completedAt: job.completedAt ?? undefined,
  }
}

/**
 * List jobs with filters
 */
export async function listJobs(options?: {
  type?: JobType
  status?: JobStatus
  limit?: number
  offset?: number
}): Promise<{ jobs: QueueJob[]; total: number }> {
  const where: {
    type?: JobType
    status?: JobStatus
  } = {}

  if (options?.type) {
    where.type = options.type
  }

  if (options?.status) {
    where.status = options.status
  }

  const [jobs, total] = await Promise.all([
    prisma.queueJob.findMany({
      where,
      orderBy: [
        { createdAt: "desc" },
      ],
      take: options?.limit ?? 50,
      skip: options?.offset ?? 0,
    }),
    prisma.queueJob.count({ where }),
  ])

  return {
    jobs: jobs.map((job: { createdAt: Date; startedAt: Date | null; completedAt: Date | null; [key: string]: unknown }) => ({
      ...job,
      createdAt: job.createdAt,
      startedAt: job.startedAt ?? undefined,
      completedAt: job.completedAt ?? undefined,
    })),
    total,
  }
}

/**
 * Get job statistics
 */
export async function getJobStats(): Promise<{
  pending: number
  processing: number
  completed: number
  failed: number
  byType: Record<string, { total: number; pending: number; processing: number; completed: number; failed: number }>
}> {
  const [pending, processing, completed, failed, allJobs] = await Promise.all([
    prisma.queueJob.count({ where: { status: "pending" } }),
    prisma.queueJob.count({ where: { status: "processing" } }),
    prisma.queueJob.count({ where: { status: "completed" } }),
    prisma.queueJob.count({ where: { status: "failed" } }),
    prisma.queueJob.findMany({
      select: {
        type: true,
        status: true,
      },
    }),
  ])

  const byType: Record<string, { total: number; pending: number; processing: number; completed: number; failed: number }> = {}

  for (const job of allJobs) {
    if (!byType[job.type]) {
      byType[job.type] = { total: 0, pending: 0, processing: 0, completed: 0, failed: 0 }
    }
    byType[job.type].total++
    if (job.status === "pending") byType[job.type].pending++
    if (job.status === "processing") byType[job.type].processing++
    if (job.status === "completed") byType[job.type].completed++
    if (job.status === "failed") byType[job.type].failed++
  }

  return {
    pending,
    processing,
    completed,
    failed,
    byType,
  }
}

/**
 * Clean up old completed jobs (older than specified days)
 */
export async function cleanupOldJobs(daysOld: number = 7): Promise<number> {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - daysOld)

  const result = await prisma.queueJob.deleteMany({
    where: {
      status: {
        in: ["completed", "failed"],
      },
      completedAt: {
        lt: cutoffDate,
      },
    },
  })

  return result.count
}

