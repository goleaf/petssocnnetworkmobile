import {
  calculatePoints,
  computeTier,
  getTierConfig,
  getUserPrivileges,
  canAddExternalLink,
  awardPoints,
  getDailyPointsData,
  computeTiersForAllUsers,
  TIER_CONFIGS,
} from "../tiers"
import type { User, PointActionType } from "../types"

describe("Tier System", () => {
  describe("calculatePoints", () => {
    it("should return base points for actions below threshold", () => {
      expect(calculatePoints("post_create", 3)).toBe(10)
      expect(calculatePoints("post_like", 10)).toBe(1)
      expect(calculatePoints("post_comment", 5)).toBe(3)
    })

    it("should apply diminishing returns after threshold", () => {
      // 6th post (threshold is 5, so 6 > 5)
      expect(calculatePoints("post_create", 6)).toBe(5) // 50% of base (10 * 0.5 = 5)
      
      // 21st like (threshold is 20, so 21 > 20)
      expect(calculatePoints("post_like", 21)).toBe(1) // 50% of base (1 * 0.5 = 0.5, rounded to 1)
      
      // 11th comment (threshold is 15, so 11 <= 15, still base)
      expect(calculatePoints("post_comment", 11)).toBe(3)
    })

    it("should apply severe diminishing returns after 2x threshold", () => {
      // 11th post (threshold is 5, 2x = 10, so 11 > 10)
      expect(calculatePoints("post_create", 11)).toBe(3) // 25% of base (10 * 0.25 = 2.5, rounded to 3)
    })

    it("should handle all action types", () => {
      const actionTypes: PointActionType[] = [
        "post_create",
        "post_like",
        "post_comment",
        "post_share",
        "wiki_create",
        "wiki_edit",
        "comment_reply",
        "follow_user",
        "pet_add",
        "group_create",
        "group_post",
      ]

      actionTypes.forEach((type) => {
        const points = calculatePoints(type, 1)
        expect(points).toBeGreaterThan(0)
      })
    })
  })

  describe("computeTier", () => {
    it("should return bronze for 0 points", () => {
      expect(computeTier(0)).toBe("bronze")
    })

    it("should return bronze for points below silver threshold", () => {
      expect(computeTier(99)).toBe("bronze")
    })

    it("should return silver for 100 points", () => {
      expect(computeTier(100)).toBe("silver")
    })

    it("should return gold for 500 points", () => {
      expect(computeTier(500)).toBe("gold")
    })

    it("should return platinum for 2000 points", () => {
      expect(computeTier(2000)).toBe("platinum")
    })

    it("should return diamond for 10000 points", () => {
      expect(computeTier(10000)).toBe("diamond")
    })

    it("should return highest tier for points above max", () => {
      expect(computeTier(50000)).toBe("diamond")
    })
  })

  describe("getTierConfig", () => {
    it("should return correct config for each tier", () => {
      TIER_CONFIGS.forEach((config) => {
        const retrieved = getTierConfig(config.tier)
        expect(retrieved.tier).toBe(config.tier)
        expect(retrieved.minPoints).toBe(config.minPoints)
        expect(retrieved.privileges.externalLinkQuota).toBeGreaterThan(0)
      })
    })

    it("should throw error for invalid tier", () => {
      expect(() => getTierConfig("invalid" as any)).toThrow()
    })
  })

  describe("getUserPrivileges", () => {
    it("should return bronze privileges for user without tier", () => {
      const user: User = {
        id: "1",
        email: "test@example.com",
        username: "testuser",
        fullName: "Test User",
        joinedAt: new Date().toISOString(),
        followers: [],
        following: [],
      }

      const privileges = getUserPrivileges(user)
      expect(privileges.externalLinkQuota).toBe(1)
      expect(privileges.canMovePages).toBe(false)
    })

    it("should return correct privileges for each tier", () => {
      const tiers: Array<"bronze" | "silver" | "gold" | "platinum" | "diamond"> = [
        "bronze",
        "silver",
        "gold",
        "platinum",
        "diamond",
      ]

      tiers.forEach((tier) => {
        const user: User = {
          id: "1",
          email: "test@example.com",
          username: "testuser",
          fullName: "Test User",
          joinedAt: new Date().toISOString(),
          followers: [],
          following: [],
          tier,
        }

        const privileges = getUserPrivileges(user)
        const config = getTierConfig(tier)
        expect(privileges.externalLinkQuota).toBe(config.privileges.externalLinkQuota)
        expect(privileges.canMovePages).toBe(config.privileges.canMovePages)
      })
    })
  })

  describe("canAddExternalLink", () => {
    it("should allow adding link within quota", () => {
      const user: User = {
        id: "1",
        email: "test@example.com",
        username: "testuser",
        fullName: "Test User",
        joinedAt: new Date().toISOString(),
        followers: [],
        following: [],
        tier: "bronze",
      }

      expect(canAddExternalLink(user, 0)).toBe(true)
    })

    it("should prevent adding link when quota exceeded", () => {
      const user: User = {
        id: "1",
        email: "test@example.com",
        username: "testuser",
        fullName: "Test User",
        joinedAt: new Date().toISOString(),
        followers: [],
        following: [],
        tier: "bronze",
      }

      expect(canAddExternalLink(user, 1)).toBe(false)
    })

    it("should respect higher quotas for higher tiers", () => {
      const goldUser: User = {
        id: "1",
        email: "test@example.com",
        username: "testuser",
        fullName: "Test User",
        joinedAt: new Date().toISOString(),
        followers: [],
        following: [],
        tier: "gold",
      }

      expect(canAddExternalLink(goldUser, 4)).toBe(true)
      expect(canAddExternalLink(goldUser, 5)).toBe(false)
    })
  })

  describe("awardPoints", () => {
    it("should award points and update daily data", () => {
      const user: User = {
        id: "1",
        email: "test@example.com",
        username: "testuser",
        fullName: "Test User",
        joinedAt: new Date().toISOString(),
        followers: [],
        following: [],
        points: 0,
      }

      const result = awardPoints(user, "post_create")
      expect(result.pointsAwarded).toBe(10)
      expect(result.newTotalPoints).toBe(10)
      expect(result.dailyData.actions.post_create).toBe(1)
      expect(result.dailyData.totalPointsEarned).toBe(10)
    })

    it("should apply diminishing returns correctly", () => {
      const user: User = {
        id: "1",
        email: "test@example.com",
        username: "testuser",
        fullName: "Test User",
        joinedAt: new Date().toISOString(),
        followers: [],
        following: [],
        points: 0,
        dailyPoints: {
          date: new Date().toISOString().split("T")[0],
          actions: {
            post_create: 5, // Already at threshold
            post_like: 0,
            post_comment: 0,
            post_share: 0,
            wiki_create: 0,
            wiki_edit: 0,
            comment_reply: 0,
            follow_user: 0,
            pet_add: 0,
            group_create: 0,
            group_post: 0,
          },
          totalPointsEarned: 50,
        },
      }

      const result = awardPoints(user, "post_create")
      expect(result.pointsAwarded).toBe(5) // 50% of base due to diminishing returns (6th post)
      expect(result.newTotalPoints).toBe(5) // Was 0, now 5
      expect(result.dailyData.actions.post_create).toBe(6)
    })

    it("should reset daily data for new day", () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)

      const user: User = {
        id: "1",
        email: "test@example.com",
        username: "testuser",
        fullName: "Test User",
        joinedAt: new Date().toISOString(),
        followers: [],
        following: [],
        points: 100,
        dailyPoints: {
          date: yesterday.toISOString().split("T")[0],
          actions: {
            post_create: 10,
            post_like: 0,
            post_comment: 0,
            post_share: 0,
            wiki_create: 0,
            wiki_edit: 0,
            comment_reply: 0,
            follow_user: 0,
            pet_add: 0,
            group_create: 0,
            group_post: 0,
          },
          totalPointsEarned: 100,
        },
      }

      const result = awardPoints(user, "post_create")
      expect(result.dailyData.actions.post_create).toBe(1) // Reset for new day
      expect(result.dailyData.totalPointsEarned).toBe(10)
    })
  })

  describe("computeTiersForAllUsers", () => {
    it("should compute tiers based on points", () => {
      const users: User[] = [
        {
          id: "1",
          email: "user1@example.com",
          username: "user1",
          fullName: "User 1",
          joinedAt: new Date().toISOString(),
          followers: [],
          following: [],
          points: 50,
        },
        {
          id: "2",
          email: "user2@example.com",
          username: "user2",
          fullName: "User 2",
          joinedAt: new Date().toISOString(),
          followers: [],
          following: [],
          points: 150,
        },
        {
          id: "3",
          email: "user3@example.com",
          username: "user3",
          fullName: "User 3",
          joinedAt: new Date().toISOString(),
          followers: [],
          following: [],
          points: 2500,
        },
      ]

      const updated = computeTiersForAllUsers(users)
      expect(updated[0].tier).toBe("bronze")
      expect(updated[1].tier).toBe("silver")
      expect(updated[2].tier).toBe("platinum")
      expect(updated[0].tierLastComputed).toBeDefined()
    })

    it("should not recompute if already computed today", () => {
      const today = new Date().toISOString().split("T")[0]
      const users: User[] = [
        {
          id: "1",
          email: "user1@example.com",
          username: "user1",
          fullName: "User 1",
          joinedAt: new Date().toISOString(),
          followers: [],
          following: [],
          points: 150,
          tier: "bronze",
          tierLastComputed: today,
        },
      ]

      const updated = computeTiersForAllUsers(users)
      expect(updated[0].tier).toBe("bronze") // Should not change
    })
  })
})

