"use client"

import type {
  ModerationQueueItem,
  ModerationContentType,
  ModerationAction,
  ModerationActionLog,
  SoftDeleteRecord,
  ModerationPriority,
} from "@/lib/types"
import {
  getModerationQueueItems,
  addModerationQueueItem,
  updateModerationQueueItem,
  deleteModerationQueueItem,
  getModerationActionLogs,
  addModerationActionLog,
  getSoftDeleteRecords,
  addSoftDeleteRecord,
  deleteSoftDeleteRecord,
  getBlogPostById,
  getWikiArticleById,
} from "@/lib/storage"

/**
 * Add item to moderation queue
 */
export function addToModerationQueue(
  contentType: ModerationContentType,
  contentId: string,
  reporterId: string,
  options?: {
    autoFlagged?: boolean
    autoReason?: string
    aiScore?: number
  }
): ModerationQueueItem {
  const existingItems = getModerationQueueItems()
  const existing = existingItems.find(
    (item) => item.contentType === contentType && item.contentId === contentId
  )

  if (existing) {
    // Update existing item
    if (!existing.reportedBy.includes(reporterId)) {
      existing.reportedBy.push(reporterId)
      existing.reportCount = existing.reportedBy.length
      
      // Escalate priority based on report count
      if (existing.reportCount >= 10) {
        existing.priority = "urgent"
      } else if (existing.reportCount >= 5) {
        existing.priority = "high"
      } else if (existing.reportCount >= 2) {
        existing.priority = "medium"
      }

      existing.updatedAt = new Date().toISOString()
      updateModerationQueueItem(existing.id, existing)
      return existing
    }
    return existing
  }

  // Create new queue item
  const priority: ModerationPriority = options?.aiScore && options.aiScore > 80 ? "high" : "low"
  const newItem: ModerationQueueItem = {
    id: `mq_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    contentType,
    contentId,
    priority,
    reportedBy: [reporterId],
    reportCount: 1,
    autoFlagged: options?.autoFlagged || false,
    autoReason: options?.autoReason,
    aiScore: options?.aiScore,
    status: "pending",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  addModerationQueueItem(newItem)
  return newItem
}

/**
 * Get queue items by content type with pagination
 */
export interface PaginationParams {
  page: number
  pageSize: number
}

export interface PaginatedResult<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export function getQueueItemsByType(
  contentType: ModerationContentType,
  params: PaginationParams,
  options?: {
    status?: "pending" | "in_review" | "resolved"
    sortBy?: "priority" | "aiScore" | "createdAt"
    sortOrder?: "asc" | "desc"
  }
): PaginatedResult<ModerationQueueItem> {
  const allItems = getModerationQueueItems()
  let filtered = allItems.filter((item) => item.contentType === contentType)

  // Filter by status if provided
  if (options?.status) {
    filtered = filtered.filter((item) => item.status === options.status)
  }

  // Sort
  if (options?.sortBy) {
    filtered.sort((a, b) => {
      let aVal: number
      let bVal: number

      switch (options.sortBy) {
        case "priority":
          const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 }
          aVal = priorityOrder[a.priority]
          bVal = priorityOrder[b.priority]
          break
        case "aiScore":
          aVal = a.aiScore || 0
          bVal = b.aiScore || 0
          break
        case "createdAt":
          aVal = new Date(a.createdAt).getTime()
          bVal = new Date(b.createdAt).getTime()
          break
      }

      if (options.sortOrder === "asc") {
        return aVal - bVal
      }
      return bVal - aVal
    })
  }

  const total = filtered.length
  const totalPages = Math.ceil(total / params.pageSize)
  const startIndex = (params.page - 1) * params.pageSize
  const endIndex = startIndex + params.pageSize
  const items = filtered.slice(startIndex, endIndex)

  return {
    items,
    total,
    page: params.page,
    pageSize: params.pageSize,
    totalPages,
  }
}

/**
 * Process moderation action (approve/reject/redact/delete)
 */
export function processModerationAction(
  queueItemId: string,
  action: ModerationAction,
  performedBy: string,
  justification: string
): { success: boolean; error?: string } {
  if (!justification || justification.trim().length === 0) {
    return { success: false, error: "Justification is required" }
  }

  const item = getModerationQueueItems().find((i) => i.id === queueItemId)
  if (!item) {
    return { success: false, error: "Queue item not found" }
  }

  if (item.status !== "pending" && item.status !== "in_review") {
    return { success: false, error: "Queue item already resolved" }
  }

  // Perform the action based on type
  const content = getContentById(item.contentType, item.contentId)
  if (!content) {
    return { success: false, error: "Content not found" }
  }

  // Log the action
  const actionLog: ModerationActionLog = {
    id: `mal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    queueItemId: item.id,
    action,
    performedBy,
    justification,
    metadata: {
      contentType: item.contentType,
      contentId: item.contentId,
      aiScore: item.aiScore,
    },
    createdAt: new Date().toISOString(),
  }
  addModerationActionLog(actionLog)

  // Update queue item status
  item.status = "resolved"
  item.justification = justification
  item.reviewedAt = new Date().toISOString()
  updateModerationQueueItem(item.id, item)

  // Handle soft delete if applicable
  if (action === "delete" || action === "redact") {
    const retentionDays = 90 // Default retention policy
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + retentionDays)

    const softDeleteRecord: SoftDeleteRecord = {
      id: `sdr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      contentType: item.contentType,
      contentId: item.contentId,
      deletedBy: performedBy,
      reason: justification,
      deletedAt: new Date().toISOString(),
      expiresAt: expiresAt.toISOString(),
      metadata: {
        queueItemId: item.id,
        action: action,
      },
    }
    addSoftDeleteRecord(softDeleteRecord)
  }

  return { success: true }
}

/**
 * Helper to get content by type and ID
 */
function getContentById(contentType: ModerationContentType, contentId: string): unknown {
  switch (contentType) {
    case "post":
      return getBlogPostById(contentId)
    case "comment":
      // For now, return a mock object - comment lookup can be implemented later
      return { id: contentId, content: "comment" }
    case "media":
      // For now, return a mock object - media lookup can be implemented later
      return { id: contentId, url: "media-url" }
    case "wiki_revision":
      return getWikiArticleById(contentId)
    default:
      return null
  }
}

/**
 * Bulk process moderation actions (for testing idempotency)
 */
export function bulkProcessModerationActions(
  items: Array<{
    queueItemId: string
    action: ModerationAction
    performedBy: string
    justification: string
  }>
): {
  success: number
  failed: number
  errors: Array<{ itemId: string; error: string }>
} {
  let success = 0
  let failed = 0
  const errors: Array<{ itemId: string; error: string }> = []

  for (const item of items) {
    const result = processModerationAction(
      item.queueItemId,
      item.action,
      item.performedBy,
      item.justification
    )
    if (result.success) {
      success++
    } else {
      failed++
      errors.push({ itemId: item.queueItemId, error: result.error || "Unknown error" })
    }
  }

  return { success, failed, errors }
}

/**
 * Clean up expired soft delete records
 */
export function cleanupExpiredSoftDeletes(): number {
  const records = getSoftDeleteRecords()
  const now = new Date()
  let deleted = 0

  for (const record of records) {
    if (new Date(record.expiresAt) < now) {
      deleteSoftDeleteRecord(record.id)
      deleted++
    }
  }

  return deleted
}

/**
 * Assign queue item to moderator
 */
export function assignToModerator(
  queueItemId: string,
  moderatorId: string
): { success: boolean; error?: string } {
  const item = getModerationQueueItems().find((i) => i.id === queueItemId)
  if (!item) {
    return { success: false, error: "Queue item not found" }
  }

  item.assignedTo = moderatorId
  item.status = "in_review"
  item.updatedAt = new Date().toISOString()
  updateModerationQueueItem(item.id, item)

  return { success: true }
}

