import { describe, it, expect, beforeEach, jest } from "@jest/globals"
import { NextRequest } from "next/server"
import { GET } from "@/app/api/admin/users/route"
import { getCurrentUser, isAdmin } from "@/lib/auth-server"
import { getServerUsers } from "@/lib/storage-server"
import type { User } from "@/lib/types"

jest.mock("@/lib/auth-server")
jest.mock("@/lib/storage-server")

const mockGetCurrentUser = getCurrentUser as jest.MockedFunction<
  typeof getCurrentUser
>
const mockIsAdmin = isAdmin as jest.MockedFunction<typeof isAdmin>
const mockGetServerUsers = getServerUsers as jest.MockedFunction<
  typeof getServerUsers
>

describe("Admin Users List API - Permission Checks", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("should return 403 if user is not authenticated", async () => {
    mockGetCurrentUser.mockResolvedValue(null)
    mockIsAdmin.mockResolvedValue(false)

    const request = new NextRequest("http://localhost/api/admin/users")
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.error).toContain("Unauthorized")
  })

  it("should return 403 if user is not admin", async () => {
    const mockUser: User = {
      id: "user-1",
      email: "user@example.com",
      username: "user1",
      fullName: "User One",
      role: "user",
      joinedAt: new Date().toISOString(),
      followers: [],
      following: [],
    }

    mockGetCurrentUser.mockResolvedValue(mockUser)
    mockIsAdmin.mockResolvedValue(false)

    const request = new NextRequest("http://localhost/api/admin/users")
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.error).toContain("Unauthorized")
  })

  it("should return paginated users list if admin", async () => {
    const mockAdmin: User = {
      id: "admin-1",
      email: "admin@example.com",
      username: "admin1",
      fullName: "Admin One",
      role: "admin",
      joinedAt: new Date().toISOString(),
      followers: [],
      following: [],
    }

    const mockUsers: User[] = [
      {
        id: "user-1",
        email: "user1@example.com",
        username: "user1",
        handle: "user1",
        fullName: "User One",
        role: "user",
        reputation: 100,
        strikes: 0,
        status: "active",
        createdAt: new Date().toISOString(),
        joinedAt: new Date().toISOString(),
        followers: [],
        following: [],
      },
      {
        id: "user-2",
        email: "user2@example.com",
        username: "user2",
        handle: "user2",
        fullName: "User Two",
        role: "moderator",
        roles: ["user", "moderator"],
        reputation: 250,
        strikes: 1,
        status: "active",
        createdAt: new Date().toISOString(),
        joinedAt: new Date().toISOString(),
        followers: [],
        following: [],
      },
    ]

    mockGetCurrentUser.mockResolvedValue(mockAdmin)
    mockIsAdmin.mockResolvedValue(true)
    mockGetServerUsers.mockReturnValue(mockUsers)

    const request = new NextRequest("http://localhost/api/admin/users")
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.users).toHaveLength(2)
    expect(data.pagination).toMatchObject({
      page: 1,
      limit: 20,
      total: 2,
      totalPages: 1,
    })
  })

  it("should filter users by role", async () => {
    const mockAdmin: User = {
      id: "admin-1",
      email: "admin@example.com",
      username: "admin1",
      fullName: "Admin One",
      role: "admin",
      joinedAt: new Date().toISOString(),
      followers: [],
      following: [],
    }

    const mockUsers: User[] = [
      {
        id: "user-1",
        email: "user1@example.com",
        username: "user1",
        fullName: "User One",
        role: "user",
        joinedAt: new Date().toISOString(),
        followers: [],
        following: [],
      },
      {
        id: "mod-1",
        email: "mod@example.com",
        username: "mod1",
        fullName: "Mod One",
        role: "moderator",
        roles: ["moderator"],
        joinedAt: new Date().toISOString(),
        followers: [],
        following: [],
      },
    ]

    mockGetCurrentUser.mockResolvedValue(mockAdmin)
    mockIsAdmin.mockResolvedValue(true)
    mockGetServerUsers.mockReturnValue(mockUsers)

    const request = new NextRequest(
      "http://localhost/api/admin/users?role=moderator"
    )
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.users).toHaveLength(1)
    expect(data.users[0].roles).toContain("moderator")
  })

  it("should filter users by status", async () => {
    const mockAdmin: User = {
      id: "admin-1",
      email: "admin@example.com",
      username: "admin1",
      fullName: "Admin One",
      role: "admin",
      joinedAt: new Date().toISOString(),
      followers: [],
      following: [],
    }

    const mockUsers: User[] = [
      {
        id: "user-1",
        email: "user1@example.com",
        username: "user1",
        fullName: "User One",
        status: "active",
        joinedAt: new Date().toISOString(),
        followers: [],
        following: [],
      },
      {
        id: "user-2",
        email: "user2@example.com",
        username: "user2",
        fullName: "User Two",
        status: "suspended",
        joinedAt: new Date().toISOString(),
        followers: [],
        following: [],
      },
    ]

    mockGetCurrentUser.mockResolvedValue(mockAdmin)
    mockIsAdmin.mockResolvedValue(true)
    mockGetServerUsers.mockReturnValue(mockUsers)

    const request = new NextRequest(
      "http://localhost/api/admin/users?status=suspended"
    )
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.users).toHaveLength(1)
    expect(data.users[0].status).toBe("suspended")
  })

  it("should search users by handle, email, or name", async () => {
    const mockAdmin: User = {
      id: "admin-1",
      email: "admin@example.com",
      username: "admin1",
      fullName: "Admin One",
      role: "admin",
      joinedAt: new Date().toISOString(),
      followers: [],
      following: [],
    }

    const mockUsers: User[] = [
      {
        id: "user-1",
        email: "john@example.com",
        username: "john_doe",
        handle: "john",
        fullName: "John Doe",
        joinedAt: new Date().toISOString(),
        followers: [],
        following: [],
      },
      {
        id: "user-2",
        email: "jane@example.com",
        username: "jane_smith",
        handle: "jane",
        fullName: "Jane Smith",
        joinedAt: new Date().toISOString(),
        followers: [],
        following: [],
      },
    ]

    mockGetCurrentUser.mockResolvedValue(mockAdmin)
    mockIsAdmin.mockResolvedValue(true)
    mockGetServerUsers.mockReturnValue(mockUsers)

    const request = new NextRequest(
      "http://localhost/api/admin/users?search=john"
    )
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.users.length).toBeGreaterThanOrEqual(1)
    expect(
      data.users.some(
        (u: UserRow) =>
          u.handle?.toLowerCase().includes("john") ||
          u.email.toLowerCase().includes("john") ||
          u.handle?.toLowerCase().includes("john")
      )
    ).toBe(true)
  })
})

interface UserRow {
  id: string
  handle: string
  email: string
  roles: string[]
  reputation: number
  strikes: number
  status: string
  createdAt: string
  lastSeen: string | null
}

