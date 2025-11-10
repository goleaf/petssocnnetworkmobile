import { POST, GET } from "../watch/route"
import { NextRequest } from "next/server"
import { toggleWatch, getWatchEntryByTarget } from "@/lib/storage"

// Mock the storage module
jest.mock("@/lib/storage", () => ({
  toggleWatch: jest.fn(),
  isWatching: jest.fn(),
  getWatchEntryByTarget: jest.fn(),
}))

describe("/api/watch", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
  })

  describe("POST", () => {
    it("should toggle watch for a post", async () => {
      const mockWatchEntry = {
        id: "watch1",
        userId: "user1",
        targetId: "post1",
        targetType: "post" as const,
        watchEvents: ["update", "comment"],
        enabled: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      ;(toggleWatch as jest.Mock).mockReturnValue(mockWatchEntry)

      const request = new NextRequest("http://localhost/api/watch", {
        method: "POST",
        body: JSON.stringify({
          userId: "user1",
          targetId: "post1",
          targetType: "post",
          watchEvents: ["update", "comment"],
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.watching).toBe(true)
      expect(data.watchEntry).toEqual(mockWatchEntry)
      expect(toggleWatch).toHaveBeenCalledWith("user1", "post1", "post", ["update", "comment"])
    })

    it("should toggle watch for a wiki article", async () => {
      const mockWatchEntry = {
        id: "watch2",
        userId: "user1",
        targetId: "wiki1",
        targetType: "wiki" as const,
        watchEvents: ["update", "comment", "reaction"],
        enabled: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      ;(toggleWatch as jest.Mock).mockReturnValue(mockWatchEntry)

      const request = new NextRequest("http://localhost/api/watch", {
        method: "POST",
        body: JSON.stringify({
          userId: "user1",
          targetId: "wiki1",
          targetType: "wiki",
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(toggleWatch).toHaveBeenCalledWith(
        "user1",
        "wiki1",
        "wiki",
        ["update", "comment", "reaction"]
      )
    })

    it("should return 400 if required fields are missing", async () => {
      const request = new NextRequest("http://localhost/api/watch", {
        method: "POST",
        body: JSON.stringify({
          userId: "user1",
          // Missing targetId and targetType
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe("Missing required fields")
    })

    it("should return 400 if targetType is invalid", async () => {
      const request = new NextRequest("http://localhost/api/watch", {
        method: "POST",
        body: JSON.stringify({
          userId: "user1",
          targetId: "post1",
          targetType: "invalid",
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe("Invalid targetType. Must be 'post' or 'wiki'")
    })
  })

  describe("GET", () => {
    it("should return watch status for a post", async () => {
      const mockWatchEntry = {
        id: "watch1",
        userId: "user1",
        targetId: "post1",
        targetType: "post" as const,
        watchEvents: ["update", "comment"],
        enabled: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      const { isWatching, getWatchEntryByTarget } = await import("@/lib/storage")
      ;(isWatching as jest.Mock).mockReturnValue(true)
      ;(getWatchEntryByTarget as jest.Mock).mockReturnValue(mockWatchEntry)

      const request = new NextRequest("http://localhost/api/watch?userId=user1&targetId=post1&targetType=post")

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.watching).toBe(true)
      expect(data.watchEntry).toEqual(mockWatchEntry)
    })

    it("should return 400 if query parameters are missing", async () => {
      const request = new NextRequest("http://localhost/api/watch?userId=user1")

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe("Missing required query parameters")
    })

    it("should return 400 if targetType is invalid", async () => {
      const request = new NextRequest("http://localhost/api/watch?userId=user1&targetId=post1&targetType=invalid")

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe("Invalid targetType. Must be 'post' or 'wiki'")
    })
  })
})

