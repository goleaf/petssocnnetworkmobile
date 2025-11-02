import type {
  EditRequest,
  ArticleReport,
  COIFlag,
  RollbackHistoryEntry,
  BlogPost,
  WikiArticle,
  WikiRevision,
  SearchAnalyticsEvent,
  Group,
  GroupMember,
  GroupTopic,
} from "@/lib/types"
import {
  getEditRequests,
  getArticleReports,
  getCOIFlags,
  getRollbackHistory,
  getBlogPosts,
  getWikiArticles,
  getWikiRevisions,
  getGroups,
  getGroupMembersByGroupId,
  getGroupTopicsByGroupId,
} from "@/lib/storage"
import { getAllEvents } from "./search-analytics"

export interface AnalyticsTableRow {
  id: string
  date: string
  dateLocal: string
  type: string
  status?: string
  metric1: string
  metric2: string
  metric3: string
  details?: Record<string, unknown>
}

export interface AnalyticsMetadata {
  totalRows: number
  totalPages: number
  currentPage: number
  pageSize: number
  filters: Record<string, unknown>
  dateRange: { start: string; end: string }
  timezone: string
}

export interface AnalyticsData {
  rows: AnalyticsTableRow[]
  metadata: AnalyticsMetadata
}

/**
 * Get timezone string
 */
export function getTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone
}

/**
 * Convert UTC date to local timezone string
 */
export function formatDateWithTimezone(
  dateString: string,
  format = "MMM dd, yyyy HH:mm:ss"
): string {
  const date = new Date(dateString)
  return date.toLocaleString("en-US", {
    timeZone: getTimezone(),
    dateStyle: "medium",
    timeStyle: "short",
  })
}

/**
 * Filter data by date range
 */
export function filterByDateRange<T extends { createdAt?: string; timestamp?: string }>(
  data: T[],
  startDate?: Date,
  endDate?: Date
): T[] {
  if (!startDate && !endDate) return data

  return data.filter((item) => {
    const itemDate = new Date(item.createdAt || item.timestamp || "")
    if (startDate && itemDate < startDate) return false
    if (endDate && itemDate > endDate) return false
    return true
  })
}

/**
 * Paginate data
 */
export function paginate<T>(data: T[], page: number, pageSize: number): {
  items: T[]
  totalPages: number
  currentPage: number
  totalItems: number
} {
  const startIndex = (page - 1) * pageSize
  const endIndex = startIndex + pageSize
  const items = data.slice(startIndex, endIndex)
  const totalPages = Math.ceil(data.length / pageSize)

  return {
    items,
    totalPages,
    currentPage: page,
    totalItems: data.length,
  }
}

/**
 * Get Moderation Analytics
 */
export function getModerationAnalytics(params: {
  startDate?: Date
  endDate?: Date
  page?: number
  pageSize?: number
  type?: "edits" | "reports" | "rollback" | "coi"
}): AnalyticsData {
  const {
    startDate,
    endDate,
    page = 1,
    pageSize = 50,
    type = "edits",
  } = params

  let allData: AnalyticsTableRow[] = []

  if (type === "edits") {
    const edits = getEditRequests()
    const filtered = filterByDateRange(edits, startDate, endDate)
    allData = filtered.map((edit) => ({
      id: edit.id,
      date: edit.createdAt,
      dateLocal: formatDateWithTimezone(edit.createdAt),
      type: edit.type,
      status: edit.status,
      metric1: edit.reason || "N/A",
      metric2: edit.priority || "low",
      metric3: `${calculateEditAge(edit.createdAt)}h`,
      details: edit,
    }))
  } else if (type === "reports") {
    const reports = getArticleReports()
    const filtered = filterByDateRange(reports, startDate, endDate)
    allData = filtered.map((report) => ({
      id: report.id,
      date: report.reportedAt,
      dateLocal: formatDateWithTimezone(report.reportedAt),
      type: report.articleType,
      status: report.status,
      metric1: report.reason,
      metric2: report.articleId.substring(0, 8),
      metric3: report.reporterId.substring(0, 8),
      details: report,
    }))
  } else if (type === "rollback") {
    const rollbacks = getRollbackHistory()
    const filtered = filterByDateRange(rollbacks, startDate, endDate)
    allData = filtered.map((rollback) => ({
      id: rollback.id,
      date: rollback.performedAt,
      dateLocal: formatDateWithTimezone(rollback.performedAt),
      type: rollback.contentType,
      metric1: rollback.contentId.substring(0, 8),
      metric2: rollback.performedBy,
      metric3: rollback.reason || "N/A",
      details: rollback,
    }))
  } else if (type === "coi") {
    const flags = getCOIFlags()
    const filtered = filterByDateRange(flags, startDate, endDate)
    allData = filtered.map((flag) => ({
      id: flag.id,
      date: flag.flaggedAt,
      dateLocal: formatDateWithTimezone(flag.flaggedAt),
      type: flag.contentType,
      status: flag.status,
      metric1: flag.severity,
      metric2: flag.contentId.substring(0, 8),
      metric3: flag.flaggerId.substring(0, 8),
      details: flag,
    }))
  }

  const paginated = paginate(allData, page, pageSize)

  return {
    rows: paginated.items,
    metadata: {
      totalRows: paginated.totalItems,
      totalPages: paginated.totalPages,
      currentPage: paginated.currentPage,
      pageSize,
      filters: { type, startDate, endDate },
      dateRange: {
        start: startDate?.toISOString() || "",
        end: endDate?.toISOString() || "",
      },
      timezone: getTimezone(),
    },
  }
}

/**
 * Get Wiki Analytics
 */
export function getWikiAnalytics(params: {
  startDate?: Date
  endDate?: Date
  page?: number
  pageSize?: number
}): AnalyticsData {
  const { startDate, endDate, page = 1, pageSize = 50 } = params

  const articles = getWikiArticles()
  const revisions = getWikiRevisions()
  
  const filteredArticles = filterByDateRange(articles, startDate, endDate)
  const filteredRevisions = filterByDateRange(revisions, startDate, endDate)

  const articleData: AnalyticsTableRow[] = filteredArticles.map((article) => ({
    id: article.id,
    date: article.createdAt,
    dateLocal: formatDateWithTimezone(article.createdAt),
    type: "Article Created",
    metric1: article.title,
    metric2: article.category || "Uncategorized",
    metric3: article.authorId.substring(0, 8),
    details: article,
  }))

  const revisionData: AnalyticsTableRow[] = filteredRevisions.map((revision) => ({
    id: revision.id,
    date: revision.createdAt,
    dateLocal: formatDateWithTimezone(revision.createdAt),
    type: "Revision",
    status: revision.status,
    metric1: revision.articleId.substring(0, 8),
    metric2: revision.createdBy.substring(0, 8),
    metric3: `${revision.contentLength} chars`,
    details: revision,
  }))

  const allData = [...articleData, ...revisionData].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  const paginated = paginate(allData, page, pageSize)

  return {
    rows: paginated.items,
    metadata: {
      totalRows: paginated.totalItems,
      totalPages: paginated.totalPages,
      currentPage: paginated.currentPage,
      pageSize,
      filters: { startDate, endDate },
      dateRange: {
        start: startDate?.toISOString() || "",
        end: endDate?.toISOString() || "",
      },
      timezone: getTimezone(),
    },
  }
}

/**
 * Get Search Analytics
 */
export function getSearchAnalyticsTable(params: {
  startDate?: Date
  endDate?: Date
  page?: number
  pageSize?: number
}): AnalyticsData {
  const { startDate, endDate, page = 1, pageSize = 50 } = params

  const events = getAllEvents()
  const filtered = filterByDateRange(events, startDate, endDate)

  const allData: AnalyticsTableRow[] = filtered.map((event) => ({
    id: event.id,
    date: event.timestamp,
    dateLocal: formatDateWithTimezone(event.timestamp),
    type: event.eventType,
    metric1: event.query || "No query",
    metric2: event.resultCount?.toString() || "N/A",
    metric3: event.contentType || "all",
    details: event,
  }))

  const paginated = paginate(allData, page, pageSize)

  return {
    rows: paginated.items,
    metadata: {
      totalRows: paginated.totalItems,
      totalPages: paginated.totalPages,
      currentPage: paginated.currentPage,
      pageSize,
      filters: { startDate, endDate },
      dateRange: {
        start: startDate?.toISOString() || "",
        end: endDate?.toISOString() || "",
      },
      timezone: getTimezone(),
    },
  }
}

/**
 * Get Community Analytics
 */
export function getCommunityAnalytics(params: {
  startDate?: Date
  endDate?: Date
  page?: number
  pageSize?: number
}): AnalyticsData {
  const { startDate, endDate, page = 1, pageSize = 50 } = params

  const groups = getGroups()
  const filtered = filterByDateRange(groups, startDate, endDate)

  const allData: AnalyticsTableRow[] = filtered.map((group) => {
    const members = getGroupMembersByGroupId(group.id)
    const topics = getGroupTopicsByGroupId(group.id)
    
    return {
      id: group.id,
      date: group.createdAt,
      dateLocal: formatDateWithTimezone(group.createdAt),
      type: group.type,
      metric1: group.name,
      metric2: `${members.length} members`,
      metric3: `${topics.length} topics`,
      details: group,
    }
  })

  const paginated = paginate(allData, page, pageSize)

  return {
    rows: paginated.items,
    metadata: {
      totalRows: paginated.totalItems,
      totalPages: paginated.totalPages,
      currentPage: paginated.currentPage,
      pageSize,
      filters: { startDate, endDate },
      dateRange: {
        start: startDate?.toISOString() || "",
        end: endDate?.toISOString() || "",
      },
      timezone: getTimezone(),
    },
  }
}

/**
 * Export data to CSV
 */
export function exportToCSV(
  data: AnalyticsTableRow[],
  filename: string,
  headers: string[]
): void {
  const csvRows: string[] = []
  
  // Add headers
  csvRows.push(headers.join(","))
  
  // Add data rows
  data.forEach((row) => {
    const values = [
      row.dateLocal,
      row.type,
      row.status || "",
      row.metric1,
      row.metric2,
      row.metric3,
    ]
    csvRows.push(values.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
  })

  // Create blob and download
  const csvContent = csvRows.join("\n")
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")
  const url = URL.createObjectURL(blob)
  
  link.setAttribute("href", url)
  link.setAttribute("download", filename)
  link.style.visibility = "hidden"
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/**
 * Helper function to calculate edit age
 */
function calculateEditAge(createdAt: string): number {
  const now = new Date().getTime()
  const created = new Date(createdAt).getTime()
  return Math.floor((now - created) / (1000 * 60 * 60))
}

