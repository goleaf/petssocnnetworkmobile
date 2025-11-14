/**
 * Type definitions for the moderation system
 * 
 * This module defines all TypeScript interfaces and types used across
 * the moderation infrastructure, including edit requests, queues,
 * bulk operations, and link management.
 */

/**
 * Content types that can be moderated
 */
export type ContentType = 'blog' | 'wiki' | 'pet' | 'profile'

/**
 * Status of an edit request in the moderation workflow
 */
export type EditRequestStatus = 'pending' | 'approved' | 'rejected'

/**
 * Priority levels for edit requests
 */
export type EditRequestPriority = 'low' | 'normal' | 'high' | 'urgent'

/**
 * Types of specialized moderation queues
 */
export type QueueType = 'new-pages' | 'flagged-health' | 'coi-edits' | 'image-reviews'

/**
 * Types of bulk operations that can be performed
 */
export type BulkOperationType = 'revert' | 'range-block'

/**
 * Link rule types for whitelist/blacklist management
 */
export type LinkRuleType = 'whitelist' | 'blacklist'

/**
 * Metadata flags for edit request classification
 */
export interface EditRequestMetadata {
  /** Indicates potential conflict of interest */
  isCOI?: boolean
  /** Indicates health-related content requiring expert review */
  isFlaggedHealth?: boolean
  /** Indicates this is a new page creation */
  isNewPage?: boolean
  /** Indicates the edit includes image uploads */
  hasImages?: boolean
  /** Hidden categories for internal triage */
  categories?: string[]
}

/**
 * Core edit request interface representing a proposed content change
 */
export interface EditRequest {
  /** Unique identifier */
  id: string
  /** Type of content being edited */
  contentType: ContentType
  /** ID of the content being edited */
  contentId: string
  /** ID of the user who submitted the edit */
  userId: string
  /** Current status of the edit request */
  status: EditRequestStatus
  /** Priority level for moderation */
  priority: EditRequestPriority
  /** Structured diff showing the changes (JSON format) */
  changes: Record<string, any>
  /** Optional reason provided by the user */
  reason?: string
  /** ID of the moderator who reviewed this request */
  reviewedBy?: string
  /** Timestamp when the request was reviewed */
  reviewedAt?: Date
  /** Timestamp when the request was created */
  createdAt: Date
  /** Timestamp when the request was last updated */
  updatedAt: Date
  /** Metadata flags for queue classification */
  metadata: EditRequestMetadata
}

/**
 * Input data for creating a new edit request
 */
export interface CreateEditRequestInput {
  contentType: ContentType
  contentId: string
  userId: string
  priority?: EditRequestPriority
  changes: Record<string, any>
  reason?: string
  metadata?: EditRequestMetadata
}

/**
 * Input data for updating an existing edit request
 */
export interface UpdateEditRequestInput {
  status?: EditRequestStatus
  priority?: EditRequestPriority
  changes?: Record<string, any>
  reason?: string
  reviewedBy?: string
  reviewedAt?: Date
  metadata?: EditRequestMetadata
}

/**
 * Filters for querying edit requests
 */
export interface QueueFilters {
  /** Filter by content type(s) */
  contentType?: ContentType[]
  /** Filter by status(es) */
  status?: EditRequestStatus[]
  /** Filter by priority level(s) */
  priority?: EditRequestPriority[]
  /** Filter by age in days (e.g., only show items from last N days) */
  ageInDays?: number
  /** Filter by hidden categories */
  categories?: string[]
  /** Filter by COI flag */
  isCOI?: boolean
  /** Filter by health flag */
  isFlaggedHealth?: boolean
  /** Filter by new page flag */
  isNewPage?: boolean
  /** Filter by images flag */
  hasImages?: boolean
}

/**
 * Pagination parameters for list queries
 */
export interface Pagination {
  /** Page number (0-indexed) */
  page: number
  /** Number of items per page */
  limit: number
}

/**
 * Paginated result wrapper
 */
export interface PaginatedResult<T> {
  /** Array of items for the current page */
  items: T[]
  /** Total number of items across all pages */
  totalCount: number
  /** Current page number */
  page: number
  /** Number of items per page */
  limit: number
  /** Total number of pages */
  totalPages: number
  /** Whether there is a next page */
  hasNextPage: boolean
  /** Whether there is a previous page */
  hasPreviousPage: boolean
}

/**
 * Specialized moderation queue with filtered items
 */
export interface ModerationQueue {
  /** Type of queue */
  type: QueueType
  /** Edit requests in this queue */
  items: EditRequest[]
  /** Total count of items matching filters */
  totalCount: number
  /** Active filters applied to this queue */
  filters: QueueFilters
}

/**
 * Bulk operation request
 */
export interface BulkOperation {
  /** Type of bulk operation to perform */
  type: BulkOperationType
  /** IDs of edit requests to operate on */
  targetIds: string[]
  /** Reason for the bulk operation */
  reason: string
  /** ID of the moderator executing the operation */
  executedBy: string
}

/**
 * Result of a bulk operation
 */
export interface BulkOperationResult {
  /** Number of items successfully processed */
  successCount: number
  /** Number of items that failed */
  failureCount: number
  /** IDs of items that failed */
  failedIds: string[]
  /** Error messages for failed items */
  errors: Array<{ id: string; error: string }>
}

/**
 * Link rule for whitelist/blacklist management
 */
export interface LinkRule {
  /** Unique identifier */
  id: string
  /** Domain name (e.g., "example.com" or "*.example.com" for wildcards) */
  domain: string
  /** Type of rule */
  type: LinkRuleType
  /** Optional reason for adding this rule */
  reason?: string
  /** ID of the moderator who added this rule */
  addedBy: string
  /** Timestamp when the rule was added */
  addedAt: Date
}

/**
 * Input data for creating a new link rule
 */
export interface CreateLinkRuleInput {
  domain: string
  type: LinkRuleType
  reason?: string
  addedBy: string
}

/**
 * Result of link validation
 */
export interface LinkValidationResult {
  /** Whether all links are valid */
  isValid: boolean
  /** List of blacklisted domains found */
  blacklistedDomains: string[]
  /** List of domains not on whitelist */
  unwhitelistedDomains: string[]
  /** Whether the content should be flagged for review */
  requiresReview: boolean
}

/**
 * Filters for recent changes feed
 */
export interface RecentChangesFilters extends QueueFilters {
  /** Filter by user ID */
  userId?: string
  /** Filter by moderator ID */
  reviewedBy?: string
}

/**
 * Moderation category for internal triage
 */
export interface ModerationCategory {
  /** Unique identifier */
  id: string
  /** Category name (e.g., "Needs maps", "Outdated laws") */
  name: string
  /** Optional description */
  description?: string
  /** ID of the moderator who created this category */
  createdBy: string
  /** Timestamp when the category was created */
  createdAt: Date
}

/**
 * Input data for creating a new moderation category
 */
export interface CreateModerationCategoryInput {
  name: string
  description?: string
  createdBy: string
}
