import {
  getModerationAnalytics,
  getWikiAnalytics,
  getSearchAnalyticsTable,
  getCommunityAnalytics,
  exportToCSV,
  paginate,
  filterByDateRange,
  formatDateWithTimezone,
  getTimezone,
} from "../analytics-data"
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
import { getAllEvents } from "../search-analytics"

// Mock the imports
jest.mock("@/lib/storage", () => ({
  getEditRequests: jest.fn(() => []),
  getArticleReports: jest.fn(() => []),
  getCOIFlags: jest.fn(() => []),
  getRollbackHistory: jest.fn(() => []),
  getBlogPosts: jest.fn(() => []),
  getWikiArticles: jest.fn(() => []),
  getWikiRevisions: jest.fn(() => []),
  getGroups: jest.fn(() => []),
  getGroupMembersByGroupId: jest.fn(() => []),
  getGroupTopicsByGroupId: jest.fn(() => []),
}))

jest.mock("../search-analytics", () => ({
  getAllEvents: jest.fn(() => []),
}))

describe("analytics-data utilities", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("paginate", () => {
    it("should paginate data correctly", () => {
      const data = Array.from({ length: 100 }, (_, i) => ({ id: i }))
      const result = paginate(data, 1, 10)

      expect(result.items).toHaveLength(10)
      expect(result.totalPages).toBe(10)
      expect(result.currentPage).toBe(1)
      expect(result.totalItems).toBe(100)
    })

    it("should handle last page correctly", () => {
      const data = Array.from({ length: 95 }, (_, i) => ({ id: i }))
      const result = paginate(data, 10, 10)

      expect(result.items).toHaveLength(5)
      expect(result.totalPages).toBe(10)
    })

    it("should handle empty data", () => {
      const result = paginate([], 1, 10)

      expect(result.items).toHaveLength(0)
      expect(result.totalPages).toBe(0)
    })
  })

  describe("filterByDateRange", () => {
    it("should filter by date range", () => {
      const startDate = new Date("2024-01-01")
      const endDate = new Date("2024-01-31")
      const data = [
        { createdAt: "2024-01-15", id: 1 },
        { createdAt: "2024-02-15", id: 2 },
        { createdAt: "2023-12-15", id: 3 },
      ]

      const result = filterByDateRange(data, startDate, endDate)

      expect(result).toHaveLength(1)
      expect(result[0].id).toBe(1)
    })

    it("should filter by start date only", () => {
      const startDate = new Date("2024-01-01")
      const data = [
        { createdAt: "2024-01-15", id: 1 },
        { createdAt: "2023-12-15", id: 2 },
      ]

      const result = filterByDateRange(data, startDate)

      expect(result).toHaveLength(1)
      expect(result[0].id).toBe(1)
    })

    it("should handle empty data", () => {
      const result = filterByDateRange([], new Date(), new Date())

      expect(result).toHaveLength(0)
    })
  })

  describe("formatDateWithTimezone", () => {
    it("should format date with timezone", () => {
      const result = formatDateWithTimezone("2024-01-15T10:00:00Z")
      expect(typeof result).toBe("string")
      expect(result.length).toBeGreaterThan(0)
    })
  })

  describe("getTimezone", () => {
    it("should return timezone string", () => {
      const result = getTimezone()
      expect(typeof result).toBe("string")
      expect(result.length).toBeGreaterThan(0)
    })
  })

  describe("getModerationAnalytics", () => {
    it("should return analytics data for moderation edits", () => {
      const result = getModerationAnalytics({
        page: 1,
        pageSize: 50,
        type: "edits",
      })

      expect(result).toHaveProperty("rows")
      expect(result).toHaveProperty("metadata")
      expect(result.metadata.totalRows).toBeDefined()
    })

    it("should return analytics data for moderation reports", () => {
      const result = getModerationAnalytics({
        page: 1,
        pageSize: 50,
        type: "reports",
      })

      expect(result).toHaveProperty("rows")
      expect(result).toHaveProperty("metadata")
    })
  })

  describe("getWikiAnalytics", () => {
    it("should return analytics data for wiki", () => {
      const result = getWikiAnalytics({
        page: 1,
        pageSize: 50,
      })

      expect(result).toHaveProperty("rows")
      expect(result).toHaveProperty("metadata")
    })
  })

  describe("getSearchAnalyticsTable", () => {
    it("should return analytics data for search", () => {
      const result = getSearchAnalyticsTable({
        page: 1,
        pageSize: 50,
      })

      expect(result).toHaveProperty("rows")
      expect(result).toHaveProperty("metadata")
    })
  })

  describe("getCommunityAnalytics", () => {
    it("should return analytics data for community", () => {
      const result = getCommunityAnalytics({
        page: 1,
        pageSize: 50,
      })

      expect(result).toHaveProperty("rows")
      expect(result).toHaveProperty("metadata")
    })
  })

  describe("exportToCSV", () => {
    beforeEach(() => {
      // Mock DOM methods
      global.Blob = jest.fn((content) => content) as unknown as typeof Blob
      global.URL.createObjectURL = jest.fn(() => "blob:mock-url")
      global.document.createElement = jest.fn(() => ({
        setAttribute: jest.fn(),
        click: jest.fn(),
        style: {},
      })) as unknown as typeof document.createElement
      global.document.body.appendChild = jest.fn()
      global.document.body.removeChild = jest.fn()
    })

    it("should export data to CSV", () => {
      const data = [
        {
          id: "1",
          date: "2024-01-15",
          dateLocal: "Jan 15, 2024",
          type: "test",
          metric1: "value1",
          metric2: "value2",
          metric3: "value3",
        },
      ]
      const headers = ["Date", "Type", "Metric1", "Metric2", "Metric3"]

      expect(() => {
        exportToCSV(data, "test.csv", headers)
      }).not.toThrow()
    })
  })
})

