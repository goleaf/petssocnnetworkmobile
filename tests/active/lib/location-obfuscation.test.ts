/**
 * Tests for Location Obfuscation
 * 
 * Ensures that precise coordinates are NEVER stored for private profiles.
 */

import type { User } from "@/lib/types"
import {
  obfuscateLocationForStorage,
  sanitizeLocationForStorage,
  allowsPreciseCoordinates,
  getDisplayLocation,
} from "../utils/location-obfuscation"
import { updateUser } from "../storage"

describe("Location Obfuscation", () => {
  const testLatitude = 37.7749
  const testLongitude = -122.4194

  describe("allowsPreciseCoordinates", () => {
    it("should return true for public location privacy", () => {
      expect(allowsPreciseCoordinates("public")).toBe(true)
    })

    it("should return false for private location privacy", () => {
      expect(allowsPreciseCoordinates("private")).toBe(false)
    })

    it("should return false for followers-only location privacy", () => {
      expect(allowsPreciseCoordinates("followers-only")).toBe(false)
    })

    it("should return false for undefined location privacy", () => {
      expect(allowsPreciseCoordinates(undefined)).toBe(false)
    })
  })

  describe("obfuscateLocationForStorage", () => {
    it("should store both grid and precise coordinates for public profiles", () => {
      const user: Partial<User> = {
        privacy: {
          location: "public",
          profile: "public",
          email: "public",
          pets: "public",
          posts: "public",
          followers: "public",
          following: "public",
          searchable: true,
          allowFollowRequests: "public",
          allowTagging: "public",
        },
      }

      const result = obfuscateLocationForStorage(user, testLatitude, testLongitude)

      expect(result.locationGrid).toBeDefined()
      expect(result.locationPrecise).toBeDefined()
      expect(result.locationPrecise?.latitude).toBe(testLatitude)
      expect(result.locationPrecise?.longitude).toBe(testLongitude)
    })

    it("should store ONLY grid for private profiles, never precise coordinates", () => {
      const user: Partial<User> = {
        privacy: {
          location: "private",
          profile: "public",
          email: "public",
          pets: "public",
          posts: "public",
          followers: "public",
          following: "public",
          searchable: true,
          allowFollowRequests: "public",
          allowTagging: "public",
        },
      }

      const result = obfuscateLocationForStorage(user, testLatitude, testLongitude)

      expect(result.locationGrid).toBeDefined()
      expect(result.locationPrecise).toBeUndefined() // CRITICAL: No precise coordinates
    })

    it("should store ONLY grid for followers-only profiles, never precise coordinates", () => {
      const user: Partial<User> = {
        privacy: {
          location: "followers-only",
          profile: "public",
          email: "public",
          pets: "public",
          posts: "public",
          followers: "public",
          following: "public",
          searchable: true,
          allowFollowRequests: "public",
          allowTagging: "public",
        },
      }

      const result = obfuscateLocationForStorage(user, testLatitude, testLongitude)

      expect(result.locationGrid).toBeDefined()
      expect(result.locationPrecise).toBeUndefined() // CRITICAL: No precise coordinates
    })

    it("should return empty object if no coordinates provided", () => {
      const user: Partial<User> = {
        privacy: {
          location: "public",
          profile: "public",
          email: "public",
          pets: "public",
          posts: "public",
          followers: "public",
          following: "public",
          searchable: true,
          allowFollowRequests: "public",
          allowTagging: "public",
        },
      }

      const result = obfuscateLocationForStorage(user)

      expect(result.locationGrid).toBeUndefined()
      expect(result.locationPrecise).toBeUndefined()
    })
  })

  describe("sanitizeLocationForStorage", () => {
    it("should remove precise coordinates from private profiles", () => {
      const user: Partial<User> = {
        id: "user1",
        privacy: {
          location: "private",
          profile: "public",
          email: "public",
          pets: "public",
          posts: "public",
          followers: "public",
          following: "public",
          searchable: true,
          allowFollowRequests: "public",
          allowTagging: "public",
        },
        locationPrecise: {
          latitude: testLatitude,
          longitude: testLongitude,
        },
        locationGrid: "lat_4197_lng_-13602",
      }

      const sanitized = sanitizeLocationForStorage(user)

      expect(sanitized.locationGrid).toBeDefined()
      expect(sanitized.locationPrecise).toBeUndefined() // CRITICAL: Removed
    })

    it("should remove precise coordinates from followers-only profiles", () => {
      const user: Partial<User> = {
        id: "user2",
        privacy: {
          location: "followers-only",
          profile: "public",
          email: "public",
          pets: "public",
          posts: "public",
          followers: "public",
          following: "public",
          searchable: true,
          allowFollowRequests: "public",
          allowTagging: "public",
        },
        locationPrecise: {
          latitude: testLatitude,
          longitude: testLongitude,
        },
        locationGrid: "lat_4197_lng_-13602",
      }

      const sanitized = sanitizeLocationForStorage(user)

      expect(sanitized.locationGrid).toBeDefined()
      expect(sanitized.locationPrecise).toBeUndefined() // CRITICAL: Removed
    })

    it("should preserve precise coordinates for public profiles", () => {
      const user: Partial<User> = {
        id: "user3",
        privacy: {
          location: "public",
          profile: "public",
          email: "public",
          pets: "public",
          posts: "public",
          followers: "public",
          following: "public",
          searchable: true,
          allowFollowRequests: "public",
          allowTagging: "public",
        },
        locationPrecise: {
          latitude: testLatitude,
          longitude: testLongitude,
        },
        locationGrid: "lat_4197_lng_-13602",
      }

      const sanitized = sanitizeLocationForStorage(user)

      expect(sanitized.locationGrid).toBeDefined()
      expect(sanitized.locationPrecise).toBeDefined() // Preserved for public
      expect(sanitized.locationPrecise?.latitude).toBe(testLatitude)
      expect(sanitized.locationPrecise?.longitude).toBe(testLongitude)
    })

    it("should handle undefined privacy gracefully", () => {
      const user: Partial<User> = {
        id: "user4",
        locationPrecise: {
          latitude: testLatitude,
          longitude: testLongitude,
        },
        locationGrid: "lat_4197_lng_-13602",
      }

      const sanitized = sanitizeLocationForStorage(user)

      expect(sanitized.locationGrid).toBeDefined()
      expect(sanitized.locationPrecise).toBeUndefined() // Removed for undefined (non-public)
    })
  })

  describe("getDisplayLocation", () => {
    it("should return null for private location when viewer is not owner", () => {
      const user: User = {
        id: "user1",
        email: "test@example.com",
        username: "testuser",
        fullName: "Test User",
        joinedAt: new Date().toISOString(),
        followers: [],
        following: [],
        privacy: {
          location: "private",
          profile: "public",
          email: "public",
          pets: "public",
          posts: "public",
          followers: "public",
          following: "public",
          searchable: true,
          allowFollowRequests: "public",
          allowTagging: "public",
        },
        location: "San Francisco, CA",
        locationGrid: "lat_4197_lng_-13602",
      }

      const result = getDisplayLocation(user, "viewer1")

      expect(result).toBeNull()
    })

    it("should return location data for owner even if private", () => {
      const user: User = {
        id: "user1",
        email: "test@example.com",
        username: "testuser",
        fullName: "Test User",
        joinedAt: new Date().toISOString(),
        followers: [],
        following: [],
        privacy: {
          location: "private",
          profile: "public",
          email: "public",
          pets: "public",
          posts: "public",
          followers: "public",
          following: "public",
          searchable: true,
          allowFollowRequests: "public",
          allowTagging: "public",
        },
        location: "San Francisco, CA",
        locationGrid: "lat_4197_lng_-13602",
      }

      const result = getDisplayLocation(user, "user1")

      expect(result).not.toBeNull()
      expect(result?.locationText).toBe("San Francisco, CA")
    })
  })

  describe("Integration: updateUser storage function", () => {
    beforeEach(() => {
      // Clear localStorage
      if (typeof window !== "undefined") {
        localStorage.clear()
      }
    })

    it("should NOT store precise coordinates when updating private profile", () => {
      // Create a private user
      const user: User = {
        id: "test-user-private",
        email: "private@example.com",
        username: "privateuser",
        fullName: "Private User",
        joinedAt: new Date().toISOString(),
        followers: [],
        following: [],
        privacy: {
          location: "private",
          profile: "public",
          email: "public",
          pets: "public",
          posts: "public",
          followers: "public",
          following: "public",
          searchable: true,
          allowFollowRequests: "public",
          allowTagging: "public",
        },
      }

      // Store user first
      if (typeof window !== "undefined") {
        localStorage.setItem("pet_social_users", JSON.stringify([user]))
      }

      // Attempt to update with precise coordinates
      updateUser("test-user-private", {
        locationPrecise: {
          latitude: testLatitude,
          longitude: testLongitude,
        },
        locationGrid: "lat_4197_lng_-13602",
      })

      // Retrieve and verify
      const users = JSON.parse(localStorage.getItem("pet_social_users") || "[]")
      const updatedUser = users.find((u: User) => u.id === "test-user-private")

      expect(updatedUser).toBeDefined()
      expect(updatedUser.locationGrid).toBeDefined()
      expect(updatedUser.locationPrecise).toBeUndefined() // CRITICAL: Should be removed
    })

    it("should store precise coordinates when updating public profile", () => {
      // Create a public user
      const user: User = {
        id: "test-user-public",
        email: "public@example.com",
        username: "publicuser",
        fullName: "Public User",
        joinedAt: new Date().toISOString(),
        followers: [],
        following: [],
        privacy: {
          location: "public",
          profile: "public",
          email: "public",
          pets: "public",
          posts: "public",
          followers: "public",
          following: "public",
          searchable: true,
          allowFollowRequests: "public",
          allowTagging: "public",
        },
      }

      // Store user first
      if (typeof window !== "undefined") {
        localStorage.setItem("pet_social_users", JSON.stringify([user]))
      }

      // Update with precise coordinates
      updateUser("test-user-public", {
        locationPrecise: {
          latitude: testLatitude,
          longitude: testLongitude,
        },
        locationGrid: "lat_4197_lng_-13602",
      })

      // Retrieve and verify
      const users = JSON.parse(localStorage.getItem("pet_social_users") || "[]")
      const updatedUser = users.find((u: User) => u.id === "test-user-public")

      expect(updatedUser).toBeDefined()
      expect(updatedUser.locationGrid).toBeDefined()
      expect(updatedUser.locationPrecise).toBeDefined() // Should be preserved
      expect(updatedUser.locationPrecise?.latitude).toBe(testLatitude)
      expect(updatedUser.locationPrecise?.longitude).toBe(testLongitude)
    })

    it("should remove existing precise coordinates when privacy changes to private", () => {
      // Create a public user with precise coordinates
      const user: User = {
        id: "test-user-change",
        email: "change@example.com",
        username: "changeuser",
        fullName: "Change User",
        joinedAt: new Date().toISOString(),
        followers: [],
        following: [],
        privacy: {
          location: "public",
          profile: "public",
          email: "public",
          pets: "public",
          posts: "public",
          followers: "public",
          following: "public",
          searchable: true,
          allowFollowRequests: "public",
          allowTagging: "public",
        },
        locationPrecise: {
          latitude: testLatitude,
          longitude: testLongitude,
        },
        locationGrid: "lat_4197_lng_-13602",
      }

      // Store user first
      if (typeof window !== "undefined") {
        localStorage.setItem("pet_social_users", JSON.stringify([user]))
      }

      // Change privacy to private
      updateUser("test-user-change", {
        privacy: {
          ...user.privacy!,
          location: "private",
        },
      })

      // Retrieve and verify
      const users = JSON.parse(localStorage.getItem("pet_social_users") || "[]")
      const updatedUser = users.find((u: User) => u.id === "test-user-change")

      expect(updatedUser).toBeDefined()
      expect(updatedUser.privacy?.location).toBe("private")
      expect(updatedUser.locationGrid).toBeDefined()
      expect(updatedUser.locationPrecise).toBeUndefined() // CRITICAL: Should be removed
    })
  })
})

