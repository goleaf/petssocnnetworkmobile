/**
 * @jest-environment jsdom
 */

import { getCSRFToken, validateCSRFToken } from "../csrf"

describe("CSRF Token Utilities", () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe("getCSRFToken", () => {
    it("should generate a new token when none exists", () => {
      const token = getCSRFToken()
      expect(token).toBeDefined()
      expect(token.length).toBeGreaterThan(0)
    })

    it("should return the same token if it hasn't expired", () => {
      const token1 = getCSRFToken()
      const token2 = getCSRFToken()
      expect(token1).toBe(token2)
    })

    it("should generate a new token after expiry", () => {
      const token1 = getCSRFToken()

      // Manually expire the token
      const stored = localStorage.getItem("admin_csrf_token")
      if (stored) {
        const data = JSON.parse(stored)
        data.expiresAt = Date.now() - 1000 // Expired 1 second ago
        localStorage.setItem("admin_csrf_token", JSON.stringify(data))
      }

      const token2 = getCSRFToken()
      expect(token2).not.toBe(token1)
    })
  })

  describe("validateCSRFToken", () => {
    it("should validate a correct token", () => {
      const token = getCSRFToken()
      expect(validateCSRFToken(token)).toBe(true)
    })

    it("should reject an invalid token", () => {
      expect(validateCSRFToken("invalid-token")).toBe(false)
    })

    it("should reject an expired token", () => {
      const token = getCSRFToken()

      // Manually expire the token
      const stored = localStorage.getItem("admin_csrf_token")
      if (stored) {
        const data = JSON.parse(stored)
        data.expiresAt = Date.now() - 1000 // Expired 1 second ago
        localStorage.setItem("admin_csrf_token", JSON.stringify(data))
      }

      expect(validateCSRFToken(token)).toBe(false)
    })

    it("should reject when no token exists", () => {
      localStorage.clear()
      expect(validateCSRFToken("any-token")).toBe(false)
    })
  })
})

