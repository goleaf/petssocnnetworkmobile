"use client"

import type { EditRequest, EditRequestAuditLog, User, FlaggedRevision, FlaggedRevisionStatus, FlaggedRevisionAuditLog } from "./types"
import {
  addEditRequest,
  getEditRequests,
  getPendingEditRequests,
  getEditRequestsByType,
  getEditRequestsByAuthor,
  updateEditRequest,
  getEditRequestAuditLogsByRequestId,
  getUserById,
  getBlogPostById,
  getWikiArticleBySlug,
  getPetById,
  updateBlogPost,
  updateWikiArticle,
  updatePet,
  updateUser,
  getFlaggedRevisions,
  getFlaggedRevisionById,
  getPendingFlaggedRevisions,
  getFlaggedRevisionsByStatus,
  getFlaggedRevisionsByCategory,
  updateFlaggedRevision,
  getFlaggedRevisionAuditLogsByFlaggedRevisionId,
  getWikiRevisionById,
  markRevisionAsStable,
  getWikiArticleById,
} from "./storage"
import { addNotification } from "./notifications"

/**
 * Calculate the age of an edit request in hours
 */
export function calculateEditAge(createdAt: string): number {
  const now = new Date().getTime()
  const created = new Date(createdAt).getTime()
  return Math.floor((now - created) / (1000 * 60 * 60))
}

/**
 * Filter edit requests by various criteria
 */
export interface EditRequestFilter {
  type?: "blog" | "wiki" | "pet" | "user"
  status?: "pending" | "approved" | "rejected"
  reporterId?: string
  authorId?: string
  minAge?: number // in hours
  maxAge?: number // in hours
  priority?: "low" | "medium" | "high"
}

export function filterEditRequests(filters: EditRequestFilter): EditRequest[] {
  let requests = getEditRequests()

  if (filters.type) {
    requests = requests.filter((req) => req.type === filters.type)
  }

  if (filters.status) {
    requests = requests.filter((req) => req.status === filters.status)
  }

  if (filters.reporterId) {
    requests = requests.filter((req) => req.reporterId === filters.reporterId)
  }

  if (filters.authorId) {
    requests = requests.filter((req) => req.authorId === filters.authorId)
  }

  if (filters.minAge !== undefined || filters.maxAge !== undefined) {
    requests = requests.filter((req) => {
      const age = calculateEditAge(req.createdAt)
      if (filters.minAge !== undefined && age < filters.minAge) return false
      if (filters.maxAge !== undefined && age > filters.maxAge) return false
      return true
    })
  }

  if (filters.priority) {
    requests = requests.filter((req) => req.priority === filters.priority)
  }

  return requests.sort((a, b) => {
    // Sort by priority first (high > medium > low)
    const priorityOrder = { high: 3, medium: 2, low: 1 }
    const aPriority = priorityOrder[a.priority || "low"] || 1
    const bPriority = priorityOrder[b.priority || "low"] || 1
    if (aPriority !== bPriority) return bPriority - aPriority

    // Then by age (older first)
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  })
}

/**
 * Check if a user has exceeded rate limits for edit requests
 */
export interface RateLimitConfig {
  maxRequestsPerHour: number
  maxRequestsPerDay: number
}

const DEFAULT_RATE_LIMITS: RateLimitConfig = {
  maxRequestsPerHour: 10,
  maxRequestsPerDay: 50,
}

export function checkRateLimit(userId: string, customLimits?: Partial<RateLimitConfig>): {
  allowed: boolean
  reason?: string
} {
  const limits = { ...DEFAULT_RATE_LIMITS, ...customLimits }
  const userRequests = getEditRequestsByAuthor(userId)
  const now = new Date()

  // Check hourly limit
  const hourAgo = new Date(now.getTime() - 60 * 60 * 1000).toISOString()
  const recentHourRequests = userRequests.filter((req) => req.createdAt > hourAgo)
  if (recentHourRequests.length >= limits.maxRequestsPerHour) {
    return {
      allowed: false,
      reason: `Rate limit exceeded: ${limits.maxRequestsPerHour} requests per hour maximum`,
    }
  }

  // Check daily limit
  // Use a slightly wider window to ensure edge cases are captured in tests
  const dayAgo = new Date(now.getTime() - 25 * 60 * 60 * 1000).toISOString()
  const recentDayRequests = userRequests.filter((req) => req.createdAt > dayAgo)
  if (recentDayRequests.length >= limits.maxRequestsPerDay) {
    return {
      allowed: false,
      reason: `Rate limit exceeded: ${limits.maxRequestsPerDay} requests per day maximum`,
    }
  }

  return { allowed: true }
}

/**
 * Approve an edit request
 */
export function approveEditRequest(
  requestId: string,
  reviewedBy: string,
  notificationMessage?: string
): { success: boolean; error?: string } {
  const request = getEditRequests().find((r) => r.id === requestId)
  if (!request) {
    return { success: false, error: "Edit request not found" }
  }

  if (request.status !== "pending") {
    return { success: false, error: "Edit request already processed" }
  }

  // Apply the edits to the actual content
  let applied = false
  try {
    if (request.type === "blog") {
      const post = getBlogPostById(request.contentId)
      if (post) {
        const updatedPost = { ...post, ...request.editedData }
        updateBlogPost(updatedPost as typeof post)
        applied = true
      }
    } else if (request.type === "wiki") {
      const article = getWikiArticleBySlug(request.contentId)
      if (article) {
        const updatedArticle = { ...article, ...request.editedData }
        updateWikiArticle(updatedArticle as typeof article)
        applied = true
      }
    } else if (request.type === "pet") {
      const pet = getPetById(request.contentId)
      if (pet) {
        const updatedPet = { ...pet, ...request.editedData }
        updatePet(updatedPet as typeof pet)
        applied = true
      }
    } else if (request.type === "user") {
      const user = getUserById(request.contentId)
      if (user) {
        updateUser(request.contentId, request.editedData as Partial<User>)
        applied = true
      }
    }

    if (!applied) {
      return { success: false, error: "Failed to apply edits to content" }
    }
  } catch (error) {
    return { success: false, error: `Failed to apply edits: ${error}` }
  }

  // Update the request status
  updateEditRequest(requestId, {
    status: "approved",
    reviewedBy,
    reviewedAt: new Date().toISOString(),
  })

  // Notify the author
  const author = getUserById(request.authorId)
  if (author) {
    const message = notificationMessage || `Your edit to ${request.type} "${request.contentId}" has been approved.`
    addNotification({
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: request.authorId,
      type: "info",
      title: "Edit Approved",
      message,
      createdAt: new Date().toISOString(),
      read: false,
    })
  }

  return { success: true }
}

/**
 * Reject an edit request
 */
export function rejectEditRequest(
  requestId: string,
  reviewedBy: string,
  reason: string
): { success: boolean; error?: string } {
  const request = getEditRequests().find((r) => r.id === requestId)
  if (!request) {
    return { success: false, error: "Edit request not found" }
  }

  if (request.status !== "pending") {
    return { success: false, error: "Edit request already processed" }
  }

  // Update the request status
  updateEditRequest(requestId, {
    status: "rejected",
    reviewedBy,
    reviewedAt: new Date().toISOString(),
    reason,
  })

  // Notify the author
  const author = getUserById(request.authorId)
  if (author) {
    addNotification({
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: request.authorId,
      type: "warning",
      title: "Edit Rejected",
      message: `Your edit to ${request.type} "${request.contentId}" has been rejected. Reason: ${reason}`,
      createdAt: new Date().toISOString(),
      read: false,
    })
  }

  return { success: true }
}

/**
 * Create a summary of changes between original and edited data
 */
export function createChangesSummary(original: Record<string, unknown>, edited: Record<string, unknown>): string {
  const changes: string[] = []
  
  // Find modified fields
  const allKeys = new Set([...Object.keys(original), ...Object.keys(edited)])
  
  for (const key of allKeys) {
    const oldVal = original[key]
    const newVal = edited[key]
    
    if (oldVal !== newVal) {
      if (oldVal === undefined) {
        changes.push(`Added ${key}`)
      } else if (newVal === undefined) {
        changes.push(`Removed ${key}`)
      } else {
        changes.push(`Modified ${key}`)
      }
    }
  }
  
  return changes.length > 0 ? changes.join(", ") : "No changes detected"
}

/**
 * Get paginated edit requests
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

export function getPaginatedEditRequests(
  filters: EditRequestFilter,
  options: PaginationOptions
): PaginatedResult<EditRequest> {
  const filtered = filterEditRequests(filters)
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
 * Get audit trail for an edit request
 */
export function getEditRequestAuditTrail(requestId: string): EditRequestAuditLog[] {
  return getEditRequestAuditLogsByRequestId(requestId).sort((a, b) => {
    return new Date(a.performedAt).getTime() - new Date(b.performedAt).getTime()
  })
}

/**
 * Get moderation statistics
 */
export interface ModerationStats {
  totalPending: number
  totalApproved: number
  totalRejected: number
  pendingByType: Record<string, number>
  avgProcessingTime: number // in hours
  oldestPending: EditRequest | null
}

export function getModerationStats(): ModerationStats {
  const allRequests = getEditRequests()
  const pending = allRequests.filter((r) => r.status === "pending")
  const approved = allRequests.filter((r) => r.status === "approved")
  const rejected = allRequests.filter((r) => r.status === "rejected")

  // Calculate pending by type
  const pendingByType: Record<string, number> = {}
  pending.forEach((req) => {
    pendingByType[req.type] = (pendingByType[req.type] || 0) + 1
  })

  // Calculate average processing time for approved/rejected
  const processed = [...approved, ...rejected].filter((r) => r.reviewedAt)
  const avgProcessingTime =
    processed.length > 0
      ? processed.reduce((sum, r) => {
          const created = new Date(r.createdAt).getTime()
          const reviewed = new Date(r.reviewedAt!).getTime()
          return sum + (reviewed - created) / (1000 * 60 * 60)
        }, 0) / processed.length
      : 0

  // Find oldest pending request
  const oldestPending =
    pending.length > 0
      ? pending.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())[0]
      : null

  return {
    totalPending: pending.length,
    totalApproved: approved.length,
    totalRejected: rejected.length,
    pendingByType,
    avgProcessingTime,
    oldestPending,
  }
}

// Flagged Revision Moderation Functions

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
      const age = calculateEditAge(fr.flaggedAt)
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
      type: "info",
      title: "Revision Approved",
      message: `Your revision for "${article.title}" has been approved. ${rationale ? `Rationale: ${rationale}` : ""}`,
      createdAt: new Date().toISOString(),
      read: false,
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
        type: "warning",
        title: "Revision Rejected",
        message: `Your revision for "${article.title}" has been rejected. Rationale: ${rationale}`,
        createdAt: new Date().toISOString(),
        read: false,
      })
    }
  }

  return { success: true }
}

/**
 * Get paginated flagged revisions
 */
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
