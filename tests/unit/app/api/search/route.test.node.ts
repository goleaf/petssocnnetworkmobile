/**
 * @jest-environment node
 */

import { GET, POST } from "../route"
import { NextRequest } from "next/server"
import { db } from "@/lib/db"

// Mock Prisma client
jest.mock("@/lib/db", () => ({
  db: {
    $queryRawUnsafe: jest.fn(),
    synonym: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
    searchTelemetry: {
      create: jest.fn(),
    },
  },
}))

const mockDb = db as jest.Mocked<typeof db>

describe("/api/search (Node environment)", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("GET", () => {
    it("should return 400 for missing query", async () => {
      const request = new NextRequest("http://localhost/api/search")
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe("Invalid query parameters")
    })

    it("should perform FTS search with results", async () => {
      mockDb.synonym.findUnique = jest.fn().mockResolvedValue(null)
      mockDb.$queryRawUnsafe = jest.fn().mockResolvedValue([
        {
          id: "post-1",
          petId: "pet-1",
          authorId: "user-1",
          title: "German Shepherd Training Tips",
          content: "Here are some training tips for German Shepherds...",
          type: "blog_post",
          rank: 0.85,
          snippet: "Here are some training tips for German Shepherds...",
        },
      ])
      mockDb.searchTelemetry.create = jest.fn().mockResolvedValue({})

      const request = new NextRequest("http://localhost/api/search?q=training")
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.query).toBe("training")
      expect(data.results).toHaveLength(1)
      expect(data.results[0]).toMatchObject({
        id: "post-1",
        title: "German Shepherd Training Tips",
        type: "blog_post",
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

      const request = new NextRequest("http://localhost/api/search?q=gsd")
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

      const request = new NextRequest("http://localhost/api/search?q=xyzabc123")
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
  })

  describe("POST", () => {
    it("should create a new synonym", async () => {
      mockDb.synonym.upsert = jest.fn().mockResolvedValue({
        id: "syn-1",
        term: "lab",
        synonyms: ["labrador", "labrador retriever"],
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const request = new NextRequest("http://localhost/api/search", {
        method: "POST",
        body: JSON.stringify({
          term: "lab",
          synonyms: ["labrador", "labrador retriever"],
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.term).toBe("lab")
      expect(data.synonyms).toEqual(["labrador", "labrador retriever"])
    })
  })
})

