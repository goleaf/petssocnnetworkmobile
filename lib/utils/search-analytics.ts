import type {
  SearchAnalyticsEvent,
  SearchAnalyticsEventType,
  SearchAnalyticsAggregation,
  SearchAnalyticsSummary,
  SearchContentType,
  SearchQueryFilters,
} from "@/lib/types"

const SCHEMA_VERSION = "1.0.0"
const STORAGE_KEY = "pet_social_search_analytics"

// Generate or retrieve an anonymized session ID
function getSessionId(): string {
  if (typeof window === "undefined") return "server-session"
  
  const storageKey = "search_analytics_session_id"
  let sessionId = localStorage.getItem(storageKey)
  
  if (!sessionId) {
    // Generate a simple anonymized session ID
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    localStorage.setItem(storageKey, sessionId)
  }
  
  return sessionId
}

// Hash/scrub sensitive query data
function normalizeQuery(query: string): string {
  return query
    .trim()
    .toLowerCase()
    .replace(/[^\w\s]/g, "") // Remove special characters
    .replace(/\s+/g, " ") // Normalize whitespace
}

// Hash sensitive data for PII protection
function hashData(data: string): string {
  // Simple hash function for demonstration
  // In production, use a proper cryptographic hash
  let hash = 0
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36)
}

// Count the number of filter categories applied
function countFilters(filters: SearchQueryFilters): number {
  let count = 0
  if (filters.species && filters.species.length > 0) count++
  if (filters.location && filters.location.length > 0) count++
  if (filters.breed && filters.breed.length > 0) count++
  if (filters.category && filters.category.length > 0) count++
  if (filters.gender && filters.gender.length > 0) count++
  if (filters.tags && filters.tags.length > 0) count++
  if (filters.types && filters.types.length > 0) count++
  if (filters.nearby) count++
  if (filters.ageMin !== undefined || filters.ageMax !== undefined) count++
  if (filters.dateFrom || filters.dateTo) count++
  if (filters.verified) count++
  return count
}

// Create a search analytics event
export function createSearchEvent(params: {
  eventType: SearchAnalyticsEventType
  query?: string
  filters?: SearchQueryFilters
  resultCount?: number
  contentType?: SearchContentType
  clickedResultType?: SearchContentType
  clickedResultId?: string
  isAuthenticated: boolean
  metadata?: Record<string, unknown>
}): SearchAnalyticsEvent {
  const sessionId = getSessionId()
  const normalizedQuery = params.query ? normalizeQuery(params.query) : undefined
  
  const event: SearchAnalyticsEvent = {
    id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
    eventType: params.eventType,
    schemaVersion: SCHEMA_VERSION,
    sessionId,
    timestamp: new Date().toISOString(),
    hasQuery: Boolean(params.query),
    hasFilters: Boolean(params.filters && countFilters(params.filters) > 0),
    filterCount: params.filters ? countFilters(params.filters) : 0,
    isAuthenticated: params.isAuthenticated,
    metadata: params.metadata,
  }
  
  // Add query information if provided
  if (params.query) {
    // Store normalized version for aggregation
    event.normalizedQuery = normalizedQuery
    // For privacy, optionally scrub or hash the original
    event.query = normalizedQuery
  }
  
  // Add filter information if provided
  if (params.filters) {
    event.filters = params.filters
  }
  
  // Add result information
  if (params.resultCount !== undefined) {
    event.resultCount = params.resultCount
    event.isZeroResult = params.resultCount === 0
  }
  
  // Add content type information
  if (params.contentType) {
    event.contentType = params.contentType
  }
  
  // Add click information for CTR tracking
  if (params.clickedResultType) {
    event.clickedResultType = params.clickedResultType
  }
  if (params.clickedResultId) {
    // Hash the result ID to protect privacy
    event.clickedResultId = hashData(params.clickedResultId)
  }
  
  // Classify user segment (anonymized)
  if (params.isAuthenticated) {
    event.userSegment = "authenticated"
  } else {
    event.userSegment = "anonymous"
  }
  
  return event
}

// Store an analytics event
function storeEvent(event: SearchAnalyticsEvent): void {
  if (typeof window === "undefined") return
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    const events: SearchAnalyticsEvent[] = stored ? JSON.parse(stored) : []
    
    // Add new event
    events.push(event)
    
    // Keep only last 10,000 events to manage storage
    const maxEvents = 10000
    if (events.length > maxEvents) {
      events.splice(0, events.length - maxEvents)
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events))
  } catch (error) {
    console.error("Failed to store search analytics event:", error)
  }
}

// Track a search query
export function trackSearchQuery(params: {
  query?: string
  filters?: SearchQueryFilters
  resultCount: number
  contentType?: SearchContentType
  isAuthenticated: boolean
}): void {
  const event = createSearchEvent({
    eventType: params.resultCount === 0 ? "zero_result" : "query",
    query: params.query,
    filters: params.filters,
    resultCount: params.resultCount,
    contentType: params.contentType,
    isAuthenticated: params.isAuthenticated,
  })
  
  storeEvent(event)
}

// Track a click on a search result (for CTR)
export function trackResultClick(params: {
  query?: string
  filters?: SearchQueryFilters
  clickedResultType: SearchContentType
  clickedResultId: string
  isAuthenticated: boolean
}): void {
  const event = createSearchEvent({
    eventType: "result_click",
    query: params.query,
    filters: params.filters,
    clickedResultType: params.clickedResultType,
    clickedResultId: params.clickedResultId,
    isAuthenticated: params.isAuthenticated,
  })
  
  storeEvent(event)
}

// Retrieve all stored events
function getAllEvents(): SearchAnalyticsEvent[] {
  if (typeof window === "undefined") return []
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    console.error("Failed to retrieve search analytics events:", error)
    return []
  }
}

// Calculate aggregations for a time period
export function getSearchAnalyticsAggregation(params: {
  period: "day" | "week" | "month"
  startDate?: string
  endDate?: string
}): SearchAnalyticsAggregation {
  const events = getAllEvents()
  const now = new Date()
  
  let startDate: Date
  let endDate: Date = now
  
  // Calculate period
  switch (params.period) {
    case "day":
      startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      break
    case "week":
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      break
    case "month":
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      break
  }
  
  if (params.startDate) {
    startDate = new Date(params.startDate)
  }
  if (params.endDate) {
    endDate = new Date(params.endDate)
  }
  
  // Filter events by date range
  const filteredEvents = events.filter(
    (event) =>
      new Date(event.timestamp) >= startDate && new Date(event.timestamp) <= endDate
  )
  
  // Separate event types
  const queryEvents = filteredEvents.filter(
    (e) => e.eventType === "query" || e.eventType === "zero_result"
  )
  const clickEvents = filteredEvents.filter((e) => e.eventType === "result_click")
  
  // Calculate query metrics
  const totalQueries = queryEvents.length
  const uniqueQueries = new Set(queryEvents.map((e) => e.normalizedQuery).filter(Boolean)).size
  
  const totalQueryLengths = queryEvents
    .filter((e) => e.normalizedQuery)
    .reduce((sum, e) => sum + e.normalizedQuery!.length, 0)
  const averageQueryLength =
    queryEvents.filter((e) => e.normalizedQuery).length > 0
      ? Math.round(totalQueryLengths / queryEvents.filter((e) => e.normalizedQuery).length)
      : undefined
  
  // Calculate zero result metrics
  const zeroResultEvents = queryEvents.filter((e) => e.isZeroResult)
  const zeroResultQueries = zeroResultEvents.length
  const zeroResultRate = totalQueries > 0 ? (zeroResultQueries / totalQueries) * 100 : 0
  
  // Get top zero result queries
  const zeroResultQueriesMap = new Map<string, number>()
  zeroResultEvents.forEach((event) => {
    if (event.normalizedQuery) {
      const count = zeroResultQueriesMap.get(event.normalizedQuery) || 0
      zeroResultQueriesMap.set(event.normalizedQuery, count + 1)
    }
  })
  const topZeroResultQueries = Array.from(zeroResultQueriesMap.entries())
    .map(([query, count]) => ({ query, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
  
  // Calculate CTR metrics
  const totalResultClicks = clickEvents.length
  const clickThroughRate = totalQueries > 0 ? (totalResultClicks / totalQueries) * 100 : 0
  
  const clicksByContentType: Record<SearchContentType, number> = {
    user: 0,
    pet: 0,
    blog: 0,
    wiki: 0,
    hashtag: 0,
    shelter: 0,
    group: 0,
    event: 0,
    all: 0,
  }
  clickEvents.forEach((event) => {
    if (event.clickedResultType) {
      clicksByContentType[event.clickedResultType] =
        (clicksByContentType[event.clickedResultType] || 0) + 1
    }
  })
  
  // Content type breakdown
  const queriesByContentType: Record<SearchContentType, number> = {
    user: 0,
    pet: 0,
    blog: 0,
    wiki: 0,
    hashtag: 0,
    shelter: 0,
    group: 0,
    event: 0,
    all: 0,
  }
  queryEvents.forEach((event) => {
    if (event.contentType) {
      queriesByContentType[event.contentType] =
        (queriesByContentType[event.contentType] || 0) + 1
    }
  })
  
  const topContentTypes = Array.from(Object.entries(queriesByContentType))
    .map(([type, count]) => ({ type: type as SearchContentType, queries: count }))
    .sort((a, b) => b.queries - a.queries)
    .slice(0, 5)
  
  // Filter usage
  const filterUsageCount = queryEvents.filter((e) => e.hasFilters).length
  const totalFilterCount = queryEvents.reduce((sum, e) => sum + e.filterCount, 0)
  const averageFiltersPerQuery = totalQueries > 0 ? totalFilterCount / totalQueries : 0
  
  // Most used filters
  const filterUsageMap = new Map<string, number>()
  queryEvents.forEach((event) => {
    if (event.filters) {
      if (event.filters.species && event.filters.species.length > 0) {
        filterUsageMap.set("species", (filterUsageMap.get("species") || 0) + 1)
      }
      if (event.filters.location && event.filters.location.length > 0) {
        filterUsageMap.set("location", (filterUsageMap.get("location") || 0) + 1)
      }
      if (event.filters.breed && event.filters.breed.length > 0) {
        filterUsageMap.set("breed", (filterUsageMap.get("breed") || 0) + 1)
      }
      if (event.filters.category && event.filters.category.length > 0) {
        filterUsageMap.set("category", (filterUsageMap.get("category") || 0) + 1)
      }
      if (event.filters.gender && event.filters.gender.length > 0) {
        filterUsageMap.set("gender", (filterUsageMap.get("gender") || 0) + 1)
      }
      if (event.filters.tags && event.filters.tags.length > 0) {
        filterUsageMap.set("tags", (filterUsageMap.get("tags") || 0) + 1)
      }
      if (event.filters.types && event.filters.types.length > 0) {
        filterUsageMap.set("types", (filterUsageMap.get("types") || 0) + 1)
      }
      if (event.filters.nearby) {
        filterUsageMap.set("nearby", (filterUsageMap.get("nearby") || 0) + 1)
      }
      if (event.filters.ageMin !== undefined || event.filters.ageMax !== undefined) {
        filterUsageMap.set("age", (filterUsageMap.get("age") || 0) + 1)
      }
      if (event.filters.dateFrom || event.filters.dateTo) {
        filterUsageMap.set("date", (filterUsageMap.get("date") || 0) + 1)
      }
      if (event.filters.verified) {
        filterUsageMap.set("verified", (filterUsageMap.get("verified") || 0) + 1)
      }
    }
  })
  
  const mostUsedFilters = Array.from(filterUsageMap.entries())
    .map(([filterType, count]) => ({ filterType, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
  
  // Daily breakdown
  const dailyBreakdown: SearchAnalyticsAggregation["dailyBreakdown"] = []
  const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000))
  
  for (let i = 0; i < days; i++) {
    const date = new Date(startDate)
    date.setDate(date.getDate() + i)
    const dateStart = new Date(date.setHours(0, 0, 0, 0))
    const dateEnd = new Date(date.setHours(23, 59, 59, 999))
    
    const dayEvents = filteredEvents.filter(
      (e) => new Date(e.timestamp) >= dateStart && new Date(e.timestamp) <= dateEnd
    )
    
    const dayQueries = dayEvents.filter(
      (e) => e.eventType === "query" || e.eventType === "zero_result"
    ).length
    const dayZeroResults = dayEvents.filter((e) => e.isZeroResult).length
    const dayClicks = dayEvents.filter((e) => e.eventType === "result_click").length
    const dayCTR = dayQueries > 0 ? (dayClicks / dayQueries) * 100 : 0
    
    dailyBreakdown.push({
      date: dateStart.toISOString().split("T")[0],
      queries: dayQueries,
      zeroResults: dayZeroResults,
      clicks: dayClicks,
      ctr: Math.round(dayCTR * 100) / 100,
    })
  }
  
  return {
    period: params.period,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    totalQueries,
    uniqueQueries,
    averageQueryLength,
    zeroResultQueries,
    zeroResultRate: Math.round(zeroResultRate * 100) / 100,
    topZeroResultQueries,
    totalResultClicks,
    clickThroughRate: Math.round(clickThroughRate * 100) / 100,
    clicksByContentType,
    queriesByContentType,
    topContentTypes,
    filterUsageCount,
    averageFiltersPerQuery: Math.round(averageFiltersPerQuery * 100) / 100,
    mostUsedFilters,
    dailyBreakdown,
  }
}

// Get a summary of search analytics
export function getSearchAnalyticsSummary(
  period: "day" | "week" | "month" = "week"
): SearchAnalyticsSummary {
  const aggregation = getSearchAnalyticsAggregation({ period })
  
  return {
    totalQueries: aggregation.totalQueries,
    totalZeroResultQueries: aggregation.zeroResultQueries,
    totalClicks: aggregation.totalResultClicks,
    overallCTR: aggregation.clickThroughRate,
    overallZeroResultRate: aggregation.zeroResultRate,
    period: aggregation.period,
    generatedAt: new Date().toISOString(),
  }
}

// Clear old analytics data (older than specified days)
export function clearOldAnalytics(daysToKeep: number = 90): void {
  if (typeof window === "undefined") return
  
  try {
    const events = getAllEvents()
    const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000)
    
    const filteredEvents = events.filter(
      (event) => new Date(event.timestamp) >= cutoffDate
    )
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredEvents))
  } catch (error) {
    console.error("Failed to clear old analytics:", error)
  }
}

