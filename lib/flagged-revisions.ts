"use client"

import type {
  FlaggedRevision,
  FlaggedRevisionStatus,
  FlaggedRevisionAuditLog,
} from "./types"
import {
  getFlaggedRevisions,
  getFlaggedRevisionById,
  getPendingFlaggedRevisions,
  getFlaggedRevisionsByStatus,
  getFlaggedRevisionsByCategory,
  getFlaggedRevisionsByRevisionId,
  addFlaggedRevision,
  updateFlaggedRevision,
  getFlaggedRevisionAuditLogsByFlaggedRevisionId,
  getWikiRevisionById,
  markRevisionAsStable,
  getWikiArticleById,
  getUserById,
  updateWikiArticle,
} from "./storage"
import { addNotification } from "./notifications"

/**
 * Calculate the age of a flagged revision in hours
 */
export function calculateFlaggedAge(flaggedAt: string): number {
  const now = new Date().getTime()
  const flagged = new Date(flaggedAt).getTime()
  return Math.floor((now - flagged) / (1000 * 60 * 60))
}

/**
 * Filter flagged revisions by various criteria
 */
export interface FlaggedRevisionFilter {
  status?: FlaggedRevisionStatus
  category?: "health" | "regulatory"
  priority?: "low" | "medium" | "high" | "urgent"
  minAge?: number // in hours
  maxAge?: number // in hours
  articleId?: string
  revisionId?: string
}

export function filterFlaggedRevisions(filters: FlaggedRevisionFilter): FlaggedRevision[] {
  let revisions = getFlaggedRevisions()

  if (filters.status) {
    revisions = revisions.filter((fr) => fr.status === filters.status)
  }

  if (filters.category) {
    revisions = revisions.filter((fr) => fr.category === filters.category)
  }

  if (filters.priority) {
    revisions = revisions.filter((fr) => fr.priority === filters.priority)
  }

  if (filters.articleId) {
    revisions = revisions.filter((fr) => fr.articleId === filters.articleId)
  }

  if (filters.revisionId) {
    revisions = revisions.filter((fr) => fr.revisionId === filters.revisionId)
  }

  if (filters.minAge !== undefined || filters.maxAge !== undefined) {
    revisions = revisions.filter((fr) => {
      const age = calculateFlaggedAge(fr.flaggedAt)
      if (filters.minAge !== undefined && age < filters.minAge) return false
      if (filters.maxAge !== undefined && age > filters.maxAge) return false
      return true
    })
  }

  return revisions.sort((a, b) => {
    // Sort by priority first (urgent > high > medium > low)
    const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 }
    const aPriority = priorityOrder[a.priority || "low"] || 1
    const bPriority = priorityOrder[b.priority || "low"] || 1
    if (aPriority !== bPriority) return bPriority - aPriority

    // Then by age (older first)
    return new Date(a.flaggedAt).getTime() - new Date(b.flaggedAt).getTime()
  })
}

/**
 * Flag a revision for Health/Regulatory review
 */
export function flagRevisionForReview(params: {
  revisionId: string
  articleId: string
  flaggedBy?: string
  flagReason: string
  priority?: "low" | "medium" | "high" | "urgent"
  category: "health" | "regulatory"
  notes?: string
}): { success: boolean; error?: string; flaggedRevisionId?: string } {
  const revision = getWikiRevisionById(params.revisionId)
  if (!revision) {
    return { success: false, error: "Revision not found" }
  }

  const article = getWikiArticleById(params.articleId)
  if (!article) {
    return { success: false, error: "Article not found" }
  }

  // Check if this revision is already flagged
  const existing = getFlaggedRevisionsByRevisionId(params.revisionId)
  const activeFlag = existing.find((fr) => fr.status === "flagged" || fr.status === "pending")
  if (activeFlag) {
    return { success: false, error: "This revision is already flagged for review" }
  }

  // Create flagged revision
  const flaggedRevision: FlaggedRevision = {
    id: `flagged_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    revisionId: params.revisionId,
    articleId: params.articleId,
    flaggedBy: params.flaggedBy,
    flaggedAt: new Date().toISOString(),
    status: "flagged",
    flagReason: params.flagReason,
    priority: params.priority || "medium",
    category: params.category,
    notes: params.notes,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  addFlaggedRevision(flaggedRevision)

  return { success: true, flaggedRevisionId: flaggedRevision.id }
}

/**
 * Approve a flagged revision
 */
export function approveFlaggedRevision(
  flaggedRevisionId: string,
  reviewedBy: string,
  rationale: string
): { success: boolean; error?: string } {
  const flaggedRevision = getFlaggedRevisionById(flaggedRevisionId)
  if (!flaggedRevision) {
    return { success: false, error: "Flagged revision not found" }
  }

  if (flaggedRevision.status === "approved" || flaggedRevision.status === "rejected") {
    return { success: false, error: "Flagged revision already processed" }
  }

  // Get the revision and article
  const revision = getWikiRevisionById(flaggedRevision.revisionId)
  if (!revision) {
    return { success: false, error: "Revision not found" }
  }

  const article = getWikiArticleById(flaggedRevision.articleId)
  if (!article) {
    return { success: false, error: "Article not found" }
  }

  // For health articles, mark revision as stable (which requires expert status)
  if (article.category === "health") {
    const result = markRevisionAsStable(flaggedRevision.articleId, flaggedRevision.revisionId, reviewedBy)
    if (!result.success) {
      return { success: false, error: result.error || "Failed to approve revision" }
    }
  } else {
    // For non-health articles, we can still update the article to use this revision
    const updatedArticle = {
      ...article,
      currentRevisionId: flaggedRevision.revisionId,
      stableRevisionId: flaggedRevision.revisionId,
      approvedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    updateWikiArticle(updatedArticle)
  }

  // Update the flagged revision status
  updateFlaggedRevision(flaggedRevisionId, {
    status: "approved",
    reviewedBy,
    reviewedAt: new Date().toISOString(),
    rationale,
  })

  // Notify the revision author
  const author = getUserById(revision.authorId)
  if (author) {
    addNotification({
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: revision.authorId,
      type: "message",
      actorId: reviewedBy,
      targetId: flaggedRevision.articleId,
      targetType: "wiki",
      message: `Your revision for "${article.title}" has been approved. ${rationale ? `Rationale: ${rationale}` : ""}`,
      read: false,
      createdAt: new Date().toISOString(),
    })
  }

  return { success: true }
}

/**
 * Reject a flagged revision
 */
export function rejectFlaggedRevision(
  flaggedRevisionId: string,
  reviewedBy: string,
  rationale: string
): { success: boolean; error?: string } {
  const flaggedRevision = getFlaggedRevisionById(flaggedRevisionId)
  if (!flaggedRevision) {
    return { success: false, error: "Flagged revision not found" }
  }

  if (flaggedRevision.status === "approved" || flaggedRevision.status === "rejected") {
    return { success: false, error: "Flagged revision already processed" }
  }

  // Update the flagged revision status
  updateFlaggedRevision(flaggedRevisionId, {
    status: "rejected",
    reviewedBy,
    reviewedAt: new Date().toISOString(),
    rationale,
  })

  // Notify the revision author
  const revision = getWikiRevisionById(flaggedRevision.revisionId)
  if (revision) {
    const author = getUserById(revision.authorId)
    const article = getWikiArticleById(flaggedRevision.articleId)
    if (author && article) {
      addNotification({
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: revision.authorId,
        type: "message",
        actorId: reviewedBy,
        targetId: flaggedRevision.articleId,
        targetType: "wiki",
        message: `Your revision for "${article.title}" has been rejected. Rationale: ${rationale}`,
        read: false,
        createdAt: new Date().toISOString(),
      })
    }
  }

  return { success: true }
}

/**
 * Get paginated flagged revisions
 */
export interface PaginationOptions {
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

export function getPaginatedFlaggedRevisions(
  filters: FlaggedRevisionFilter,
  options: PaginationOptions
): PaginatedResult<FlaggedRevision> {
  const filtered = filterFlaggedRevisions(filters)
  const total = filtered.length
  const totalPages = Math.ceil(total / options.pageSize)
  
  const startIndex = (options.page - 1) * options.pageSize
  const endIndex = startIndex + options.pageSize
  const items = filtered.slice(startIndex, endIndex)
  
  return {
    items,
    total,
    page: options.page,
    pageSize: options.pageSize,
    totalPages,
  }
}

/**
 * Get audit trail for a flagged revision
 */
export function getFlaggedRevisionAuditTrail(flaggedRevisionId: string): FlaggedRevisionAuditLog[] {
  return getFlaggedRevisionAuditLogsByFlaggedRevisionId(flaggedRevisionId)
}

/**
 * Get flagged revision statistics
 */
export interface FlaggedRevisionStats {
  totalFlagged: number
  totalPending: number
  totalApproved: number
  totalRejected: number
  pendingByCategory: Record<string, number>
  pendingByPriority: Record<string, number>
  avgProcessingTime: number // in hours
  oldestPending: FlaggedRevision | null
}

export function getFlaggedRevisionStats(): FlaggedRevisionStats {
  const allRevisions = getFlaggedRevisions()
  const flagged = allRevisions.filter((fr) => fr.status === "flagged")
  const pending = allRevisions.filter((fr) => fr.status === "pending" || fr.status === "flagged")
  const approved = allRevisions.filter((fr) => fr.status === "approved")
  const rejected = allRevisions.filter((fr) => fr.status === "rejected")

  // Calculate pending by category
  const pendingByCategory: Record<string, number> = {}
  pending.forEach((fr) => {
    const category = fr.category || "unknown"
    pendingByCategory[category] = (pendingByCategory[category] || 0) + 1
  })

  // Calculate pending by priority
  const pendingByPriority: Record<string, number> = {}
  pending.forEach((fr) => {
    const priority = fr.priority || "low"
    pendingByPriority[priority] = (pendingByPriority[priority] || 0) + 1
  })

  // Calculate average processing time for approved/rejected
  const processed = [...approved, ...rejected].filter((fr) => fr.reviewedAt)
  const avgProcessingTime =
    processed.length > 0
      ? processed.reduce((sum, fr) => {
          const flagged = new Date(fr.flaggedAt).getTime()
          const reviewed = new Date(fr.reviewedAt!).getTime()
          return sum + (reviewed - flagged) / (1000 * 60 * 60)
        }, 0) / processed.length
      : 0

  // Find oldest pending revision
  const oldestPending =
    pending.length > 0
      ? pending.sort((a, b) => new Date(a.flaggedAt).getTime() - new Date(b.flaggedAt).getTime())[0]
      : null

  return {
    totalFlagged: flagged.length,
    totalPending: pending.length,
    totalApproved: approved.length,
    totalRejected: rejected.length,
    pendingByCategory,
    pendingByPriority,
    avgProcessingTime,
    oldestPending,
  }
}

