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
  },
}))

const mockDb = db as jest.Mocked<typeof db>

describe("/api/articles/autocomplete (Node environment)", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("GET", () => {
    it("should return 400 for missing query", async () => {
      const request = new NextRequest("http://localhost/api/articles/autocomplete")
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe("Invalid query parameters")
    })

    it("should return autocomplete suggestions", async () => {
      mockDb.synonym.findUnique = jest.fn().mockResolvedValue(null)
      mockDb.$queryRawUnsafe = jest.fn().mockResolvedValue([
        {
          id: "article-1",
          title: "German Shepherd Training",
          slug: "german-shepherd-training",
          type: "breed",
        },
        {
          id: "article-2",
          title: "German Shepherd Health",
          slug: "german-shepherd-health",
          type: "health",
        },
      ])

      const request = new NextRequest("http://localhost/api/articles/autocomplete?q=german")
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.query).toBe("german")
      expect(data.suggestions).toHaveLength(2)
      expect(data.suggestions[0]).toMatchObject({
        id: "article-1",
        title: "German Shepherd Training",
        slug: "german-shepherd-training",
      })
    })

    it("should respect limit parameter", async () => {
      mockDb.synonym.findUnique = jest.fn().mockResolvedValue(null)
      mockDb.$queryRawUnsafe = jest.fn().mockResolvedValue([
        {
          id: "article-1",
          title: "Article 1",
          slug: "article-1",
          type: "care",
        },
        {
          id: "article-2",
          title: "Article 2",
          slug: "article-2",
          type: "care",
        },
      ])

      const request = new NextRequest("http://localhost/api/articles/autocomplete?q=article&limit=5")
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.suggestions.length).toBeLessThanOrEqual(5)
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

      const request = new NextRequest("http://localhost/api/articles/autocomplete?q=gsd")
      const response = await GET(request)

      expect(response.status).toBe(200)
      // Verify synonym lookup was called
      expect(mockDb.synonym.findUnique).toHaveBeenCalledWith({
        where: { term: "gsd" },
      })
    })

    it("should handle empty results gracefully", async () => {
      mockDb.synonym.findUnique = jest.fn().mockResolvedValue(null)
      mockDb.$queryRawUnsafe = jest.fn().mockResolvedValue([])

      const request = new NextRequest("http://localhost/api/articles/autocomplete?q=xyzabc123")
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.suggestions).toHaveLength(0)
    })

    it("should validate query length", async () => {
      const longQuery = "a".repeat(101)
      const request = new NextRequest(`http://localhost/api/articles/autocomplete?q=${longQuery}`)
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe("Invalid query parameters")
    })

    it("should validate limit bounds", async () => {
      mockDb.synonym.findUnique = jest.fn().mockResolvedValue(null)
      // Test limit too high
      const request = new NextRequest("http://localhost/api/articles/autocomplete?q=test&limit=50")
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe("Invalid query parameters")
    })

    it("should return suggestions sorted by relevance", async () => {
      mockDb.synonym.findUnique = jest.fn().mockResolvedValue(null)
      mockDb.$queryRawUnsafe = jest.fn().mockResolvedValue([
        {
          id: "article-1",
          title: "Training Tips",
          slug: "training-tips",
          type: "training",
        },
        {
          id: "article-2",
          title: "Advanced Training",
          slug: "advanced-training",
          type: "training",
        },
      ])

      const request = new NextRequest("http://localhost/api/articles/autocomplete?q=Training")
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      // First result should be more relevant (case match, shorter)
      expect(data.suggestions[0].id).toBe("article-1")
    })

    it("should handle special characters in query", async () => {
      mockDb.synonym.findUnique = jest.fn().mockResolvedValue(null)
      mockDb.$queryRawUnsafe = jest.fn().mockResolvedValue([])

      const request = new NextRequest("http://localhost/api/articles/autocomplete?q=health%20%26%20care")
      const response = await GET(request)

      expect(response.status).toBe(200)
    })
  })
})

