"use client"

import type { EditRequest, EditRequestAuditLog, User } from "./types"
import {
  addEditRequest,
  getEditRequests,
  getPendingEditRequests,
  getEditRequestsByType,
  getEditRequestsByAuthor,
  updateEditRequest,
  getEditRequestAuditLogsByRequestId,
  getUserById,
  addNotification,
  getBlogPostById,
  getWikiArticleBySlug,
  getPetById,
  updateBlogPost,
  updateWikiArticle,
  updatePet,
  updateUser,
} from "./storage"

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
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
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

