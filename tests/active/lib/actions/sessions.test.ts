/**
 * Tests for session logout actions
 * Requirements: 4.3, 4.4
 */

import { logoutSessionAction, logoutAllOtherSessionsAction } from "@/lib/actions/sessions"
import { registerSession, getUserSessions, isSessionRevoked } from "@/lib/session-store"
import { getCurrentUser } from "@/lib/auth-server"

// Mock dependencies
jest.mock("@/lib/auth-server")
jest.mock("next/headers", () => ({
  cookies: jest.fn(() => Promise.resolve({
    get: jest.fn((name: string) => ({ value: "current-token-123" })),
  })),
  headers: jest.fn(() => Promise.resolve({
    get: jest.fn(),
  })),
}))

const mockGetCurrentUser = getCurrentUser as jest.MockedFunction<typeof getCurrentUser>

describe("Session Logout Actions", () => {
  const mockUser = {
    id: "user-123",
    username: "testuser",
    email: "test@example.com",
    passwordHash: "hashed",
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockGetCurrentUser.mockResolvedValue(mockUser as any)
  })

  describe("logoutSessionAction", () => {
    it("should revoke a specific session by token", async () => {
      // Register test sessions
      const token1 = "session-token-1"
      const token2 = "session-token-2"
      registerSession(token1, mockUser.id, "Mozilla/5.0", "192.168.1.1")
      registerSession(token2, mockUser.id, "Mozilla/5.0", "192.168.1.2")

      // Verify sessions are not revoked initially
      expect(isSessionRevoked(token1)).toBe(false)
      expect(isSessionRevoked(token2)).toBe(false)

      // Logout specific session
      const result = await logoutSessionAction(token1)

      // Verify result
      expect(result.success).toBe(true)
      expect(isSessionRevoked(token1)).toBe(true)
      expect(isSessionRevoked(token2)).toBe(false)
    })

    it("should return error if session not found", async () => {
      const result = await logoutSessionAction("non-existent-token")

      expect(result.success).toBe(false)
      expect(result.error).toBe("Session not found")
    })

    it("should return error if user not authenticated", async () => {
      mockGetCurrentUser.mockResolvedValue(null)

      const result = await logoutSessionAction("some-token")

      expect(result.success).toBe(false)
      expect(result.error).toBe("Not authenticated")
    })
  })

  describe("logoutAllOtherSessionsAction", () => {
    it("should revoke all sessions except current", async () => {
      // Register multiple sessions
      const currentToken = "current-token-123"
      const token1 = "session-token-1"
      const token2 = "session-token-2"
      const token3 = "session-token-3"

      registerSession(currentToken, mockUser.id, "Mozilla/5.0", "192.168.1.1")
      registerSession(token1, mockUser.id, "Mozilla/5.0", "192.168.1.2")
      registerSession(token2, mockUser.id, "Mozilla/5.0", "192.168.1.3")
      registerSession(token3, mockUser.id, "Mozilla/5.0", "192.168.1.4")

      // Verify all sessions are active
      expect(isSessionRevoked(currentToken)).toBe(false)
      expect(isSessionRevoked(token1)).toBe(false)
      expect(isSessionRevoked(token2)).toBe(false)
      expect(isSessionRevoked(token3)).toBe(false)

      // Logout all other sessions
      const result = await logoutAllOtherSessionsAction()

      // Verify result
      expect(result.success).toBe(true)

      // Current session should still be active
      expect(isSessionRevoked(currentToken)).toBe(false)

      // All other sessions should be revoked
      expect(isSessionRevoked(token1)).toBe(true)
      expect(isSessionRevoked(token2)).toBe(true)
      expect(isSessionRevoked(token3)).toBe(true)
    })

    it("should return error if user not authenticated", async () => {
      mockGetCurrentUser.mockResolvedValue(null)

      const result = await logoutAllOtherSessionsAction()

      expect(result.success).toBe(false)
      expect(result.error).toBe("Not authenticated")
    })

    it("should handle case with no other sessions", async () => {
      const currentToken = "current-token-123"
      registerSession(currentToken, mockUser.id, "Mozilla/5.0", "192.168.1.1")

      const result = await logoutAllOtherSessionsAction()

      expect(result.success).toBe(true)
      expect(isSessionRevoked(currentToken)).toBe(false)
    })
  })
})
