/**
 * Tests for hasRoleInRoles function in auth-server
 * 
 * Tests role checking matrix for different user roles
 */

import { hasRoleInRoles } from "@/lib/auth-server"
import type { User, UserRole } from "@/lib/types"

describe("hasRoleInRoles", () => {
  const createUser = (role?: UserRole): User => ({
    id: "1",
    email: "test@example.com",
    username: "testuser",
    fullName: "Test User",
    role,
    joinedAt: "2024-01-01",
    followers: [],
    following: [],
  })

  describe("Role matrix - Admin", () => {
    it("should return true for admin user checking admin role", () => {
      const user = createUser("admin")
      expect(hasRoleInRoles(user, ["admin"])).toBe(true)
    })

    it("should return true for admin user checking multiple roles including admin", () => {
      const user = createUser("admin")
      expect(hasRoleInRoles(user, ["admin", "moderator"])).toBe(true)
    })

    it("should return true for admin user checking moderator role (admin has all permissions)", () => {
      const user = createUser("admin")
      expect(hasRoleInRoles(user, ["moderator"])).toBe(true)
    })
  })

  describe("Role matrix - Moderator", () => {
    it("should return true for moderator user checking moderator role", () => {
      const user = createUser("moderator")
      expect(hasRoleInRoles(user, ["moderator"])).toBe(true)
    })

    it("should return true for moderator user checking multiple roles including moderator", () => {
      const user = createUser("moderator")
      expect(hasRoleInRoles(user, ["admin", "moderator"])).toBe(true)
    })

    it("should return false for moderator user checking admin role", () => {
      const user = createUser("moderator")
      expect(hasRoleInRoles(user, ["admin"])).toBe(false)
    })
  })

  describe("Role matrix - User", () => {
    it("should return false for regular user checking admin role", () => {
      const user = createUser("user")
      expect(hasRoleInRoles(user, ["admin"])).toBe(false)
    })

    it("should return false for regular user checking moderator role", () => {
      const user = createUser("user")
      expect(hasRoleInRoles(user, ["moderator"])).toBe(false)
    })

    it("should return false for regular user checking any admin/moderator roles", () => {
      const user = createUser("user")
      expect(hasRoleInRoles(user, ["admin", "moderator"])).toBe(false)
    })

    it("should return true for regular user checking user role", () => {
      const user = createUser("user")
      expect(hasRoleInRoles(user, ["user"])).toBe(true)
    })
  })

  describe("Edge cases", () => {
    it("should return false when user is null", () => {
      expect(hasRoleInRoles(null, ["admin"])).toBe(false)
    })

    it("should return false when user has no role", () => {
      const user = createUser(undefined)
      expect(hasRoleInRoles(user, ["admin"])).toBe(false)
    })

    it("should handle ContentManager role mapping to moderator", () => {
      const user = createUser("moderator")
      // ContentManager should be treated as moderator
      expect(hasRoleInRoles(user, ["contentmanager" as UserRole])).toBe(true)
    })

    it("should handle case-insensitive role names", () => {
      const user = createUser("admin")
      expect(hasRoleInRoles(user, ["Admin" as UserRole])).toBe(true)
      expect(hasRoleInRoles(user, ["ADMIN" as UserRole])).toBe(true)
    })

    it("should return false for empty roles array", () => {
      const user = createUser("admin")
      expect(hasRoleInRoles(user, [])).toBe(false)
    })
  })
})

