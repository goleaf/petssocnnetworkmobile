import { GET } from "../get-follow-suggestions/route"
import { NextRequest } from "next/server"
import { getUsers, getGroups, getAllGroupMembersPublic, getComments, getBlogPosts } from "@/lib/storage"

// Mock storage functions
jest.mock("@/lib/storage", () => ({
  getUsers: jest.fn(),
  getGroups: jest.fn(),
  getAllGroupMembersPublic: jest.fn(),
  getComments: jest.fn(),
  getBlogPosts: jest.fn(),
}))

describe("GET /api/social/get-follow-suggestions", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("should return 400 if userId is missing", async () => {
    const request = new NextRequest("http://localhost/api/social/get-follow-suggestions")
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe("userId is required")
  })

  it("should return 404 if user not found", async () => {
    ;(getUsers as jest.Mock).mockReturnValue([])

    const request = new NextRequest(
      "http://localhost/api/social/get-follow-suggestions?userId=invalid-id",
    )
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe("User not found")
  })

  it("should return follow suggestions for valid user", async () => {
    const mockUser = {
      id: "user1",
      email: "user1@test.com",
      username: "user1",
      fullName: "User One",
      joinedAt: new Date().toISOString(),
      followers: [],
      following: [],
      blockedUsers: [],
      mutedUsers: [],
    }

    const mockCandidate = {
      id: "user2",
      email: "user2@test.com",
      username: "user2",
      fullName: "User Two",
      joinedAt: new Date().toISOString(),
      followers: ["user1"],
      following: [],
      blockedUsers: [],
      mutedUsers: [],
    }

    ;(getUsers as jest.Mock).mockReturnValue([mockUser, mockCandidate])
    ;(getGroups as jest.Mock).mockReturnValue([])
    ;(getAllGroupMembersPublic as jest.Mock).mockReturnValue([])
    ;(getComments as jest.Mock).mockReturnValue([])
    ;(getBlogPosts as jest.Mock).mockReturnValue([])

    const request = new NextRequest(
      "http://localhost/api/social/get-follow-suggestions?userId=user1",
    )
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.suggestions).toBeDefined()
    expect(Array.isArray(data.suggestions)).toBe(true)
  })

  it("should exclude blocked and muted users from suggestions", async () => {
    const mockUser = {
      id: "user1",
      email: "user1@test.com",
      username: "user1",
      fullName: "User One",
      joinedAt: new Date().toISOString(),
      followers: [],
      following: [],
      blockedUsers: ["user2"],
      mutedUsers: [],
    }

    const mockCandidate = {
      id: "user2",
      email: "user2@test.com",
      username: "user2",
      fullName: "User Two",
      joinedAt: new Date().toISOString(),
      followers: [],
      following: [],
      blockedUsers: [],
      mutedUsers: [],
    }

    ;(getUsers as jest.Mock).mockReturnValue([mockUser, mockCandidate])
    ;(getGroups as jest.Mock).mockReturnValue([])
    ;(getAllGroupMembersPublic as jest.Mock).mockReturnValue([])
    ;(getComments as jest.Mock).mockReturnValue([])
    ;(getBlogPosts as jest.Mock).mockReturnValue([])

    const request = new NextRequest(
      "http://localhost/api/social/get-follow-suggestions?userId=user1",
    )
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    // Should not include blocked user2
    expect(data.suggestions.find((s: any) => s.user.id === "user2")).toBeUndefined()
  })
})

