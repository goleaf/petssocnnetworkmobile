export type Environment = "production" | "staging" | "development"

export interface QueueBacklog {
  queueName: string
  pending: number
  processing: number
  failed: number
  lastProcessedAt: string | null
  avgProcessingTime: number
}

export interface WorkerHealth {
  workerId: string
  status: "healthy" | "degraded" | "unhealthy" | "offline"
  lastHeartbeat: string
  jobsProcessed: number
  errors: number
  uptime: number
  cpuUsage?: number
  memoryUsage?: number
}

export interface ErrorSpike {
  timestamp: string
  count: number
  severity: "critical" | "high" | "medium" | "low"
  errorType: string
  message: string
}

export interface StorageUsage {
  service: string
  used: number // bytes
  total: number // bytes
  percentage: number
  alerts: string[]
}

export interface OperationsMetrics {
  environment: Environment
  queues: QueueBacklog[]
  workers: WorkerHealth[]
  errorSpikes: ErrorSpike[]
  storage: StorageUsage[]
  lastUpdated: string
}

