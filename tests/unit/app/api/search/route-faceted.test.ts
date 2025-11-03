/**
 * @jest-environment node
 */

import { GET } from "../route"
import { NextRequest } from "next/server"
import { db } from "@/lib/db"

// Mock the database
jest.mock("@/lib/db", () => ({
  db: {
    synonym: {
      findUnique: jest.fn(),
    },
    blogPostTag: {
      groupBy: jest.fn(),
    },
    searchTelemetry: {
      create: jest.fn(),
    },
    $queryRawUnsafe: jest.fn(),
  },
}))

const mockDb = db as jest.Mocked<typeof db>

describe("Faceted Search API", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("GET /api/search with faceted filters", () => {
    it("should search without filters", async () => {
      const mockResults = [
        {
          id: "1",
          petId: "pet1",
          authorId: "author1",
          title: "Test Post 1",
          content: "Test content",
          type: "blog_post",
          tags: ["tag1", "tag2"],
          hashtags: ["hashtag1"],
          rank: 0.5,
          snippet: "Test snippet",
        },
      ]

      mockDb.$queryRawUnsafe = jest.fn().mockResolvedValue(mockResults)
      mockDb.synonym.findUnique = jest.fn().mockResolvedValue(null)
      mockDb.searchTelemetry.create = jest.fn().mockResolvedValue({})

      const request = new NextRequest("http://localhost:3000/api/search?q=test")
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.results).toHaveLength(1)
      expect(data.results[0]).toMatchObject({
        id: "1",
        title: "Test Post 1",
        type: "blog_post",
        tags: ["tag1", "tag2"],
        hashtags: ["hashtag1"],
      })
    })

    it("should search with species filter", async () => {
      const mockResults = [
        {
          id: "2",
          petId: "pet2",
          authorId: "author2",
          title: "Dog Post",
          content: "Dog content",
          type: "blog_post",
          tags: [],
          hashtags: [],
          rank: 0.6,
          snippet: "Dog snippet",
        },
      ]

      mockDb.$queryRawUnsafe = jest.fn().mockResolvedValue(mockResults)
      mockDb.synonym.findUnique = jest.fn().mockResolvedValue(null)
      mockDb.searchTelemetry.create = jest.fn().mockResolvedValue({})

      const request = new NextRequest(
        "http://localhost:3000/api/search?q=dog&species=dog"
      )
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.results).toHaveLength(1)
      expect(mockDb.$queryRawUnsafe).toHaveBeenCalled()
      
      // Check that the SQL query includes species filter
      const sqlCall = (mockDb.$queryRawUnsafe as jest.Mock).mock.calls[0][0]
      expect(sqlCall).toContain("pets")
    })

    it("should search with tags filter", async () => {
      const mockResults = [
        {
          id: "3",
          petId: "pet3",
          authorId: "author3",
          title: "Tagged Post",
          content: "Tagged content",
          type: "blog_post",
          tags: ["training"],
          hashtags: [],
          rank: 0.7,
          snippet: "Tagged snippet",
        },
      ]

      mockDb.$queryRawUnsafe = jest.fn().mockResolvedValue(mockResults)
      mockDb.synonym.findUnique = jest.fn().mockResolvedValue(null)
      mockDb.searchTelemetry.create = jest.fn().mockResolvedValue({})

      const request = new NextRequest(
        "http://localhost:3000/api/search?q=training&tags=training"
      )
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.results).toHaveLength(1)
      expect(data.results[0].title).toBe("Tagged Post")
    })

    it("should search with multiple tags filter", async () => {
      const mockResults = []

      mockDb.$queryRawUnsafe = jest.fn().mockResolvedValue(mockResults)
      mockDb.synonym.findUnique = jest.fn().mockResolvedValue(null)
      mockDb.searchTelemetry.create = jest.fn().mockResolvedValue({})
      mockDb.blogPostTag.groupBy = jest.fn().mockResolvedValue([
        { tag: "training" },
        { tag: "health" },
        { tag: "nutrition" },
      ])

      const request = new NextRequest(
        "http://localhost:3000/api/search?q=test&tags=training,health"
      )
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.results).toHaveLength(0)
    })

    it("should search with type filter", async () => {
      const mockResults = [
        {
          id: "4",
          petId: "pet4",
          authorId: "author4",
          title: "Story Post",
          content: "Story content",
          type: "story",
          tags: [],
          hashtags: [],
          rank: 0.8,
          snippet: "Story snippet",
        },
      ]

      mockDb.$queryRawUnsafe = jest.fn().mockResolvedValue(mockResults)
      mockDb.synonym.findUnique = jest.fn().mockResolvedValue(null)
      mockDb.searchTelemetry.create = jest.fn().mockResolvedValue({})

      const request = new NextRequest(
        "http://localhost:3000/api/search?q=story&type=story"
      )
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.results).toHaveLength(1)
      expect(data.results[0].type).toBe("story")
    })

    it("should search with combined filters", async () => {
      const mockResults = [
        {
          id: "5",
          petId: "pet5",
          authorId: "author5",
          title: "Combined Filter Post",
          content: "Combined content",
          type: "blog_post",
          tags: ["training"],
          hashtags: ["puppy"],
          rank: 0.9,
          snippet: "Combined snippet",
        },
      ]

      mockDb.$queryRawUnsafe = jest.fn().mockResolvedValue(mockResults)
      mockDb.synonym.findUnique = jest.fn().mockResolvedValue(null)
      mockDb.searchTelemetry.create = jest.fn().mockResolvedValue({})

      const request = new NextRequest(
        "http://localhost:3000/api/search?q=dog&species=dog&tags=training&type=blog_post"
      )
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.results).toHaveLength(1)
      expect(mockDb.$queryRawUnsafe).toHaveBeenCalled()
    })

    it("should return suggestions when no results", async () => {
      const mockResults = []

      mockDb.$queryRawUnsafe = jest.fn().mockResolvedValue(mockResults)
      mockDb.synonym.findUnique = jest.fn().mockResolvedValue(null)
      mockDb.searchTelemetry.create = jest.fn().mockResolvedValue({})
      mockDb.blogPostTag.groupBy = jest.fn().mockResolvedValue([
        { tag: "dog-training" },
        { tag: "puppy-care" },
        { tag: "dog-health" },
        { tag: "training" },
      ])

      const request = new NextRequest(
        "http://localhost:3000/api/search?q=dog"
      )
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.results).toHaveLength(0)
      expect(data.suggestions).toBeDefined()
      expect(data.suggestions.message).toContain("No results found")
      expect(data.suggestions.tags.length).toBeGreaterThan(0)
      // Should match tags containing "dog"
      expect(data.suggestions.tags).toContain("dog-training")
      expect(data.suggestions.tags).toContain("dog-health")
    })

    it("should expand query with synonyms", async () => {
      const mockResults = [
        {
          id: "6",
          petId: "pet6",
          authorId: "author6",
          title: "Synonym Post",
          content: "Synonym content",
          type: "blog_post",
          tags: [],
          hashtags: [],
          rank: 0.5,
          snippet: "Synonym snippet",
        },
      ]

      mockDb.$queryRawUnsafe = jest.fn().mockResolvedValue(mockResults)
      mockDb.synonym.findUnique = jest.fn().mockResolvedValue({
        id: "1",
        term: "canine",
        synonyms: ["dog", "puppy"],
      })
      mockDb.searchTelemetry.create = jest.fn().mockResolvedValue({})

      const request = new NextRequest(
        "http://localhost:3000/api/search?q=canine"
      )
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(mockDb.synonym.findUnique).toHaveBeenCalledWith({
        where: { term: "canine" },
      })
    })

    it("should validate query parameters", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/search?q="
      )
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBeDefined()
    })

    it("should validate limit parameter", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/search?q=test&limit=200"
      )
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBeDefined()
    })

    it("should handle database errors gracefully", async () => {
      mockDb.$queryRawUnsafe = jest.fn().mockRejectedValue(
        new Error("Database error")
      )

      const request = new NextRequest(
        "http://localhost:3000/api/search?q=test"
      )
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe("Internal server error")
    })
  })
})

