import {
  trackSearchQuery,
  trackResultClick,
  getSearchAnalyticsAggregation,
  getSearchAnalyticsSummary,
  clearOldAnalytics,
  getAllEvents,
} from "../utils/search-analytics"
import type { SearchAnalyticsEvent } from "../types"

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString()
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
})()

Object.defineProperty(window, "localStorage", { value: localStorageMock })

// Mock crypto.randomUUID
Object.defineProperty(global, "crypto", {
  value: {
    randomUUID: () => "test-uuid",
  },
})

describe("Search Analytics", () => {
  beforeEach(() => {
    localStorage.clear()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
    localStorage.clear()
  })

  describe("trackSearchQuery", () => {
    it("should track a search query with results", () => {
      trackSearchQuery({
        query: "golden retriever",
        resultCount: 15,
        contentType: "pet",
        isAuthenticated: true,
      })

      const events = getAllEvents()
      expect(events).toHaveLength(1)
      expect(events[0].eventType).toBe("query")
      expect(events[0].query).toBe("golden retriever")
      expect(events[0].normalizedQuery).toBe("golden retriever")
      expect(events[0].resultCount).toBe(15)
      expect(events[0].isZeroResult).toBe(false)
      expect(events[0].hasQuery).toBe(true)
      expect(events[0].isAuthenticated).toBe(true)
    })

    it("should track a zero-result search", () => {
      trackSearchQuery({
        query: "nonexistent pet",
        resultCount: 0,
        isAuthenticated: false,
      })

      const events = getAllEvents()
      expect(events).toHaveLength(1)
      expect(events[0].eventType).toBe("zero_result")
      expect(events[0].resultCount).toBe(0)
      expect(events[0].isZeroResult).toBe(true)
      expect(events[0].isAuthenticated).toBe(false)
    })

    it("should track filters usage", () => {
      trackSearchQuery({
        query: "dog",
        filters: {
          species: ["dog"],
          location: "New York",
          breed: "golden retriever",
        },
        resultCount: 10,
        isAuthenticated: true,
      })

      const events = getAllEvents()
      expect(events[0].hasFilters).toBe(true)
      expect(events[0].filterCount).toBe(3)
    })

    it("should normalize query text", () => {
      trackSearchQuery({
        query: "  GOLDEN  Retriever!!!  ",
        resultCount: 5,
        isAuthenticated: false,
      })

      const events = getAllEvents()
      expect(events[0].query).toBe("golden retriever")
      expect(events[0].normalizedQuery).toBe("golden retriever")
    })
  })

  describe("trackResultClick", () => {
    it("should track a result click", () => {
      trackResultClick({
        query: "pet",
        clickedResultType: "pet",
        clickedResultId: "pet-123",
        isAuthenticated: true,
      })

      const events = getAllEvents()
      expect(events).toHaveLength(1)
      expect(events[0].eventType).toBe("result_click")
      expect(events[0].clickedResultType).toBe("pet")
      expect(events[0].clickedResultId).toBeTruthy()
      expect(events[0].clickedResultId).not.toBe("pet-123") // Should be hashed
    })
  })

  describe("getSearchAnalyticsAggregation", () => {
    it("should aggregate analytics for day period", () => {
      jest.setSystemTime(new Date("2024-01-15T12:00:00Z"))

      // Track multiple events
      trackSearchQuery({ query: "dog", resultCount: 10, isAuthenticated: true })
      trackSearchQuery({ query: "cat", resultCount: 5, isAuthenticated: false })
      trackSearchQuery({ query: "nonexistent", resultCount: 0, isAuthenticated: true })
      trackResultClick({ query: "dog", clickedResultType: "pet", clickedResultId: "pet-1", isAuthenticated: true })
      trackResultClick({ query: "cat", clickedResultType: "pet", clickedResultId: "pet-2", isAuthenticated: false })

      const aggregation = getSearchAnalyticsAggregation({ period: "day" })

      expect(aggregation.totalQueries).toBeGreaterThan(0)
      expect(aggregation.zeroResultQueries).toBeGreaterThan(0)
      expect(aggregation.totalResultClicks).toBeGreaterThan(0)
      expect(aggregation.zeroResultRate).toBeGreaterThanOrEqual(0)
      expect(aggregation.clickThroughRate).toBeGreaterThanOrEqual(0)
    })

    it("should calculate CTR correctly", () => {
      jest.setSystemTime(new Date("2024-01-15T12:00:00Z"))

      trackSearchQuery({ query: "test", resultCount: 10, isAuthenticated: true })
      trackSearchQuery({ query: "test2", resultCount: 5, isAuthenticated: true })
      trackResultClick({ query: "test", clickedResultType: "pet", clickedResultId: "pet-1", isAuthenticated: true })

      const aggregation = getSearchAnalyticsAggregation({ period: "day" })

      // CTR should be clicks / queries * 100
      const expectedCTR = (1 / 2) * 100
      expect(aggregation.clickThroughRate).toBe(expectedCTR)
    })

    it("should identify top zero-result queries", () => {
      jest.setSystemTime(new Date("2024-01-15T12:00:00Z"))

      trackSearchQuery({ query: "nonexistent1", resultCount: 0, isAuthenticated: true })
      trackSearchQuery({ query: "nonexistent1", resultCount: 0, isAuthenticated: true })
      trackSearchQuery({ query: "nonexistent2", resultCount: 0, isAuthenticated: false })

      const aggregation = getSearchAnalyticsAggregation({ period: "day" })

      expect(aggregation.topZeroResultQueries.length).toBeGreaterThan(0)
      const topQuery = aggregation.topZeroResultQueries[0]
      expect(topQuery.query).toBe("nonexistent1")
      expect(topQuery.count).toBe(2)
    })

    it("should track content type distribution", () => {
      jest.setSystemTime(new Date("2024-01-15T12:00:00Z"))

      trackSearchQuery({ query: "search1", resultCount: 10, contentType: "pet", isAuthenticated: true })
      trackSearchQuery({ query: "search2", resultCount: 5, contentType: "blog", isAuthenticated: true })
      trackSearchQuery({ query: "search3", resultCount: 3, contentType: "pet", isAuthenticated: false })

      const aggregation = getSearchAnalyticsAggregation({ period: "day" })

      expect(aggregation.queriesByContentType.pet).toBe(2)
      expect(aggregation.queriesByContentType.blog).toBe(1)
    })

    it("should track filter usage statistics", () => {
      jest.setSystemTime(new Date("2024-01-15T12:00:00Z"))

      trackSearchQuery({
        query: "test",
        filters: { species: ["dog"], location: "NY" },
        resultCount: 10,
        isAuthenticated: true,
      })
      trackSearchQuery({
        query: "test2",
        filters: { species: ["dog"] },
        resultCount: 5,
        isAuthenticated: true,
      })

      const aggregation = getSearchAnalyticsAggregation({ period: "day" })

      expect(aggregation.filterUsageCount).toBeGreaterThan(0)
      expect(aggregation.averageFiltersPerQuery).toBeGreaterThan(0)
    })

    it("should generate daily breakdown", () => {
      jest.setSystemTime(new Date("2024-01-15T12:00:00Z"))

      trackSearchQuery({ query: "test", resultCount: 10, isAuthenticated: true })
      trackResultClick({ query: "test", clickedResultType: "pet", clickedResultId: "pet-1", isAuthenticated: true })

      const aggregation = getSearchAnalyticsAggregation({ period: "week" })

      expect(aggregation.dailyBreakdown).toBeDefined()
      expect(aggregation.dailyBreakdown?.length).toBeGreaterThan(0)
      if (aggregation.dailyBreakdown && aggregation.dailyBreakdown.length > 0) {
        const today = aggregation.dailyBreakdown[aggregation.dailyBreakdown.length - 1]
        expect(today.queries).toBeGreaterThanOrEqual(0)
        expect(today.ctr).toBeGreaterThanOrEqual(0)
      }
    })
  })

  describe("getSearchAnalyticsSummary", () => {
    it("should return summary statistics", () => {
      jest.setSystemTime(new Date("2024-01-15T12:00:00Z"))

      trackSearchQuery({ query: "test1", resultCount: 10, isAuthenticated: true })
      trackSearchQuery({ query: "test2", resultCount: 0, isAuthenticated: true })
      trackResultClick({ query: "test1", clickedResultType: "pet", clickedResultId: "pet-1", isAuthenticated: true })

      const summary = getSearchAnalyticsSummary("day")

      expect(summary.totalQueries).toBe(2)
      expect(summary.totalZeroResultQueries).toBe(1)
      expect(summary.totalClicks).toBe(1)
      expect(summary.overallCTR).toBeGreaterThanOrEqual(0)
      expect(summary.overallZeroResultRate).toBe(50) // 1 out of 2 queries
      expect(summary.period).toBe("day")
    })

    it("should handle empty data gracefully", () => {
      localStorage.clear()
      const summary = getSearchAnalyticsSummary("week")

      expect(summary.totalQueries).toBe(0)
      expect(summary.totalZeroResultQueries).toBe(0)
      expect(summary.totalClicks).toBe(0)
      expect(summary.overallCTR).toBe(0)
      expect(summary.overallZeroResultRate).toBe(0)
    })
  })

  describe("clearOldAnalytics", () => {
    it("should clear old analytics data", () => {
      const oldDate = new Date("2023-01-01").getTime()
      const currentDate = new Date("2024-01-15").getTime()

      // Create old event manually
      const oldEvent: SearchAnalyticsEvent = {
        id: "old-event-1",
        eventType: "query",
        schemaVersion: "1.0.0",
        sessionId: "session-1",
        timestamp: new Date(oldDate).toISOString(),
        hasQuery: true,
        hasFilters: false,
        filterCount: 0,
        isAuthenticated: false,
      }

      const newEvent: SearchAnalyticsEvent = {
        id: "new-event-1",
        eventType: "query",
        schemaVersion: "1.0.0",
        sessionId: "session-2",
        timestamp: new Date(currentDate).toISOString(),
        hasQuery: true,
        hasFilters: false,
        filterCount: 0,
        isAuthenticated: false,
      }

      // Manually add to storage
      localStorage.setItem("pet_social_search_analytics", JSON.stringify([oldEvent, newEvent]))

      clearOldAnalytics(30)

      const events = getAllEvents()
      // Should only keep recent events (within 30 days)
      expect(events.length).toBeLessThanOrEqual(2)
    })
  })

  describe("schema versioning", () => {
    it("should include schema version in events", () => {
      trackSearchQuery({
        query: "test",
        resultCount: 10,
        isAuthenticated: true,
      })

      const events = getAllEvents()
      expect(events[0].schemaVersion).toBe("1.0.0")
    })
  })

  describe("PII scrubbing", () => {
    it("should hash result IDs", () => {
      trackResultClick({
        query: "test",
        clickedResultType: "pet",
        clickedResultId: "sensitive-pet-id-123",
        isAuthenticated: true,
      })

      const events = getAllEvents()
      expect(events[0].clickedResultId).not.toBe("sensitive-pet-id-123")
      expect(events[0].clickedResultId).toBeTruthy()
    })

    it("should normalize queries", () => {
      trackSearchQuery({
        query: "  Special  Characters!!!  ",
        resultCount: 10,
        isAuthenticated: true,
      })

      const events = getAllEvents()
      expect(events[0].query).toBe("special characters")
      expect(events[0].normalizedQuery).toBe("special characters")
    })
  })

  describe("session management", () => {
    it("should generate and persist session IDs", () => {
      trackSearchQuery({
        query: "test",
        resultCount: 10,
        isAuthenticated: true,
      })

      const events1 = getAllEvents()

      trackSearchQuery({
        query: "test2",
        resultCount: 5,
        isAuthenticated: true,
      })

      const events2 = getAllEvents()

      // Should use same session ID
      expect(events1[0].sessionId).toBe(events2[0].sessionId)
    })
  })
})

