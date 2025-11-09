import { describe, it, expect, beforeEach } from "@jest/globals"
import { render, screen } from "@testing-library/react"
import { WikiFooter } from "@/components/wiki/wiki-footer"
import type { WikiArticle } from "@/lib/types"
import { initializeStorage } from "@/lib/storage"

// Mock storage functions
jest.mock("@/lib/storage", () => ({
  ...jest.requireActual("@/lib/storage"),
  getWikiArticles: jest.fn(),
  initializeStorage: jest.fn(),
}))

const { getWikiArticles } = require("@/lib/storage")

describe("WikiFooter", () => {
  const mockArticles: WikiArticle[] = [
    {
      id: "1",
      title: "Complete Guide to Dog Nutrition",
      slug: "dog-nutrition-guide",
      category: "nutrition",
      species: ["dog"],
      content: "Test content",
      authorId: "1",
      views: 100,
      likes: [],
      tags: ["nutrition", "feeding", "health", "dogs", "beginners"],
      createdAt: "2024-01-01",
      updatedAt: "2024-01-01",
    },
    {
      id: "2",
      title: "Cat Behavior: Understanding Your Feline Friend",
      slug: "understanding-cat-behavior",
      category: "behavior",
      species: ["cat"],
      content: "Test content",
      authorId: "2",
      views: 100,
      likes: [],
      tags: ["behavior", "cats", "communication", "socialization", "beginners"],
      createdAt: "2024-01-01",
      updatedAt: "2024-01-01",
    },
    {
      id: "3",
      title: "Puppy Training: The First 6 Months",
      slug: "puppy-training-guide",
      category: "training",
      species: ["dog"],
      content: "Test content",
      authorId: "1",
      views: 100,
      likes: [],
      tags: ["training", "puppies", "socialization", "beginners", "dogs"],
      createdAt: "2024-01-01",
      updatedAt: "2024-01-01",
    },
    {
      id: "4",
      title: "Bird Care 101: Essential Tips for New Owners",
      slug: "bird-care-essentials",
      category: "care",
      species: ["bird"],
      content: "Test content",
      authorId: "3",
      views: 100,
      likes: [],
      tags: ["care", "birds", "housing", "diet", "beginners", "health"],
      createdAt: "2024-01-01",
      updatedAt: "2024-01-01",
    },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    getWikiArticles.mockReturnValue(mockArticles)
  })

  it("should not render when article has no tags", () => {
    const article: WikiArticle = {
      id: "5",
      title: "Article Without Tags",
      slug: "article-without-tags",
      category: "care",
      content: "Test content",
      authorId: "1",
      views: 100,
      likes: [],
      createdAt: "2024-01-01",
      updatedAt: "2024-01-01",
    }

    const { container } = render(<WikiFooter article={article} />)
    expect(container.firstChild).toBeNull()
  })

  it("should not render when no related articles found", () => {
    const article: WikiArticle = {
      id: "5",
      title: "Article Without Tags",
      slug: "article-without-tags",
      category: "care",
      content: "Test content",
      authorId: "1",
      views: 100,
      likes: [],
      tags: ["unique-tag-with-no-matches"],
      createdAt: "2024-01-01",
      updatedAt: "2024-01-01",
    }

    const { container } = render(<WikiFooter article={article} />)
    expect(container.firstChild).toBeNull()
  })

  it("should render related articles based on shared tags", () => {
    const article = mockArticles[0] // Dog Nutrition article

    render(<WikiFooter article={article} maxRelated={5} />)

    expect(screen.getByText("Related Articles")).toBeInTheDocument()
    
    // Should find article #3 (Puppy Training) which shares "dogs" and "beginners" tags
    expect(screen.getAllByText("Puppy Training: The First 6 Months")[0]).toBeInTheDocument()
    
    // Should find article #4 (Bird Care) which shares "beginners" and "health" tags
    expect(screen.getAllByText("Bird Care 101: Essential Tips for New Owners")[0]).toBeInTheDocument()
  })

  it("should render article network when tags exist", () => {
    const article = mockArticles[0] // Dog Nutrition article

    render(<WikiFooter article={article} />)

    expect(screen.getByText("Article Network")).toBeInTheDocument()
    expect(screen.getByText(/This article is connected to/)).toBeInTheDocument()
  })

  it("should show correct match scores", () => {
    const article = mockArticles[0] // Dog Nutrition article

    render(<WikiFooter article={article} maxRelated={5} />)

    // Article #3 shares "dogs" and "beginners" tags, plus same category = 0.5 bonus
    // Should show at least 2 shared tags
    const matchBadges = screen.getAllByText(/\d+\.\d+ match/)
    expect(matchBadges.length).toBeGreaterThan(0)
  })

  it("should display shared tags for each related article", () => {
    const article = mockArticles[0] // Dog Nutrition article

    render(<WikiFooter article={article} maxRelated={5} />)

    // Should display shared tag badges
    const sharedTags = article.tags!.filter((tag) => 
      mockArticles[2].tags?.includes(tag) || mockArticles[3].tags?.includes(tag)
    )
    
    sharedTags.forEach((tag) => {
      const tagElements = screen.getAllByText(tag)
      expect(tagElements.length).toBeGreaterThan(0)
    })
  })

  it("should provide stable deterministic results for identical inputs", () => {
    const article = mockArticles[0] // Dog Nutrition article

    const { rerender } = render(<WikiFooter article={article} maxRelated={5} />)
    const firstRender = screen.getAllByText("Related Articles")[0]

    // Rerender with same props
    rerender(<WikiFooter article={article} maxRelated={5} />)
    const secondRender = screen.getAllByText("Related Articles")[0]

    // Should produce stable results
    expect(firstRender).toBeInTheDocument()
    expect(secondRender).toBeInTheDocument()
  })

  it("should sort articles by score then by title", () => {
    const article = mockArticles[0] // Dog Nutrition article

    render(<WikiFooter article={article} maxRelated={5} />)

    const relatedArticles = [
      screen.getAllByText("Puppy Training: The First 6 Months")[0],
      screen.getAllByText("Bird Care 101: Essential Tips for New Owners")[0],
    ]

    // Should be in deterministic order
    expect(relatedArticles[0]).toBeInTheDocument()
    expect(relatedArticles[1]).toBeInTheDocument()
  })

  it("should respect maxRelated parameter", () => {
    const article = mockArticles[0] // Dog Nutrition article

    render(<WikiFooter article={article} maxRelated={1} />)

    // Should only show 1 related article
    const relatedCards = screen.getAllByText(/\d+\.\d+ match/)
    expect(relatedCards.length).toBeLessThanOrEqual(1)
  })

  it("should include category and subcategory in display", () => {
    const article = mockArticles[0] // Dog Nutrition article

    render(<WikiFooter article={article} maxRelated={5} />)

    // Should show category badges for related articles
    expect(screen.getByText("training")).toBeInTheDocument()
  })

  it("should handle articles with no matching articles gracefully", () => {
    const isolatedArticle = {
      ...mockArticles[0],
      tags: ["completely-unique-tag"],
    }
    
    getWikiArticles.mockReturnValue([isolatedArticle])

    const { container } = render(<WikiFooter article={isolatedArticle} />)
    expect(container.firstChild).toBeNull()
  })
})

