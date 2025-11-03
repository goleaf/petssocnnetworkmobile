import {
  detectStubs,
  detectStaleHealthPages,
  detectOrphanedPages,
  getQualityIssues,
  getQualityDashboardData,
  getIssuesByType,
  getIssuesBySeverity,
} from "../quality-analytics"
import type { WikiArticle } from "@/lib/types"

// Mock storage utilities
jest.mock("../../storage", () => ({
  getAllItems: jest.fn((key: string) => {
    if (key === "wiki_articles") {
      return [
        {
          id: "stub-1",
          title: "Short Article",
          slug: "short-article",
          category: "care",
          content: "Very short content.",
          authorId: "user-1",
          views: 10,
          likes: [],
          createdAt: "2024-01-01T00:00:00.000Z",
          updatedAt: "2024-01-01T00:00:00.000Z",
        },
        {
          id: "full-1",
          title: "Full Article",
          slug: "full-article",
          category: "care",
          content: "This is a full article with comprehensive content.\n\n## Section 1\n\nDetailed information here.\n\n## Section 2\n\nMore detailed content.\n\n## Section 3\n\nEven more content.",
          authorId: "user-1",
          views: 100,
          likes: ["user-2"],
          createdAt: "2024-01-01T00:00:00.000Z",
          updatedAt: "2024-01-01T00:00:00.000Z",
        },
        {
          id: "stale-health-1",
          title: "Stale Health Article",
          slug: "stale-health-article",
          category: "health",
          content: "This is a health article with medical information.\n\n## Symptoms\n\nVarious symptoms.\n\n## Treatment\n\nTreatment information.",
          authorId: "user-1",
          views: 50,
          likes: [],
          tags: ["health", "symptoms", "treatment"],
          createdAt: "2022-01-01T00:00:00.000Z",
          updatedAt: "2022-01-01T00:00:00.000Z",
        },
        {
          id: "current-health-1",
          title: "Current Health Article",
          slug: "current-health-article",
          category: "health",
          content: "This is a current health article.\n\n## Diagnosis\n\nDiagnosis information.",
          authorId: "user-1",
          views: 75,
          likes: ["user-2"],
          tags: ["health", "diagnosis"],
          createdAt: "2023-11-01T00:00:00.000Z",
          updatedAt: "2023-11-01T00:00:00.000Z",
        },
        {
          id: "orphaned-1",
          title: "Orphaned Article",
          slug: "orphaned-article",
          category: "training",
          content: "This article has no related articles or links.",
          authorId: "user-1",
          views: 20,
          likes: [],
          createdAt: "2024-01-01T00:00:00.000Z",
          updatedAt: "2024-01-01T00:00:00.000Z",
        },
        {
          id: "linked-1",
          title: "Linked Article",
          slug: "linked-article",
          category: "care",
          content: "This article is linked.\n\n[[full-article]] Link to full article.",
          authorId: "user-1",
          views: 150,
          likes: ["user-2", "user-3"],
          relatedArticles: ["full-1"],
          createdAt: "2024-01-01T00:00:00.000Z",
          updatedAt: "2024-01-01T00:00:00.000Z",
        },
      ]
    }
    return []
  }),
}))

describe("quality-analytics", () => {
  const mockArticles: WikiArticle[] = [
    {
      id: "stub-1",
      title: "Short Article",
      slug: "short-article",
      category: "care",
      content: "Very short content.",
      authorId: "user-1",
      views: 10,
      likes: [],
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z",
    },
    {
      id: "full-1",
      title: "Full Article",
      slug: "full-article",
      category: "care",
      content:
        "This is a full article with comprehensive content.\n\n## Section 1\n\nDetailed information here.\n\n## Section 2\n\nMore detailed content.\n\n## Section 3\n\nEven more content.",
      authorId: "user-1",
      views: 100,
      likes: ["user-2"],
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z",
    },
    {
      id: "stale-health-1",
      title: "Stale Health Article",
      slug: "stale-health-article",
      category: "health",
      content:
        "This is a health article with medical information.\n\n## Symptoms\n\nVarious symptoms.\n\n## Treatment\n\nTreatment information.",
      authorId: "user-1",
      views: 50,
      likes: [],
      tags: ["health", "symptoms", "treatment"],
      createdAt: "2022-01-01T00:00:00.000Z",
      updatedAt: "2022-01-01T00:00:00.000Z",
    },
  ]

  describe("detectStubs", () => {
    it("detects stub articles with short content", () => {
      const stubs = detectStubs(mockArticles)
      
      expect(stubs.length).toBeGreaterThan(0)
      const stubIssue = stubs.find((s) => s.articleId === "stub-1")
      expect(stubIssue).toBeDefined()
      expect(stubIssue?.type).toBe("stub")
      expect(stubIssue?.severity).toBe("high")
    })

    it("does not flag full articles as stubs", () => {
      const stubs = detectStubs(mockArticles)
      
      const fullArticleStub = stubs.find((s) => s.articleId === "full-1")
      expect(fullArticleStub).toBeUndefined()
    })

    it("assigns severity based on content length", () => {
      const veryShortArticle = {
        ...mockArticles[0],
        content: "Short.",
      }
      const stubs = detectStubs([veryShortArticle])
      
      expect(stubs[0]?.severity).toBe("high")
    })
  })

  describe("detectStaleHealthPages", () => {
    it("detects health pages not updated in over 12 months", () => {
      const stale = detectStaleHealthPages(mockArticles)
      
      expect(stale.length).toBeGreaterThan(0)
      const staleIssue = stale.find((s) => s.articleId === "stale-health-1")
      expect(staleIssue).toBeDefined()
      expect(staleIssue?.type).toBe("stale_health")
    })

    it("does not flag recently updated health articles", () => {
      const recentArticles: WikiArticle[] = [
        {
          ...mockArticles[0],
          id: "current-health",
          category: "health",
          content: "Current health info.",
          tags: ["health", "medical"],
          updatedAt: new Date().toISOString(),
        },
      ]
      
      const stale = detectStaleHealthPages(recentArticles)
      expect(stale.length).toBe(0)
    })

    it("assigns higher severity for older updates", () => {
      const veryOldArticle: WikiArticle[] = [
        {
          ...mockArticles[0],
          id: "very-old-health",
          category: "health",
          content: "Old health info.",
          tags: ["health"],
          updatedAt: new Date(Date.now() - 25 * 30 * 24 * 60 * 60 * 1000).toISOString(), // ~25 months
        },
      ]
      
      const stale = detectStaleHealthPages(veryOldArticle)
      expect(stale[0]?.severity).toBe("high")
    })
  })

  describe("detectOrphanedPages", () => {
    it("detects orphaned pages with no links", () => {
      const orphaned = detectOrphanedPages(mockArticles)
      
      expect(orphaned.length).toBeGreaterThan(0)
      const orphanedIssue = orphaned.find((s) => s.articleSlug === "short-article")
      expect(orphanedIssue).toBeDefined()
      expect(orphanedIssue?.type).toBe("orphaned")
    })

    it("does not flag linked articles", () => {
      const linkedArticles: WikiArticle[] = [
        {
          ...mockArticles[0],
          id: "linked-article",
          slug: "linked",
          relatedArticles: ["other-article"],
        },
      ]
      
      const orphaned = detectOrphanedPages(linkedArticles)
      const linkedIssue = orphaned.find((s) => s.articleSlug === "linked")
      expect(linkedIssue).toBeUndefined()
    })

    it("counts wiki links in content", () => {
      const linkedContentArticles: WikiArticle[] = [
        {
          ...mockArticles[0],
          id: "wiki-linked",
          slug: "wiki-linked",
          content: "This article has [[another-article]] link.",
        },
      ]
      
      const orphaned = detectOrphanedPages(linkedContentArticles)
      const linkedIssue = orphaned.find((s) => s.articleSlug === "wiki-linked")
      expect(linkedIssue).toBeUndefined()
    })
  })

  describe("getQualityIssues", () => {
    it("returns all types of issues", () => {
      const issues = getQualityIssues()
      
      expect(issues.length).toBeGreaterThan(0)
      expect(issues.some((i) => i.type === "stub")).toBe(true)
      expect(issues.some((i) => i.type === "stale_health")).toBe(true)
      expect(issues.some((i) => i.type === "orphaned")).toBe(true)
    })
  })

  describe("getQualityDashboardData", () => {
    it("returns comprehensive dashboard data", () => {
      const data = getQualityDashboardData()
      
      expect(data.totalArticles).toBeGreaterThan(0)
      expect(data.stubs).toBeGreaterThanOrEqual(0)
      expect(data.staleHealthPages).toBeGreaterThanOrEqual(0)
      expect(data.orphanedPages).toBeGreaterThanOrEqual(0)
      expect(data.totalIssues).toBeGreaterThanOrEqual(0)
      expect(data.healthScore).toBeGreaterThanOrEqual(0)
      expect(data.healthScore).toBeLessThanOrEqual(100)
    })

    it("calculates health score correctly", () => {
      const data = getQualityDashboardData()
      
      // Health score should decrease with more issues
      expect(data.healthScore).toBeDefined()
      expect(typeof data.healthScore).toBe("number")
    })

    it("counts issues by severity", () => {
      const data = getQualityDashboardData()
      
      expect(data.issuesBySeverity.low).toBeGreaterThanOrEqual(0)
      expect(data.issuesBySeverity.medium).toBeGreaterThanOrEqual(0)
      expect(data.issuesBySeverity.high).toBeGreaterThanOrEqual(0)
    })
  })

  describe("getIssuesByType", () => {
    it("filters issues by type", () => {
      const stubIssues = getIssuesByType("stub")
      const staleIssues = getIssuesByType("stale_health")
      
      expect(stubIssues.every((i) => i.type === "stub")).toBe(true)
      expect(staleIssues.every((i) => i.type === "stale_health")).toBe(true)
    })
  })

  describe("getIssuesBySeverity", () => {
    it("filters issues by severity", () => {
      const highIssues = getIssuesBySeverity("high")
      const mediumIssues = getIssuesBySeverity("medium")
      
      expect(highIssues.every((i) => i.severity === "high")).toBe(true)
      expect(mediumIssues.every((i) => i.severity === "medium")).toBe(true)
    })
  })
})

