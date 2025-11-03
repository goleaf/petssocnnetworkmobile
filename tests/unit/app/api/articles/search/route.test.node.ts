/**
 * @jest-environment node
 */

import { GET } from "../route"
import { NextRequest } from "next/server"
import { db } from "@/lib/db"

// Mock Prisma client
jest.mock("@/lib/db", () => ({
  db: {
    $queryRawUnsafe: jest.fn(),
    synonym: {
      findUnique: jest.fn(),
    },
    searchTelemetry: {
      create: jest.fn(),
    },
  },
}))

const mockDb = db as jest.Mocked<typeof db>

describe("/api/articles/search (Node environment)", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("GET", () => {
    it("should return 400 for missing query", async () => {
      const request = new NextRequest("http://localhost/api/articles/search")
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe("Invalid query parameters")
    })

    it("should perform FTS search with results", async () => {
      mockDb.synonym.findUnique = jest.fn().mockResolvedValue(null)
      mockDb.$queryRawUnsafe = jest.fn().mockResolvedValue([
        {
          id: "article-1",
          slug: "german-shepherd-guide",
          title: "German Shepherd Training Guide",
          type: "breed",
          status: "approved",
          createdById: "user-1",
          createdAt: new Date(),
          updatedAt: new Date(),
          rank: 0.85,
        },
      ])
      mockDb.searchTelemetry.create = jest.fn().mockResolvedValue({})

      const request = new NextRequest("http://localhost/api/articles/search?q=training")
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.query).toBe("training")
      expect(data.results).toHaveLength(1)
      expect(data.results[0]).toMatchObject({
        id: "article-1",
        title: "German Shepherd Training Guide",
        slug: "german-shepherd-guide",
        type: "breed",
      })
      expect(mockDb.searchTelemetry.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          query: "training",
          resultCount: 1,
          hasResults: true,
        }),
      })
    })

    it("should expand synonyms in query", async () => {
      mockDb.synonym.findUnique = jest.fn().mockResolvedValue({
        id: "syn-1",
        term: "gsd",
        synonyms: ["german shepherd", "german shepherd dog"],
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      mockDb.$queryRawUnsafe = jest.fn().mockResolvedValue([])
      mockDb.searchTelemetry.create = jest.fn().mockResolvedValue({})

      const request = new NextRequest("http://localhost/api/articles/search?q=gsd")
      const response = await GET(request)

      expect(response.status).toBe(200)
      // Verify synonym lookup was called
      expect(mockDb.synonym.findUnique).toHaveBeenCalledWith({
        where: { term: "gsd" },
      })
    })

    it("should log telemetry for no results", async () => {
      mockDb.synonym.findUnique = jest.fn().mockResolvedValue(null)
      mockDb.$queryRawUnsafe = jest.fn().mockResolvedValue([])
      mockDb.searchTelemetry.create = jest.fn().mockResolvedValue({})

      const request = new NextRequest("http://localhost/api/articles/search?q=xyzabc123")
      const response = await GET(request)

      expect(response.status).toBe(200)
      expect(mockDb.searchTelemetry.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          query: "xyzabc123",
          resultCount: 0,
          hasResults: false,
        }),
      })
    })

    it("should handle pagination correctly", async () => {
      mockDb.synonym.findUnique = jest.fn().mockResolvedValue(null)
      mockDb.$queryRawUnsafe = jest.fn().mockResolvedValue([
        {
          id: "article-2",
          slug: "article-two",
          title: "Article Two",
          type: "care",
          status: "approved",
          createdById: "user-1",
          createdAt: new Date(),
          updatedAt: new Date(),
          rank: 0.5,
        },
      ])
      mockDb.searchTelemetry.create = jest.fn().mockResolvedValue({})

      const request = new NextRequest("http://localhost/api/articles/search?q=article&limit=10&offset=5")
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.pagination).toEqual({
        total: 1,
        limit: 10,
        offset: 5,
      })
    })

    it("should validate query length", async () => {
      const longQuery = "a".repeat(201)
      const request = new NextRequest(`http://localhost/api/articles/search?q=${longQuery}`)
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe("Invalid query parameters")
    })

    it("should validate limit bounds", async () => {
      // Test limit too high
      mockDb.synonym.findUnique = jest.fn().mockResolvedValue(null)
      const request = new NextRequest("http://localhost/api/articles/search?q=test&limit=150")
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe("Invalid query parameters")
    })

    it("should return relevance scores", async () => {
      mockDb.synonym.findUnique = jest.fn().mockResolvedValue(null)
      mockDb.$queryRawUnsafe = jest.fn().mockResolvedValue([
        {
          id: "article-1",
          slug: "high-relevance",
          title: "Exact Match Article",
          type: "health",
          status: "approved",
          createdById: "user-1",
          createdAt: new Date(),
          updatedAt: new Date(),
          rank: 0.95,
        },
        {
          id: "article-2",
          slug: "lower-relevance",
          title: "Partial Match Article",
          type: "health",
          status: "approved",
          createdById: "user-1",
          createdAt: new Date(),
          updatedAt: new Date(),
          rank: 0.65,
        },
      ])
      mockDb.searchTelemetry.create = jest.fn().mockResolvedValue({})

      const request = new NextRequest("http://localhost/api/articles/search?q=exact")
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.results[0].relevance).toBeGreaterThan(data.results[1].relevance)
    })
  })
})

