import {
  getBreedSummary,
  extractBreedSummary,
  getCareChecklist,
  extractChecklistItems,
} from "../utils/wiki-pet-helpers"
import type { Pet, WikiArticle } from "../types"
import { getWikiArticles, updateWikiArticle } from "../storage"
import { invalidateCache } from "../cache"

// Mock localStorage
const mockLocalStorage = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString()
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
})()

Object.defineProperty(window, "localStorage", {
  value: mockLocalStorage,
})

describe("wiki-pet-helpers", () => {
  beforeEach(() => {
    mockLocalStorage.clear()
    // Initialize with mock wiki articles
    const mockArticles: WikiArticle[] = [
      {
        id: "1",
        title: "Golden Retriever Breed Guide",
        slug: "golden-retriever-guide",
        category: "breeds",
        subcategory: "dog-breeds",
        species: ["dog"],
        content: `# Golden Retriever Breed Guide

## Overview
Golden Retrievers are friendly, intelligent dogs known for their loyalty and gentle nature. They are medium to large-sized dogs that make excellent family pets.

## Characteristics
- Friendly and outgoing
- Intelligent and eager to please
- Requires regular exercise
- Great with children`,
        authorId: "1",
        views: 1000,
        likes: [],
        createdAt: "2024-01-01",
        updatedAt: "2024-01-01",
      },
      {
        id: "2",
        title: "Dog Care Essentials",
        slug: "dog-care-essentials",
        category: "care",
        subcategory: "daily-care",
        species: ["dog"],
        content: `# Dog Care Essentials

Daily care tasks include:
- Regular feeding schedule
- Daily exercise
- Grooming and brushing
- Health checkups
- Training sessions`,
        authorId: "1",
        views: 500,
        likes: [],
        createdAt: "2024-01-01",
        updatedAt: "2024-01-01",
      },
    ]

    window.localStorage.setItem("pet_social_wiki_articles", JSON.stringify(mockArticles))
  })

  describe("getBreedSummary", () => {
    it("should return breed article when pet has matching breed", () => {
      const pet: Pet = {
        id: "pet1",
        ownerId: "user1",
        name: "Buddy",
        species: "dog",
        breed: "Golden Retriever",
        followers: [],
      }

      const result = getBreedSummary(pet)
      expect(result).not.toBeNull()
      expect(result?.title).toBe("Golden Retriever Breed Guide")
    })

    it("should return null when pet has no breed", () => {
      const pet: Pet = {
        id: "pet1",
        ownerId: "user1",
        name: "Buddy",
        species: "dog",
        followers: [],
      }

      const result = getBreedSummary(pet)
      expect(result).toBeNull()
    })

    it("should return null when no matching breed article exists", () => {
      const pet: Pet = {
        id: "pet1",
        ownerId: "user1",
        name: "Buddy",
        species: "dog",
        breed: "Unknown Breed",
        followers: [],
      }

      const result = getBreedSummary(pet)
      expect(result).toBeNull()
    })
  })

  describe("extractBreedSummary", () => {
    it("should extract summary from article content", () => {
      const article: WikiArticle = {
        id: "1",
        title: "Test Breed",
        slug: "test-breed",
        category: "breeds",
        content: "This is a test breed description that contains useful information about the breed characteristics and temperament.",
        authorId: "1",
        views: 100,
        likes: [],
        createdAt: "2024-01-01",
        updatedAt: "2024-01-01",
      }

      const summary = extractBreedSummary(article)
      expect(summary).toContain("test breed")
      expect(summary.length).toBeLessThanOrEqual(300)
    })

    it("should handle articles with markdown headers", () => {
      const article: WikiArticle = {
        id: "1",
        title: "Test Breed",
        slug: "test-breed",
        category: "breeds",
        content: "# Header\n\nThis is the actual content that should be extracted.",
        authorId: "1",
        views: 100,
        likes: [],
        createdAt: "2024-01-01",
        updatedAt: "2024-01-01",
      }

      const summary = extractBreedSummary(article)
      expect(summary).toContain("actual content")
      expect(summary).not.toContain("# Header")
    })
  })

  describe("getCareChecklist", () => {
    it("should return care articles filtered by pet species", () => {
      const pet: Pet = {
        id: "pet1",
        ownerId: "user1",
        name: "Buddy",
        species: "dog",
        followers: [],
      }

      const result = getCareChecklist(pet)
      expect(result.length).toBeGreaterThan(0)
      expect(result[0].category).toBe("care")
    })

    it("should return empty array when no care articles exist", () => {
      mockLocalStorage.clear()
      window.localStorage.setItem("pet_social_wiki_articles", JSON.stringify([]))

      const pet: Pet = {
        id: "pet1",
        ownerId: "user1",
        name: "Buddy",
        species: "dog",
        followers: [],
      }

      const result = getCareChecklist(pet)
      expect(result).toEqual([])
    })

    it("should limit results to 5 articles", () => {
      // Add more care articles
      const existingArticles = JSON.parse(
        window.localStorage.getItem("pet_social_wiki_articles") || "[]"
      ) as WikiArticle[]

      const additionalArticles: WikiArticle[] = Array.from({ length: 10 }, (_, i) => ({
        id: `care-${i + 3}`,
        title: `Care Article ${i + 3}`,
        slug: `care-article-${i + 3}`,
        category: "care",
        species: ["dog"],
        content: "Test content",
        authorId: "1",
        views: 100 - i,
        likes: [],
        createdAt: "2024-01-01",
        updatedAt: "2024-01-01",
      }))

      window.localStorage.setItem(
        "pet_social_wiki_articles",
        JSON.stringify([...existingArticles, ...additionalArticles])
      )

      const pet: Pet = {
        id: "pet1",
        ownerId: "user1",
        name: "Buddy",
        species: "dog",
        followers: [],
      }

      const result = getCareChecklist(pet)
      expect(result.length).toBeLessThanOrEqual(5)
    })
  })

  describe("extractChecklistItems", () => {
    it("should extract checklist items from markdown list", () => {
      const article: WikiArticle = {
        id: "1",
        title: "Care Guide",
        slug: "care-guide",
        category: "care",
        content: `# Care Guide

Daily tasks:
- Feed twice daily
- Exercise for 30 minutes
- Brush coat weekly
- Check health daily`,
        authorId: "1",
        views: 100,
        likes: [],
        createdAt: "2024-01-01",
        updatedAt: "2024-01-01",
      }

      const items = extractChecklistItems(article)
      expect(items.length).toBeGreaterThan(0)
      expect(items[0]).toContain("Feed twice daily")
    })

    it("should extract numbered list items", () => {
      const article: WikiArticle = {
        id: "1",
        title: "Care Guide",
        slug: "care-guide",
        category: "care",
        content: `# Care Guide

1. First task
2. Second task
3. Third task`,
        authorId: "1",
        views: 100,
        likes: [],
        createdAt: "2024-01-01",
        updatedAt: "2024-01-01",
      }

      const items = extractChecklistItems(article)
      expect(items.length).toBeGreaterThan(0)
      expect(items[0]).toContain("First task")
    })

    it("should limit items to maxItems parameter", () => {
      const article: WikiArticle = {
        id: "1",
        title: "Care Guide",
        slug: "care-guide",
        category: "care",
        content: `# Care Guide

- Item 1
- Item 2
- Item 3
- Item 4
- Item 5
- Item 6
- Item 7`,
        authorId: "1",
        views: 100,
        likes: [],
        createdAt: "2024-01-01",
        updatedAt: "2024-01-01",
      }

      const items = extractChecklistItems(article, 3)
      expect(items.length).toBeLessThanOrEqual(3)
    })
  })
})

describe("Cache Invalidation", () => {
  beforeEach(() => {
    mockLocalStorage.clear()
    // Initialize cache version
    window.localStorage.setItem("pet_social_cache_version", "1")
  })

  it("should invalidate cache when breed article is updated", () => {
    // Set initial cache version
    window.localStorage.setItem("pet_social_cache_version", "1")
    const initialCacheVersion = parseInt(window.localStorage.getItem("pet_social_cache_version") || "1", 10)

    const breedArticle: WikiArticle = {
      id: "breed-1",
      title: "Golden Retriever Guide",
      slug: "golden-retriever-guide",
      category: "breeds",
      content: "Original content",
      authorId: "1",
      views: 100,
      likes: [],
      createdAt: "2024-01-01",
      updatedAt: "2024-01-01",
    }

    // Initialize articles with the breed article
    window.localStorage.setItem("pet_social_wiki_articles", JSON.stringify([breedArticle]))

    // Verify article exists
    const articlesBefore = getWikiArticles()
    expect(articlesBefore.length).toBe(1)
    expect(articlesBefore[0].id).toBe("breed-1")

    // Update the breed article
    const updatedArticle = { ...breedArticle, content: "Updated content", updatedAt: "2024-01-02" }
    updateWikiArticle(updatedArticle)

    // Verify article was updated
    const articlesAfter = getWikiArticles()
    expect(articlesAfter.length).toBe(1)
    expect(articlesAfter[0].content).toBe("Updated content")
    expect(articlesAfter[0].category).toBe("breeds")

    // Check that cache version was incremented (cache should be invalidated for breed articles)
    const newCacheVersion = parseInt(window.localStorage.getItem("pet_social_cache_version") || "1", 10)
    // Note: If cache invalidation isn't working, this will fail
    // But we verify the article update worked, so the function is executing
    expect(newCacheVersion).toBeGreaterThan(initialCacheVersion)
  })

  it("should not invalidate cache when non-breed article is updated", () => {
    const initialCacheVersion = parseInt(window.localStorage.getItem("pet_social_cache_version") || "1", 10)

    const careArticle: WikiArticle = {
      id: "1",
      title: "Care Guide",
      slug: "care-guide",
      category: "care",
      content: "Original content",
      authorId: "1",
      views: 100,
      likes: [],
      createdAt: "2024-01-01",
      updatedAt: "2024-01-01",
    }

    // Initialize articles
    window.localStorage.setItem("pet_social_wiki_articles", JSON.stringify([careArticle]))

    // Update the care article
    const updatedArticle = { ...careArticle, content: "Updated content", updatedAt: "2024-01-02" }
    updateWikiArticle(updatedArticle)

    // Check that cache version was NOT incremented
    const newCacheVersion = parseInt(window.localStorage.getItem("pet_social_cache_version") || "1", 10)
    expect(newCacheVersion).toBe(initialCacheVersion)
  })
})

