/**
 * Queue job types and interfaces
 */

export type JobType = "linkCheck" | "notifyUser" | "rebuildSearchIndex" | "sendNotification"

export type JobStatus = "pending" | "processing" | "completed" | "failed"

export interface QueueJob {
  id: string
  type: JobType
  status: JobStatus
  priority: number
  payload: Record<string, unknown>
  result?: Record<string, unknown>
  error?: string
  progress: number
  progressMessage?: string
  attempts: number
  maxAttempts: number
  createdAt: Date
  startedAt?: Date
  completedAt?: Date
}

export interface LinkCheckJobPayload {
  url: string
}

export interface LinkCheckJobResult {
  url: string
  isValid: boolean
  statusCode?: number
  error?: string
  checkedAt: string
}

export interface NotifyUserJobPayload {
  userId: string
  templateId: string
  data?: Record<string, unknown>
}

export interface NotifyUserJobResult {
  success: boolean
  message?: string
  sentAt: string
}

export interface RebuildSearchIndexJobPayload {
  type?: "articles" | "blogPosts" | "all"
}

export interface RebuildSearchIndexJobResult {
  success: boolean
  indexed: number
  errors: number
  duration: number
}

export interface SendNotificationJobPayload {
  templateId: string
  segment: {
    roles?: string[]
    locales?: string[]
    groups?: string[]
  }
  variables?: Record<string, unknown>
}

export interface SendNotificationJobResult {
  success: boolean
  sentCount: number
  failedCount: number
  totalCount: number
  sentAt: string
}

