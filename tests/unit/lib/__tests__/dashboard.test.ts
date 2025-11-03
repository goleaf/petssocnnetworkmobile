/**
 * @jest-environment node
 */

import {
  getNewReports24h,
  getOpenModerationCases,
  getFlaggedWikiEdits,
  getStaleHealthPages,
  getZeroResultSearches,
  getQueueBacklog,
  getAllDashboardMetrics,
} from "../dashboard"
import { prisma } from "@/lib/prisma"
import { subDays, startOfDay } from "date-fns"

// Mock Prisma client
jest.mock("@/lib/prisma", () => ({
  prisma: {
    contentReport: {
      count: jest.fn(),
    },
    moderationQueue: {
      count: jest.fn(),
    },
    revision: {
      count: jest.fn(),
    },
    article: {
      count: jest.fn(),
    },
    searchTelemetry: {
      count: jest.fn(),
    },
  },
}))

const mockPrisma = prisma as jest.Mocked<typeof prisma>

describe("Dashboard Metrics", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("getNewReports24h", () => {
    it("should return count and 7-day trend for new reports", async () => {
      // Mock 24h count
      mockPrisma.contentReport.count.mockResolvedValueOnce(5)

      // Mock 7-day trend (one call per day)
      for (let i = 0; i < 7; i++) {
        mockPrisma.contentReport.count.mockResolvedValueOnce(i + 1)
      }

      const result = await getNewReports24h()

      expect(result.count).toBe(5)
      expect(result.trend).toHaveLength(7)
      expect(result.trend).toEqual([1, 2, 3, 4, 5, 6, 7])
      expect(mockPrisma.contentReport.count).toHaveBeenCalledTimes(8) // 1 for count + 7 for trend
    })

    it("should handle zero reports", async () => {
      mockPrisma.contentReport.count.mockResolvedValue(0)

      const result = await getNewReports24h()

      expect(result.count).toBe(0)
      expect(result.trend).toHaveLength(7)
      expect(result.trend.every((v) => v === 0)).toBe(true)
    })
  })

  describe("getOpenModerationCases", () => {
    it("should return count and trend for open moderation cases", async () => {
      mockPrisma.moderationQueue.count.mockResolvedValueOnce(10)

      // Mock 7-day trend
      for (let i = 0; i < 7; i++) {
        mockPrisma.moderationQueue.count.mockResolvedValueOnce(10 - i)
      }

      const result = await getOpenModerationCases()

      expect(result.count).toBe(10)
      expect(result.trend).toHaveLength(7)
      expect(result.trend).toEqual([10, 9, 8, 7, 6, 5, 4])
      expect(mockPrisma.moderationQueue.count).toHaveBeenCalledTimes(8)
    })

    it("should query only pending and in_review status", async () => {
      mockPrisma.moderationQueue.count.mockResolvedValue(0)

      await getOpenModerationCases()

      expect(mockPrisma.moderationQueue.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: {
              in: ["pending", "in_review"],
            },
          }),
        })
      )
    })
  })

  describe("getFlaggedWikiEdits", () => {
    it("should return count and trend for flagged wiki edits", async () => {
      mockPrisma.revision.count.mockResolvedValueOnce(3)

      // Mock 7-day trend
      for (let i = 0; i < 7; i++) {
        mockPrisma.revision.count.mockResolvedValueOnce(i)
      }

      const result = await getFlaggedWikiEdits()

      expect(result.count).toBe(3)
      expect(result.trend).toHaveLength(7)
      expect(result.trend).toEqual([0, 1, 2, 3, 4, 5, 6])
      expect(mockPrisma.revision.count).toHaveBeenCalledTimes(8)
    })

    it("should filter for unapproved revisions older than 1 day", async () => {
      mockPrisma.revision.count.mockResolvedValue(0)

      await getFlaggedWikiEdits()

      expect(mockPrisma.revision.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            approvedAt: null,
            createdAt: expect.any(Object),
            article: {
              type: "health",
            },
          }),
        })
      )
    })
  })

  describe("getStaleHealthPages", () => {
    it("should return count and trend for stale health pages", async () => {
      mockPrisma.article.count.mockResolvedValueOnce(15)

      // Mock 7-day trend
      for (let i = 0; i < 7; i++) {
        mockPrisma.article.count.mockResolvedValueOnce(2)
      }

      const result = await getStaleHealthPages()

      expect(result.count).toBe(15)
      expect(result.trend).toHaveLength(7)
      expect(result.trend).toEqual([2, 2, 2, 2, 2, 2, 2])
      expect(mockPrisma.article.count).toHaveBeenCalledTimes(8)
    })

    it("should filter for health pages not updated in 90 days", async () => {
      mockPrisma.article.count.mockResolvedValue(0)

      await getStaleHealthPages()

      expect(mockPrisma.article.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            type: "health",
            updatedAt: expect.any(Object),
            deletedAt: null,
          }),
        })
      )
    })
  })

  describe("getZeroResultSearches", () => {
    it("should return count and trend for zero-result searches", async () => {
      mockPrisma.searchTelemetry.count.mockResolvedValueOnce(20)

      // Mock 7-day trend
      for (let i = 0; i < 7; i++) {
        mockPrisma.searchTelemetry.count.mockResolvedValueOnce(10 + i)
      }

      const result = await getZeroResultSearches()

      expect(result.count).toBe(20)
      expect(result.trend).toHaveLength(7)
      expect(result.trend).toEqual([10, 11, 12, 13, 14, 15, 16])
      expect(mockPrisma.searchTelemetry.count).toHaveBeenCalledTimes(8)
    })

    it("should filter for searches with no results in last 24h", async () => {
      mockPrisma.searchTelemetry.count.mockResolvedValue(0)

      await getZeroResultSearches()

      expect(mockPrisma.searchTelemetry.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: expect.any(Object),
            hasResults: false,
          }),
        })
      )
    })
  })

  describe("getQueueBacklog", () => {
    it("should return count and trend for queue backlog", async () => {
      mockPrisma.moderationQueue.count.mockResolvedValueOnce(25)

      // Mock 7-day trend
      for (let i = 0; i < 7; i++) {
        mockPrisma.moderationQueue.count.mockResolvedValueOnce(20 + i)
      }

      const result = await getQueueBacklog()

      expect(result.count).toBe(25)
      expect(result.trend).toHaveLength(7)
      expect(result.trend).toEqual([20, 21, 22, 23, 24, 25, 26])
      expect(mockPrisma.moderationQueue.count).toHaveBeenCalledTimes(8)
    })

    it("should filter for pending status only", async () => {
      mockPrisma.moderationQueue.count.mockResolvedValue(0)

      await getQueueBacklog()

      expect(mockPrisma.moderationQueue.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: "pending",
          }),
        })
      )
    })
  })

  describe("getAllDashboardMetrics", () => {
    it("should return all metrics in parallel", async () => {
      // Mock all individual functions
      mockPrisma.contentReport.count.mockResolvedValue(5)
      mockPrisma.moderationQueue.count.mockResolvedValue(10)
      mockPrisma.revision.count.mockResolvedValue(3)
      mockPrisma.article.count.mockResolvedValue(15)
      mockPrisma.searchTelemetry.count.mockResolvedValue(20)

      const result = await getAllDashboardMetrics()

      expect(result).toHaveProperty("newReports24h")
      expect(result).toHaveProperty("openModerationCases")
      expect(result).toHaveProperty("flaggedWikiEdits")
      expect(result).toHaveProperty("staleHealthPages")
      expect(result).toHaveProperty("zeroResultSearches")
      expect(result).toHaveProperty("queueBacklog")

      expect(result.newReports24h.count).toBe(5)
      expect(result.openModerationCases.count).toBe(10)
      expect(result.flaggedWikiEdits.count).toBe(3)
      expect(result.staleHealthPages.count).toBe(15)
      expect(result.zeroResultSearches.count).toBe(20)
    })

    it("should handle errors gracefully", async () => {
      mockPrisma.contentReport.count.mockRejectedValueOnce(new Error("Database error"))

      await expect(getAllDashboardMetrics()).rejects.toThrow("Database error")
    })
  })
})

