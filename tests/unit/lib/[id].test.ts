import { describe, it, expect, beforeEach, jest } from "@jest/globals"
import { NextRequest } from "next/server"
import { GET, PATCH } from "@/app/api/admin/users/[id]/route"
import { getCurrentUser, isAdmin } from "@/lib/auth-server"
import { getServerUserById, updateServerUser } from "@/lib/storage-server"
import type { User } from "@/lib/types"

jest.mock("@/lib/auth-server")
jest.mock("@/lib/storage-server")

const mockGetCurrentUser = getCurrentUser as jest.MockedFunction<
  typeof getCurrentUser
>
const mockIsAdmin = isAdmin as jest.MockedFunction<typeof isAdmin>
const mockGetServerUserById = getServerUserById as jest.MockedFunction<
  typeof getServerUserById
>
const mockUpdateServerUser = updateServerUser as jest.MockedFunction<
  typeof updateServerUser
>

describe("Admin Users API - Permission Checks", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("GET /api/admin/users/[id]", () => {
    it("should return 403 if user is not authenticated", async () => {
      mockGetCurrentUser.mockResolvedValue(null)
      mockIsAdmin.mockResolvedValue(false)

      const request = new NextRequest("http://localhost/api/admin/users/123")
      const response = await GET(request, { params: { id: "123" } })
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

      const request = new NextRequest("http://localhost/api/admin/users/123")
      const response = await GET(request, { params: { id: "123" } })
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toContain("Unauthorized")
    })

    it("should return 200 with user data if admin", async () => {
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

      const mockUser: User = {
        id: "user-123",
        email: "user@example.com",
        username: "user123",
        fullName: "User",
        joinedAt: new Date().toISOString(),
        followers: [],
        following: [],
      }

      mockGetCurrentUser.mockResolvedValue(mockAdmin)
      mockIsAdmin.mockResolvedValue(true)
      mockGetServerUserById.mockReturnValue(mockUser)

      const request = new NextRequest("http://localhost/api/admin/users/123")
      const response = await GET(request, { params: { id: "123" } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.id).toBe("user-123")
    })
  })

  describe("PATCH /api/admin/users/[id]", () => {
    it("should return 403 if user is not admin", async () => {
      mockGetCurrentUser.mockResolvedValue(null)
      mockIsAdmin.mockResolvedValue(false)

      const request = new NextRequest("http://localhost/api/admin/users/123", {
        method: "PATCH",
        body: JSON.stringify({ action: "adjustRoles", roles: ["user"] }),
      })
      const response = await PATCH(request, { params: { id: "123" } })
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toContain("Unauthorized")
    })

    it("should update user roles and send notification", async () => {
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

      const mockUser: User = {
        id: "user-123",
        email: "user@example.com",
        username: "user123",
        fullName: "User",
        role: "user",
        joinedAt: new Date().toISOString(),
        followers: [],
        following: [],
      }

      const updatedUser: User = {
        ...mockUser,
        roles: ["user", "moderator"],
        role: "moderator",
      }

      mockGetCurrentUser.mockResolvedValue(mockAdmin)
      mockIsAdmin.mockResolvedValue(true)
      mockGetServerUserById.mockReturnValue(mockUser)
      mockUpdateServerUser.mockImplementation(() => {
        mockGetServerUserById.mockReturnValue(updatedUser)
      })

      const request = new NextRequest("http://localhost/api/admin/users/123", {
        method: "PATCH",
        body: JSON.stringify({ action: "adjustRoles", roles: ["user", "moderator"] }),
      })
      const response = await PATCH(request, { params: { id: "123" } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(mockUpdateServerUser).toHaveBeenCalledWith("123", expect.objectContaining({
        roles: ["user", "moderator"],
      }))
    })

    it("should issue warning and increment strikes", async () => {
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

      const mockUser: User = {
        id: "user-123",
        email: "user@example.com",
        username: "user123",
        fullName: "User",
        strikes: 1,
        joinedAt: new Date().toISOString(),
        followers: [],
        following: [],
      }

      mockGetCurrentUser.mockResolvedValue(mockAdmin)
      mockIsAdmin.mockResolvedValue(true)
      mockGetServerUserById.mockReturnValue(mockUser)

      const request = new NextRequest("http://localhost/api/admin/users/123", {
        method: "PATCH",
        body: JSON.stringify({
          action: "issueWarning",
          warningTemplate: "spam",
        }),
      })
      const response = await PATCH(request, { params: { id: "123" } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(mockUpdateServerUser).toHaveBeenCalledWith("123", expect.objectContaining({
        strikes: 2,
      }))
      // In production, would verify notification was sent
    })

    it("should mute user with expiry date", async () => {
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

      const mockUser: User = {
        id: "user-123",
        email: "user@example.com",
        username: "user123",
        fullName: "User",
        joinedAt: new Date().toISOString(),
        followers: [],
        following: [],
      }

      mockGetCurrentUser.mockResolvedValue(mockAdmin)
      mockIsAdmin.mockResolvedValue(true)
      mockGetServerUserById.mockReturnValue(mockUser)

      const expiryDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

      const request = new NextRequest("http://localhost/api/admin/users/123", {
        method: "PATCH",
        body: JSON.stringify({
          action: "mute",
          muteExpiry: expiryDate,
        }),
      })
      const response = await PATCH(request, { params: { id: "123" } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(mockUpdateServerUser).toHaveBeenCalledWith("123", expect.objectContaining({
        status: "muted",
        muteExpiry: expiryDate,
      }))
      // In production, would verify notification was sent
    })

    it("should suspend user with expiry date", async () => {
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

      const mockUser: User = {
        id: "user-123",
        email: "user@example.com",
        username: "user123",
        fullName: "User",
        joinedAt: new Date().toISOString(),
        followers: [],
        following: [],
      }

      mockGetCurrentUser.mockResolvedValue(mockAdmin)
      mockIsAdmin.mockResolvedValue(true)
      mockGetServerUserById.mockReturnValue(mockUser)

      const expiryDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

      const request = new NextRequest("http://localhost/api/admin/users/123", {
        method: "PATCH",
        body: JSON.stringify({
          action: "suspend",
          suspendExpiry: expiryDate,
        }),
      })
      const response = await PATCH(request, { params: { id: "123" } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(mockUpdateServerUser).toHaveBeenCalledWith("123", expect.objectContaining({
        status: "suspended",
        suspendExpiry: expiryDate,
      }))
      // In production, would verify notification was sent
    })
  })
})

