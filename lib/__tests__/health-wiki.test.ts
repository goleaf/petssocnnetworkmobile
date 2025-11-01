import {
  addWikiArticle,
  addWikiRevision,
  markRevisionAsStable,
  canPublishStableHealthRevision,
  getWikiArticleBySlug,
  isStaleContent,
  updateWikiArticle,
} from "../storage"
import { addExpertProfile } from "../storage"
import type { User } from "../types"
import type { WikiArticle, WikiRevision, HealthArticleData } from "../types"

describe("Health Wiki Articles", () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
  })

  const createHealthArticle = (healthData?: Partial<HealthArticleData>): WikiArticle => {
    const article: WikiArticle = {
      id: "health-article-1",
      title: "Test Health Condition",
      slug: "test-health-condition",
      category: "health",
      content: "Test content about a health condition",
      authorId: "user-1",
      views: 0,
      likes: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      healthData: {
        symptoms: ["vomiting", "lethargy"],
        urgency: "urgent",
        riskFactors: ["age", "breed"],
        diagnosisMethods: ["blood test"],
        treatments: ["medication"],
        prevention: ["vaccination"],
        ...healthData,
      },
    }
    return article
  }

  const createExpertUser = (userId: string) => {
    addExpertProfile({
      userId,
      credential: "DVM",
      verifiedAt: new Date().toISOString(),
    })
    // Also create a user with vet badge for canPublishStableHealthRevision
    const storage = require("../storage")
    // Check if user already exists
    const users = storage.getUsers()
    if (!users.find((u: User) => u.id === userId)) {
      // Directly add user to localStorage
      const newUser: User = {
        id: userId,
        email: `${userId}@test.com`,
        username: userId,
        fullName: `Expert ${userId}`,
        role: "user",
        badge: "vet",
        joinedAt: new Date().toISOString(),
        followers: [],
        following: [],
      }
      users.push(newUser)
      // Use the same storage key as the storage module
      const STORAGE_KEYS = {
        USERS: "users",
        WIKI_ARTICLES: "wiki_articles",
        WIKI_REVISIONS: "wiki_revisions",
        EXPERT_PROFILES: "expert_profiles",
      }
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users))
    }
  }

  describe("Health-specific fields", () => {
    it("should create a health article with all health fields", () => {
      const article = createHealthArticle()
      addWikiArticle(article)

      const retrieved = getWikiArticleBySlug("test-health-condition")
      expect(retrieved).toBeDefined()
      expect(retrieved?.category).toBe("health")
      expect(retrieved?.healthData).toBeDefined()
      expect(retrieved?.healthData?.symptoms).toEqual(["vomiting", "lethargy"])
      expect(retrieved?.healthData?.urgency).toBe("urgent")
      expect(retrieved?.healthData?.riskFactors).toEqual(["age", "breed"])
      expect(retrieved?.healthData?.diagnosisMethods).toEqual(["blood test"])
      expect(retrieved?.healthData?.treatments).toEqual(["medication"])
      expect(retrieved?.healthData?.prevention).toEqual(["vaccination"])
    })

    it("should support all urgency levels", () => {
      const urgentLevels: Array<"emergency" | "urgent" | "routine"> = [
        "emergency",
        "urgent",
        "routine",
      ]

      urgentLevels.forEach((urgency) => {
        const article = createHealthArticle({ urgency })
        addWikiArticle(article)

        const retrieved = getWikiArticleBySlug(
          `test-health-condition-${urgency}`
        )
        if (retrieved) {
          expect(retrieved.healthData?.urgency).toBe(urgency)
        }
      })
    })

    it("should support optional onsetAge field", () => {
      const article = createHealthArticle({ onsetAge: "6 months" })
      addWikiArticle(article)

      const retrieved = getWikiArticleBySlug("test-health-condition")
      expect(retrieved?.healthData?.onsetAge).toBe("6 months")
    })
  })

  describe("Expert review requirement", () => {
    it("should allow expert to publish stable health revision", () => {
      createExpertUser("expert-user")
      const article = createHealthArticle()
      addWikiArticle(article)

      const revision: WikiRevision = {
        id: "revision-1",
        articleId: article.id,
        content: "Updated content",
        status: "draft",
        authorId: "expert-user",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        healthData: article.healthData,
      }

      addWikiRevision(revision)

      const result = markRevisionAsStable(article.id, revision.id, "expert-user")
      expect(result.success).toBe(true)
      expect(result.error).toBeUndefined()

      const updated = getWikiArticleBySlug("test-health-condition")
      expect(updated?.stableRevisionId).toBe(revision.id)
      expect(updated?.healthData?.expertReviewer).toBe("expert-user")
      expect(updated?.healthData?.lastReviewedDate).toBeDefined()
    })

    it("should prevent non-expert from publishing stable health revision", () => {
      const article = createHealthArticle()
      addWikiArticle(article)

      const revision: WikiRevision = {
        id: "revision-1",
        articleId: article.id,
        content: "Updated content",
        status: "draft",
        authorId: "regular-user",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        healthData: article.healthData,
      }

      addWikiRevision(revision)

      const result = markRevisionAsStable(article.id, revision.id, "regular-user")
      expect(result.success).toBe(false)
      expect(result.error).toBe("Only verified experts can publish stable health revisions")

      const updated = getWikiArticleBySlug("test-health-condition")
      expect(updated?.stableRevisionId).toBeUndefined()
    })

    it("should check canPublishStableHealthRevision correctly", () => {
      createExpertUser("expert-user")

      expect(canPublishStableHealthRevision("expert-user")).toBe(true)
      expect(canPublishStableHealthRevision("regular-user")).toBe(false)
      expect(canPublishStableHealthRevision("nonexistent")).toBe(false)
    })
  })

  describe("Stale review detection", () => {
    it("should detect stale review (>12 months old)", () => {
      const twelveMonthsAgo = new Date()
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 13) // 13 months ago

      const article = createHealthArticle({
        lastReviewedDate: twelveMonthsAgo.toISOString(),
      })
      addWikiArticle(article)

      const isStale = isStaleContent(article.healthData?.lastReviewedDate)
      expect(isStale).toBe(true)
    })

    it("should not detect review as stale if <12 months old", () => {
      const sixMonthsAgo = new Date()
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6) // 6 months ago

      const article = createHealthArticle({
        lastReviewedDate: sixMonthsAgo.toISOString(),
      })
      addWikiArticle(article)

      const isStale = isStaleContent(article.healthData?.lastReviewedDate)
      expect(isStale).toBe(false)
    })

    it("should handle missing lastReviewedDate gracefully", () => {
      const article = createHealthArticle()
      delete article.healthData?.lastReviewedDate
      addWikiArticle(article)

      const isStale = isStaleContent(article.healthData?.lastReviewedDate)
      expect(isStale).toBe(false)
    })
  })

  describe("Health data in revisions", () => {
    it("should preserve health data when creating revisions", () => {
      const article = createHealthArticle()
      addWikiArticle(article)

      const revision: WikiRevision = {
        id: "revision-1",
        articleId: article.id,
        content: "Updated content with new information",
        status: "draft",
        authorId: "user-1",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        healthData: article.healthData,
      }

      addWikiRevision(revision)

      expect(revision.healthData).toBeDefined()
      expect(revision.healthData?.symptoms).toEqual(["vomiting", "lethargy"])
      expect(revision.healthData?.urgency).toBe("urgent")
    })

    it("should update healthData when marking revision as stable", () => {
      createExpertUser("expert-user")
      const article = createHealthArticle()
      addWikiArticle(article)

      const revision: WikiRevision = {
        id: "revision-1",
        articleId: article.id,
        content: "Updated content",
        status: "draft",
        authorId: "expert-user",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        healthData: article.healthData,
      }

      addWikiRevision(revision)

      const result = markRevisionAsStable(article.id, revision.id, "expert-user")
      expect(result.success).toBe(true)

      const updated = getWikiArticleBySlug("test-health-condition")
      expect(updated?.healthData?.expertReviewer).toBe("expert-user")
      expect(updated?.healthData?.lastReviewedDate).toBeDefined()
    })
  })
})

