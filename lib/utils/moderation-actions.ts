import { prisma } from "@/lib/prisma"
import type { ModerationActionLog } from "@/lib/types"
import { softDeleteContent, restoreContent } from "./soft-delete"

/**
 * Log a moderation action
 */
export async function logModerationAction(params: {
  action: ModerationActionLog["action"]
  contentType: string
  contentId: string
  performedBy: string
  reason?: string
  metadata?: Record<string, unknown>
}): Promise<{ success: boolean; error?: string; logId?: string }> {
  try {
    const log = await prisma.moderationActionLog.create({
      data: {
        action: params.action,
        contentType: params.contentType,
        contentId: params.contentId,
        performedBy: params.performedBy,
        reason: params.reason,
        metadata: params.metadata || {},
      },
    })

    return { success: true, logId: log.id }
  } catch (error) {
    console.error("Error logging moderation action:", error)
    return { success: false, error: `Failed to log action: ${error}` }
  }
}

/**
 * Approve content (remove from moderation queue)
 */
export async function approveContent(params: {
  contentType: string
  contentId: string
  performedBy: string
  reason?: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    const { contentType, contentId, performedBy, reason } = params

    // Update moderation queue
    await prisma.moderationQueue.updateMany({
      where: {
        contentType,
        contentId,
      },
      data: {
        status: "resolved",
        reviewedAt: new Date(),
      },
    })

    // Log action
    await logModerationAction({
      action: "approve",
      contentType,
      contentId,
      performedBy,
      reason,
    })

    return { success: true }
  } catch (error) {
    console.error("Error approving content:", error)
    return { success: false, error: `Failed to approve: ${error}` }
  }
}

/**
 * Reject/Delete content
 */
export async function rejectContent(params: {
  contentType: string
  contentId: string
  performedBy: string
  reason: string
  softDelete?: boolean
}): Promise<{ success: boolean; error?: string }> {
  try {
    const { contentType, contentId, performedBy, reason, softDelete = true } = params

    // Soft delete if requested
    if (softDelete) {
      const deleteResult = await softDeleteContent({
        contentType,
        contentId,
        deletedBy: performedBy,
        reason,
      })

      if (!deleteResult.success) {
        return deleteResult
      }
    }

    // Update moderation queue
    await prisma.moderationQueue.updateMany({
      where: {
        contentType,
        contentId,
      },
      data: {
        status: "resolved",
        reviewedAt: new Date(),
      },
    })

    // Log action
    await logModerationAction({
      action: "reject",
      contentType,
      contentId,
      performedBy,
      reason,
    })

    return { success: true }
  } catch (error) {
    console.error("Error rejecting content:", error)
    return { success: false, error: `Failed to reject: ${error}` }
  }
}

/**
 * Get moderation action history for content
 */
export async function getModerationHistory(params: {
  contentType: string
  contentId: string
}): Promise<ModerationActionLog[]> {
  const { contentType, contentId } = params

  const logs = await prisma.moderationActionLog.findMany({
    where: {
      contentType,
      contentId,
    },
    orderBy: {
      createdAt: "desc",
    },
  })

  return logs.map((log) => ({
    id: log.id,
    action: log.action as ModerationActionLog["action"],
    contentType: log.contentType,
    contentId: log.contentId,
    performedBy: log.performedBy,
    reason: log.reason || undefined,
    metadata: (log.metadata as Record<string, unknown>) || undefined,
    createdAt: log.createdAt.toISOString(),
  }))
}

/**
 * Get moderation statistics
 */
export async function getModerationStats() {
  const [
    totalPending,
    totalInReview,
    totalResolved,
    pendingByPriority,
    queueByContentType,
  ] = await Promise.all([
    prisma.moderationQueue.count({
      where: { status: "pending" },
    }),
    prisma.moderationQueue.count({
      where: { status: "in_review" },
    }),
    prisma.moderationQueue.count({
      where: { status: "resolved" },
    }),
    prisma.moderationQueue.groupBy({
      by: ["priority"],
      where: { status: "pending" },
      _count: true,
    }),
    prisma.moderationQueue.groupBy({
      by: ["contentType"],
      where: { status: "pending" },
      _count: true,
    }),
  ])

  return {
    totalPending,
    totalInReview,
    totalResolved,
    pendingByPriority: pendingByPriority.reduce(
      (acc, item) => {
        acc[item.priority] = item._count
        return acc
      },
      {} as Record<string, number>
    ),
    queueByContentType: queueByContentType.reduce(
      (acc, item) => {
        acc[item.contentType] = item._count
        return acc
      },
      {} as Record<string, number>
    ),
  }
}

