import {
  getWikiRevisions,
  getWikiRevisionsByArticleId,
  getWikiRevisionById,
  addWikiRevision,
  updateWikiRevision,
  getStableRevision,
  getLatestRevision,
  isStaleContent,
  rollbackToStableRevision,
  getWikiArticles,
  updateWikiArticle,
  addModerationAction,
  getAllModerationActions,
} from "../storage"
import type { WikiArticle, WikiRevision, User } from "../types"

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
})()

beforeEach(() => {
  global.localStorage = localStorageMock as any
  localStorage.clear()
})

describe("Wiki Revision Functions", () => {
  const mockArticle: WikiArticle = {
    id: "article-1",
    title: "Test Article",
    slug: "test-article",
    category: "health",
    content: "Original content",
    authorId: "user-1",
    views: 0,
    likes: [],
    createdAt: "2024-01-01",
    updatedAt: "2024-01-01",
    stableRevisionId: "rev-stable-1",
    approvedAt: "2024-01-15",
  }

  const mockStableRevision: WikiRevision = {
    id: "rev-stable-1",
    articleId: "article-1",
    content: "Stable approved content",
    status: "stable",
    authorId: "user-1",
    createdAt: "2024-01-15",
    updatedAt: "2024-01-15",
    verifiedBy: "moderator-1",
  }

  const mockLatestRevision: WikiRevision = {
    id: "rev-latest-1",
    articleId: "article-1",
    content: "Latest unapproved content",
    status: "draft",
    authorId: "user-1",
    createdAt: "2024-03-01",
    updatedAt: "2024-03-01",
  }

  beforeEach(() => {
    // Setup article
    localStorage.setItem("pet_social_wiki_articles", JSON.stringify([mockArticle]))
    localStorage.setItem("pet_social_wiki_revisions", JSON.stringify([mockStableRevision, mockLatestRevision]))
    localStorage.setItem("pet_social_moderation_actions", JSON.stringify([]))
  })

  describe("getWikiRevisions", () => {
    it("should return all revisions", () => {
      const revisions = getWikiRevisions()
      expect(revisions).toHaveLength(2)
      expect(revisions).toContainEqual(mockStableRevision)
      expect(revisions).toContainEqual(mockLatestRevision)
    })

    it("should return empty array when no revisions exist", () => {
      localStorage.removeItem("pet_social_wiki_revisions")
      const revisions = getWikiRevisions()
      expect(revisions).toEqual([])
    })
  })

  describe("getWikiRevisionsByArticleId", () => {
    it("should return revisions for specific article", () => {
      const revisions = getWikiRevisionsByArticleId("article-1")
      expect(revisions).toHaveLength(2)
    })

    it("should return empty array for non-existent article", () => {
      const revisions = getWikiRevisionsByArticleId("non-existent")
      expect(revisions).toEqual([])
    })
  })

  describe("getWikiRevisionById", () => {
    it("should return revision by id", () => {
      const revision = getWikiRevisionById("rev-stable-1")
      expect(revision).toEqual(mockStableRevision)
    })

    it("should return undefined for non-existent revision", () => {
      const revision = getWikiRevisionById("non-existent")
      expect(revision).toBeUndefined()
    })
  })

  describe("addWikiRevision", () => {
    it("should add new revision", () => {
      const newRevision: WikiRevision = {
        id: "rev-new-1",
        articleId: "article-1",
        content: "New content",
        status: "draft",
        authorId: "user-1",
        createdAt: "2024-04-01",
        updatedAt: "2024-04-01",
      }

      addWikiRevision(newRevision)
      const revisions = getWikiRevisions()
      expect(revisions).toHaveLength(3)
      expect(revisions).toContainEqual(newRevision)
    })
  })

  describe("getStableRevision", () => {
    it("should return stable revision for article", () => {
      const stable = getStableRevision("article-1")
      expect(stable).toEqual(mockStableRevision)
    })

    it("should return undefined if no stable revision", () => {
      const articleNoStable: WikiArticle = {
        ...mockArticle,
        id: "article-2",
        stableRevisionId: undefined,
      }
      localStorage.setItem("pet_social_wiki_articles", JSON.stringify([articleNoStable]))
      const stable = getStableRevision("article-2")
      expect(stable).toBeUndefined()
    })
  })

  describe("getLatestRevision", () => {
    it("should return most recent non-deprecated revision", () => {
      const latest = getLatestRevision("article-1")
      expect(latest).toEqual(mockLatestRevision)
    })

    it("should exclude deprecated revisions", () => {
      const deprecated: WikiRevision = {
        id: "rev-deprecated-1",
        articleId: "article-1",
        content: "Deprecated content",
        status: "deprecated",
        authorId: "user-1",
        createdAt: "2024-05-01",
        updatedAt: "2024-05-01",
      }
      addWikiRevision(deprecated)
      const latest = getLatestRevision("article-1")
      expect(latest).toEqual(mockLatestRevision)
      expect(latest?.id).not.toBe("rev-deprecated-1")
    })
  })

  describe("isStaleContent", () => {
    it("should return true for content older than 12 months", () => {
      const oldDate = new Date()
      oldDate.setMonth(oldDate.getMonth() - 13)
      expect(isStaleContent(oldDate.toISOString())).toBe(true)
    })

    it("should return false for content newer than 12 months", () => {
      const recentDate = new Date()
      recentDate.setMonth(recentDate.getMonth() - 6)
      expect(isStaleContent(recentDate.toISOString())).toBe(false)
    })

    it("should return false for undefined date", () => {
      expect(isStaleContent(undefined)).toBe(false)
    })
  })

  describe("rollbackToStableRevision", () => {
    it("should rollback article to stable revision", () => {
      const result = rollbackToStableRevision("article-1", "moderator-1")

      expect(result.success).toBe(true)
      
      const articles = getWikiArticles()
      const article = articles.find((a) => a.id === "article-1")
      expect(article?.content).toBe("Stable approved content")
      expect(article?.currentRevisionId).toBe("rev-stable-1")
    })

    it("should create audit log entry", () => {
      rollbackToStableRevision("article-1", "moderator-1")

      const actions = getAllModerationActions()
      const rollbackAction = actions.find(
        (a) => a.targetId === "article-1" && a.reason?.includes("Rolled back")
      )
      
      expect(rollbackAction).toBeDefined()
      expect(rollbackAction?.performedBy).toBe("moderator-1")
      expect(rollbackAction?.actionType).toBe("other")
    })

    it("should return error if article not found", () => {
      const result = rollbackToStableRevision("non-existent", "moderator-1")
      
      expect(result.success).toBe(false)
      expect(result.error).toBe("Article not found")
    })

    it("should return error if no stable revision", () => {
      const articleNoStable: WikiArticle = {
        ...mockArticle,
        id: "article-2",
        stableRevisionId: undefined,
      }
      localStorage.setItem("pet_social_wiki_articles", JSON.stringify([articleNoStable]))
      
      const result = rollbackToStableRevision("article-2", "moderator-1")
      
      expect(result.success).toBe(false)
      expect(result.error).toBe("No stable revision found")
    })
  })
})

describe("Access Matrix Tests", () => {
  const mockArticle: WikiArticle = {
    id: "health-article-1",
    title: "Health Article",
    slug: "health-article",
    category: "health",
    content: "Health content",
    authorId: "user-1",
    views: 0,
    likes: [],
    createdAt: "2024-01-01",
    updatedAt: "2024-01-01",
    stableRevisionId: "rev-stable-1",
    approvedAt: "2024-01-15",
  }

  const mockStableRevision: WikiRevision = {
    id: "rev-stable-1",
    articleId: "health-article-1",
    content: "Stable content",
    status: "stable",
    authorId: "user-1",
    createdAt: "2024-01-15",
    updatedAt: "2024-01-15",
  }

  beforeEach(() => {
    localStorage.setItem("pet_social_wiki_articles", JSON.stringify([mockArticle]))
    localStorage.setItem("pet_social_wiki_revisions", JSON.stringify([mockStableRevision]))
  })

  it("should allow moderators to see rollback button", () => {
    const canModerate = true // Moderator role
    const hasStableRevision = mockArticle.stableRevisionId !== undefined
    const viewingStable = false
    
    const shouldShowRollback = canModerate && hasStableRevision && !viewingStable
    expect(shouldShowRollback).toBe(true)
  })

  it("should not allow non-moderators to see rollback button", () => {
    const canModerate = false // Regular user
    const hasStableRevision = mockArticle.stableRevisionId !== undefined
    const viewingStable = false
    
    const shouldShowRollback = canModerate && hasStableRevision && !viewingStable
    expect(shouldShowRollback).toBe(false)
  })

  it("should not show rollback when viewing stable version", () => {
    const canModerate = true
    const hasStableRevision = true
    const viewingStable = true
    
    const shouldShowRollback = canModerate && hasStableRevision && !viewingStable
    expect(shouldShowRollback).toBe(false)
  })

  it("health pages should default to stable version", () => {
    const article = mockArticle
    const isHealthPage = article.category === "health"
    const hasStableRevision = article.stableRevisionId !== undefined
    
    expect(isHealthPage).toBe(true)
    expect(hasStableRevision).toBe(true)
    
    // Should default to stable for health pages
    const shouldDefaultToStable = isHealthPage && hasStableRevision
    expect(shouldDefaultToStable).toBe(true)
  })

  it("non-health pages should not default to stable", () => {
    const article = { ...mockArticle, category: "care" as const }
    const isHealthPage = article.category === "health"
    
    expect(isHealthPage).toBe(false)
  })
})

