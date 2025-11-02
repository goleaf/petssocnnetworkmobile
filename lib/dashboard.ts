import { prisma } from "@/lib/prisma"
import { subDays, startOfDay } from "date-fns"

export interface DashboardMetric {
  count: number
  trend: number[] // Last 7 days of counts
}

export interface DashboardCardData {
  title: string
  count: number
  trend: number[]
  href: string
  icon: string
}

/**
 * Get new reports count for last 24 hours with 7-day trend
 */
export async function getNewReports24h(): Promise<DashboardMetric> {
  const now = new Date()
  const twentyFourHoursAgo = subDays(now, 1)
  const sevenDaysAgo = subDays(now, 7)

  // Count in last 24 hours
  const count24h = await prisma.contentReport.count({
    where: {
      createdAt: {
        gte: twentyFourHoursAgo,
      },
    },
  })

  // Get 7-day trend
  const trend: number[] = []
  for (let i = 6; i >= 0; i--) {
    const dayStart = startOfDay(subDays(now, i))
    const dayEnd = startOfDay(subDays(now, i - 1))
    
    const dayCount = await prisma.contentReport.count({
      where: {
        createdAt: {
          gte: dayStart,
          lt: dayEnd,
        },
      },
    })
    trend.push(dayCount)
  }

  return { count: count24h, trend }
}

/**
 * Get open moderation cases count with 7-day trend
 */
export async function getOpenModerationCases(): Promise<DashboardMetric> {
  const now = new Date()
  
  // Count open cases
  const count = await prisma.moderationQueue.count({
    where: {
      status: {
        in: ["pending", "in_review"],
      },
    },
  })

  // Get 7-day trend (count cases created each day that are still open)
  const trend: number[] = []
  for (let i = 6; i >= 0; i--) {
    const dayStart = startOfDay(subDays(now, i))
    const dayEnd = startOfDay(subDays(now, i - 1))
    
    // Count cases created in that day that are still open
    const dayCount = await prisma.moderationQueue.count({
      where: {
        createdAt: {
          gte: dayStart,
          lt: dayEnd,
        },
        status: {
          in: ["pending", "in_review"],
        },
      },
    })
    trend.push(dayCount)
  }

  return { count, trend }
}

/**
 * Get flagged wiki edits count with 7-day trend
 * Flagged edits are revisions that haven't been approved and are older than a certain threshold
 */
export async function getFlaggedWikiEdits(): Promise<DashboardMetric> {
  const now = new Date()
  
  // Count flagged edits (revisions without approvedAt, created more than 1 day ago)
  const oneDayAgo = subDays(now, 1)
  const count = await prisma.revision.count({
    where: {
      approvedAt: null,
      createdAt: {
        lt: oneDayAgo,
      },
      article: {
        type: "health", // Wiki articles
      },
    },
  })

  // Get 7-day trend
  const trend: number[] = []
  for (let i = 6; i >= 0; i--) {
    const dayStart = startOfDay(subDays(now, i))
    const dayEnd = startOfDay(subDays(now, i - 1))
    
    // Count revisions created in that day that are still pending
    const dayCount = await prisma.revision.count({
      where: {
        createdAt: {
          gte: dayStart,
          lt: dayEnd,
        },
        approvedAt: null,
        article: {
          type: "health",
        },
      },
    })
    trend.push(dayCount)
  }

  return { count, trend }
}

/**
 * Get stale health pages count (not updated in last 90 days) with 7-day trend
 */
export async function getStaleHealthPages(): Promise<DashboardMetric> {
  const now = new Date()
  const ninetyDaysAgo = subDays(now, 90)
  
  // Count stale health pages
  const count = await prisma.article.count({
    where: {
      type: "health",
      updatedAt: {
        lt: ninetyDaysAgo,
      },
      deletedAt: null,
    },
  })

  // Get 7-day trend (count of pages that became stale each day)
  const trend: number[] = []
  for (let i = 6; i >= 0; i--) {
    const dayStart = startOfDay(subDays(now, i))
    const dayEnd = startOfDay(subDays(now, i - 1))
    const staleDate = subDays(dayEnd, 90)
    
    // Count pages that became stale in this day (updatedAt between staleDate and staleDate-1)
    const dayCount = await prisma.article.count({
      where: {
        type: "health",
        updatedAt: {
          gte: subDays(staleDate, 1),
          lt: staleDate,
        },
        deletedAt: null,
      },
    })
    trend.push(dayCount)
  }

  return { count, trend }
}

/**
 * Get zero-result searches count (last 24h) with 7-day trend
 */
export async function getZeroResultSearches(): Promise<DashboardMetric> {
  const now = new Date()
  const twentyFourHoursAgo = subDays(now, 1)
  
  // Count zero-result searches in last 24h
  const count24h = await prisma.searchTelemetry.count({
    where: {
      createdAt: {
        gte: twentyFourHoursAgo,
      },
      hasResults: false,
    },
  })

  // Get 7-day trend
  const trend: number[] = []
  for (let i = 6; i >= 0; i--) {
    const dayStart = startOfDay(subDays(now, i))
    const dayEnd = startOfDay(subDays(now, i - 1))
    
    const dayCount = await prisma.searchTelemetry.count({
      where: {
        createdAt: {
          gte: dayStart,
          lt: dayEnd,
        },
        hasResults: false,
      },
    })
    trend.push(dayCount)
  }

  return { count: count24h, trend }
}

/**
 * Get queue backlog count with 7-day trend
 */
export async function getQueueBacklog(): Promise<DashboardMetric> {
  const now = new Date()
  
  // Count items in queue
  const count = await prisma.moderationQueue.count({
    where: {
      status: "pending",
    },
  })

  // Get 7-day trend (count items created each day that are still pending)
  const trend: number[] = []
  for (let i = 6; i >= 0; i--) {
    const dayStart = startOfDay(subDays(now, i))
    const dayEnd = startOfDay(subDays(now, i - 1))
    
    // Count items created in that day that are still pending
    const dayCount = await prisma.moderationQueue.count({
      where: {
        createdAt: {
          gte: dayStart,
          lt: dayEnd,
        },
        status: "pending",
      },
    })
    trend.push(dayCount)
  }

  return { count, trend }
}

/**
 * Get all dashboard metrics
 */
export async function getAllDashboardMetrics(): Promise<{
  newReports24h: DashboardMetric
  openModerationCases: DashboardMetric
  flaggedWikiEdits: DashboardMetric
  staleHealthPages: DashboardMetric
  zeroResultSearches: DashboardMetric
  queueBacklog: DashboardMetric
}> {
  const [
    newReports24h,
    openModerationCases,
    flaggedWikiEdits,
    staleHealthPages,
    zeroResultSearches,
    queueBacklog,
  ] = await Promise.all([
    getNewReports24h(),
    getOpenModerationCases(),
    getFlaggedWikiEdits(),
    getStaleHealthPages(),
    getZeroResultSearches(),
    getQueueBacklog(),
  ])

  return {
    newReports24h,
    openModerationCases,
    flaggedWikiEdits,
    staleHealthPages,
    zeroResultSearches,
    queueBacklog,
  }
}

