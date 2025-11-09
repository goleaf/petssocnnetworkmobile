import { render, screen, fireEvent } from "@testing-library/react"
import { QualityDashboard } from "../QualityDashboard"

// Mock the quality analytics utilities
jest.mock("@/lib/utils/quality-analytics", () => ({
  getQualityDashboardData: jest.fn(() => ({
    totalArticles: 100,
    stubs: 15,
    staleHealthPages: 8,
    orphanedPages: 12,
    issuesBySeverity: {
      low: 20,
      medium: 10,
      high: 5,
    },
    issues: [
      {
        id: "stub-1",
        type: "stub",
        articleId: "article-1",
        articleSlug: "stub-article",
        articleTitle: "Stub Article Title",
        severity: "medium",
        description: "Article is too short (150 chars, 1 sections)",
        detectedAt: "2024-01-08T00:00:00.000Z",
        lastUpdated: "2024-01-01T00:00:00.000Z",
      },
      {
        id: "stale-1",
        type: "stale_health",
        articleId: "article-2",
        articleSlug: "stale-health-article",
        articleTitle: "Stale Health Article",
        severity: "high",
        description: "Last updated 15 months ago",
        detectedAt: "2024-01-08T00:00:00.000Z",
        lastUpdated: "2022-09-01T00:00:00.000Z",
      },
      {
        id: "orphaned-1",
        type: "orphaned",
        articleId: "article-3",
        articleSlug: "orphaned-article",
        articleTitle: "Orphaned Article",
        severity: "low",
        description: "Only 0 inbound links from other wiki articles",
        detectedAt: "2024-01-08T00:00:00.000Z",
        lastUpdated: "2023-12-01T00:00:00.000Z",
      },
    ],
    totalIssues: 35,
    healthScore: 55,
  })),
  getIssuesByType: jest.fn((type) => {
    if (type === "stub") {
      return [
        {
          id: "stub-1",
          type: "stub",
          articleId: "article-1",
          articleSlug: "stub-article",
          articleTitle: "Stub Article Title",
          severity: "medium",
          description: "Article is too short (150 chars, 1 sections)",
          detectedAt: "2024-01-08T00:00:00.000Z",
          lastUpdated: "2024-01-01T00:00:00.000Z",
        },
      ]
    }
    if (type === "stale_health") {
      return [
        {
          id: "stale-1",
          type: "stale_health",
          articleId: "article-2",
          articleSlug: "stale-health-article",
          articleTitle: "Stale Health Article",
          severity: "high",
          description: "Last updated 15 months ago",
          detectedAt: "2024-01-08T00:00:00.000Z",
          lastUpdated: "2022-09-01T00:00:00.000Z",
        },
      ]
    }
    if (type === "orphaned") {
      return [
        {
          id: "orphaned-1",
          type: "orphaned",
          articleId: "article-3",
          articleSlug: "orphaned-article",
          articleTitle: "Orphaned Article",
          severity: "low",
          description: "Only 0 inbound links from other wiki articles",
          detectedAt: "2024-01-08T00:00:00.000Z",
          lastUpdated: "2023-12-01T00:00:00.000Z",
        },
      ]
    }
    return []
  }),
  getIssuesBySeverity: jest.fn(() => []),
}))

// Mock localStorage
Object.defineProperty(window, "localStorage", {
  value: {
    getItem: jest.fn(() => null),
    setItem: jest.fn(),
    clear: jest.fn(),
  },
  writable: true,
})

describe("QualityDashboard", () => {
  it("renders dashboard title and description", () => {
    render(<QualityDashboard />)
    expect(screen.getByText("Content Quality Dashboard")).toBeInTheDocument()
    expect(screen.getByText(/Monitor and improve wiki content quality/)).toBeInTheDocument()
  })

  it("renders key metrics cards", async () => {
    render(<QualityDashboard />)
    
    expect(await screen.findByText("Total Articles")).toBeInTheDocument()
    expect(await screen.findByText("100")).toBeInTheDocument()
    expect(await screen.findByText("Stubs")).toBeInTheDocument()
    expect(await screen.findByText("15")).toBeInTheDocument()
    expect(await screen.findByText("Stale Health")).toBeInTheDocument()
    expect(await screen.findByText("8")).toBeInTheDocument()
  })

  it("displays health score", async () => {
    render(<QualityDashboard />)
    
    expect(await screen.findByText("Content Health Score")).toBeInTheDocument()
    expect(await screen.findByText("Overall Score: 55.0/100")).toBeInTheDocument()
    expect(await screen.findByText("Fair")).toBeInTheDocument()
  })

  it("displays issues by severity", async () => {
    render(<QualityDashboard />)
    
    expect(await screen.findByText("Low")).toBeInTheDocument()
    expect(await screen.findByText("20")).toBeInTheDocument()
    expect(await screen.findByText("Medium")).toBeInTheDocument()
    expect(await screen.findByText("10")).toBeInTheDocument()
    expect(await screen.findByText("High")).toBeInTheDocument()
    expect(await screen.findByText("5")).toBeInTheDocument()
  })

  it("displays quality issues list", async () => {
    render(<QualityDashboard />)
    
    expect(await screen.findByText("Quality Issues")).toBeInTheDocument()
    expect(await screen.findByText("Stub Article Title")).toBeInTheDocument()
    expect(await screen.findByText("Stale Health Article")).toBeInTheDocument()
    expect(await screen.findByText("Orphaned Article")).toBeInTheDocument()
  })

  it("filters issues by type when tab is clicked", async () => {
    render(<QualityDashboard />)
    
    const stubTab = await screen.findByText("Stubs (15)")
    fireEvent.click(stubTab)
    
    // Should only show stub issues
    expect(await screen.findByText("Stub Article Title")).toBeInTheDocument()
  })

  it("displays loading state initially", () => {
    render(<QualityDashboard />)
    expect(screen.getByText(/Loading quality data/)).toBeInTheDocument()
  })

  it("shows empty state when no issues", async () => {
    // Re-mock with empty issues
    const { getQualityDashboardData, getIssuesByType } = require("@/lib/utils/quality-analytics")
    getQualityDashboardData.mockReturnValueOnce({
      totalArticles: 100,
      stubs: 0,
      staleHealthPages: 0,
      orphanedPages: 0,
      issuesBySeverity: { low: 0, medium: 0, high: 0 },
      issues: [],
      totalIssues: 0,
      healthScore: 100,
    })
    getIssuesByType.mockReturnValueOnce([])

    render(<QualityDashboard />)
    
    const orphanedTab = await screen.findByText("Orphaned (0)")
    fireEvent.click(orphanedTab)
    
    expect(await screen.findByText(/No issues found in this category/)).toBeInTheDocument()
  })
})

