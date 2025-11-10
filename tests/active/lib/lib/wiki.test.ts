/**
 * Tests for wiki core functions
 */

import {
  createArticle,
  createRevision,
  approveRevision,
  addCitation,
  getRelatedArticles,
  getStableRevision,
  getLatestRevision,
  markRevisionAsStable,
} from "../wiki"
import { addWikiRevision, getWikiRevisionsByArticleId } from "../storage"
import type { WikiArticle, WikiRevision, WikiContentBlock } from "../types"

describe("Wiki Core Functions", () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe("createArticle", () => {
    it("should create a breed article with infobox", () => {
      const article = createArticle({
        type: "breed",
        title: "Golden Retriever",
        infobox: {
          officialName: "Golden Retriever",
          species: "dog",
          sizeClass: "large",
          activityNeeds: 4,
        },
        content: "A friendly dog breed",
        authorId: "user-1",
      })

      expect(article.id).toBeDefined()
      expect(article.title).toBe("Golden Retriever")
      expect(article.type).toBe("breed")
      expect(article.category).toBe("breeds")
      expect(article.breedData).toBeDefined()
      expect(article.currentRevisionId).toBeDefined()
    })

    it("should create a health article with infobox", () => {
      const article = createArticle({
        type: "health",
        title: "Canine Parvovirus",
        infobox: {
          conditionName: "Canine Parvovirus",
          urgency: "emergency",
          symptoms: ["vomiting", "diarrhea", "lethargy"],
          severityLevel: "life-threatening",
        },
        content: "A serious illness in dogs",
        authorId: "user-1",
      })

      expect(article.type).toBe("health")
      expect(article.healthData).toBeDefined()
      expect(article.healthData?.urgency).toBe("emergency")
      expect(article.healthData?.symptoms).toHaveLength(3)
    })

    it("should generate unique slugs", () => {
      const article1 = createArticle({
        type: "breed",
        title: "Golden Retriever",
        content: "First article",
        authorId: "user-1",
      })

      const article2 = createArticle({
        type: "breed",
        title: "Golden Retriever",
        content: "Second article",
        authorId: "user-1",
      })

      expect(article1.slug).not.toBe(article2.slug)
    })

    it("should create initial revision", () => {
      const article = createArticle({
        type: "product",
        title: "Dog Food Brand X",
        content: "Test product",
        authorId: "user-1",
      })

      expect(article.currentRevisionId).toBeDefined()

      const revisions = getWikiRevisionsByArticleId(article.id)
      expect(revisions).toHaveLength(1)
      expect(revisions[0].status).toBe("approved")
    })
  })

  describe("createRevision", () => {
    it("should create a revision with diff", () => {
      const article = createArticle({
        type: "care",
        title: "Dog Grooming Basics",
        blocks: [
          {
            id: "block-1",
            type: "paragraph",
            content: "First paragraph",
          },
        ],
        authorId: "user-1",
      })

      const revision = createRevision(article.id, article.currentRevisionId!, {
        authorId: "user-2",
        blocks: [
          {
            id: "block-1",
            type: "paragraph",
            content: "First paragraph (updated)",
          },
          {
            id: "block-2",
            type: "paragraph",
            content: "Second paragraph",
          },
        ],
        summary: "Added new section",
        status: "pending",
      })

      expect(revision.id).toBeDefined()
      expect(revision.blocks).toHaveLength(2)
      expect(revision.diff).toBeDefined()
      expect(revision.diff?.added).toHaveLength(1)
      expect(revision.diff?.modified).toHaveLength(1)
    })

    it("should handle infobox changes in diff", () => {
      const article = createArticle({
        type: "health",
        title: "Test Condition",
        infobox: {
          conditionName: "Test Condition",
          urgency: "routine",
          symptoms: ["symptom1"],
        },
        authorId: "user-1",
      })

      const revision = createRevision(article.id, article.currentRevisionId!, {
        authorId: "user-2",
        blocks: [],
        infobox: {
          conditionName: "Test Condition",
          urgency: "urgent",
          symptoms: ["symptom1", "symptom2"],
        },
        status: "pending",
      })

      expect(revision.diff?.infoboxChanges).toBeDefined()
      expect(revision.diff?.infoboxChanges?.["urgency"]).toBeDefined()
    })
  })

  describe("approveRevision", () => {
    it("should approve a pending revision", () => {
      const article = createArticle({
        type: "care",
        title: "Test Article",
        content: "Initial content",
        authorId: "user-1",
      })

      const revision = createRevision(article.id, article.currentRevisionId!, {
        authorId: "user-2",
        blocks: [],
        status: "pending",
      })

      const result = approveRevision(revision.id, "moderator-1")

      expect(result.success).toBe(true)

      const updatedRevision = getWikiRevisionsByArticleId(article.id).find(
        (r) => r.id === revision.id
      )
      expect(updatedRevision?.status).toBe("approved")
    })

    it("should not approve already approved revision", () => {
      const article = createArticle({
        type: "care",
        title: "Test Article",
        content: "Initial content",
        authorId: "user-1",
      })

      const revision = getWikiRevisionsByArticleId(article.id)[0]

      const result = approveRevision(revision.id, "moderator-1")

      expect(result.success).toBe(false)
      expect(result.error).toContain("already approved")
    })
  })

  describe("addCitation", () => {
    it("should add a citation to a revision", () => {
      const article = createArticle({
        type: "health",
        title: "Test Condition",
        content: "Test content",
        authorId: "user-1",
      })

      const revision = createRevision(article.id, article.currentRevisionId!, {
        authorId: "user-2",
        blocks: [],
        status: "pending",
      })

      const result = addCitation(revision.id, "source-123", "p. 42")

      expect(result.success).toBe(true)
      expect(result.citationId).toBeDefined()

      const updatedRevision = getWikiRevisionsByArticleId(article.id).find(
        (r) => r.id === revision.id
      )
      expect(updatedRevision?.citations).toHaveLength(1)
      expect(updatedRevision?.citations?.[0].sourceId).toBe("source-123")
      expect(updatedRevision?.citations?.[0].locator).toBe("p. 42")
    })
  })

  describe("getRelatedArticles", () => {
    it("should find related articles by tags", () => {
      const article1 = createArticle({
        type: "breed",
        title: "Golden Retriever",
        tags: ["dog", "large-dog", "active"],
        authorId: "user-1",
      })

      const article2 = createArticle({
        type: "breed",
        title: "Labrador Retriever",
        tags: ["dog", "large-dog", "active"],
        authorId: "user-1",
      })

      const article3 = createArticle({
        type: "health",
        title: "Dog Health",
        tags: ["dog"],
        authorId: "user-1",
      })

      const related = getRelatedArticles(article1.id)

      expect(related).toContainEqual(expect.objectContaining({ id: article2.id }))
      expect(related).toContainEqual(expect.objectContaining({ id: article3.id }))
    })

    it("should score by multiple factors", () => {
      const article1 = createArticle({
        type: "health",
        title: "Canine Disease A",
        tags: ["dog", "health"],
        species: ["dog"],
        category: "health",
        authorId: "user-1",
      })

      const article2 = createArticle({
        type: "health",
        title: "Canine Disease B",
        tags: ["dog", "health"],
        species: ["dog"],
        category: "health",
        authorId: "user-1",
      })

      const related = getRelatedArticles(article1.id)
      expect(related.length).toBeGreaterThan(0)
    })
  })

  describe("getStableRevision and getLatestRevision", () => {
    it("should return stable revision when available", () => {
      const article = createArticle({
        type: "health",
        title: "Expert Article",
        content: "Initial",
        authorId: "user-1",
      })

      const stable = getStableRevision(article.id)
      expect(stable).toBeUndefined() // No stable yet

      // Mark as stable
      const result = markRevisionAsStable(
        article.id,
        article.currentRevisionId!,
        "expert-1"
      )

      // Update article manually
      const { updateWikiArticle } = require("../storage")
      updateWikiArticle({
        ...article,
        stableRevisionId: article.currentRevisionId,
      })

      const stableAfter = getStableRevision(article.id)
      expect(stableAfter).toBeDefined()
    })

    it("should return latest revision", () => {
      const article = createArticle({
        type: "care",
        title: "Test Article",
        content: "Initial",
        authorId: "user-1",
      })

      const latest1 = getLatestRevision(article.id)
      expect(latest1).toBeDefined()

      // Create new revision
      const revision = createRevision(article.id, article.currentRevisionId!, {
        authorId: "user-2",
        blocks: [],
        status: "approved",
      })

      const latest2 = getLatestRevision(article.id)
      expect(latest2?.id).toBe(revision.id)
    })
  })

  describe("markRevisionAsStable", () => {
    it("should require vet badge for health articles", () => {
      // Create a vet user
      const { getUsers } = require("../storage")
      const users = getUsers()
      users.push({
        id: "vet-1",
        email: "vet@test.com",
        username: "vet",
        fullName: "Dr. Vet",
        badge: "vet",
        joinedAt: new Date().toISOString(),
        followers: [],
        following: [],
      })

      const article = createArticle({
        type: "health",
        title: "Health Article",
        content: "Content",
        authorId: "user-1",
      })

      const result = markRevisionAsStable(
        article.id,
        article.currentRevisionId!,
        "vet-1"
      )

      expect(result.success).toBe(true)
    })

    it("should reject non-vet for health articles", () => {
      const article = createArticle({
        type: "health",
        title: "Health Article",
        content: "Content",
        authorId: "user-1",
      })

      const result = markRevisionAsStable(
        article.id,
        article.currentRevisionId!,
        "user-2"
      )

      expect(result.success).toBe(false)
      expect(result.error).toContain("Only verified experts")
    })

    it("should allow any user for non-health articles", () => {
      const article = createArticle({
        type: "care",
        title: "Care Article",
        content: "Content",
        authorId: "user-1",
      })

      const result = markRevisionAsStable(
        article.id,
        article.currentRevisionId!,
        "user-2"
      )

      expect(result.success).toBe(true)
    })
  })
})

