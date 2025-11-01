/**
 * Tests for translation utilities
 * Tests fallback logic, RTL detection, and translation retrieval
 */

import {
  getTranslatedContent,
  getTranslatedTitle,
  getTranslatedContentBlocks,
  isRTL,
  getBaseLanguage,
  generateDiff,
  isTranslationIncomplete,
  getTranslationProgress,
} from "../utils/translations"
import type { WikiArticle, WikiTranslation } from "../types"
import {
  getWikiTranslationsByArticleId,
  createWikiTranslation,
  getWikiTranslationByArticleIdAndLang,
} from "../storage"

// Mock the storage functions
jest.mock("../storage", () => ({
  getWikiTranslationsByArticleId: jest.fn(),
  createWikiTranslation: jest.fn(),
  getWikiTranslationByArticleIdAndLang: jest.fn(),
  updateWikiTranslation: jest.fn(),
  deleteWikiTranslation: jest.fn(),
}))

describe("Translation Utilities", () => {
  const mockArticle: WikiArticle = {
    id: "article-1",
    title: "Dog Care Guide",
    slug: "dog-care-guide",
    category: "care",
    content: "# Introduction\n\nThis is a guide about dogs.\n\n## Feeding\n\nFeed your dog twice a day.",
    authorId: "user-1",
    views: 100,
    likes: [],
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
    baseLanguage: "en",
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("isRTL", () => {
    it("should return true for RTL languages", () => {
      expect(isRTL("ar")).toBe(true)
      expect(isRTL("he")).toBe(true)
      expect(isRTL("fa")).toBe(true)
      expect(isRTL("ur")).toBe(true)
    })

    it("should return false for LTR languages", () => {
      expect(isRTL("en")).toBe(false)
      expect(isRTL("es")).toBe(false)
      expect(isRTL("fr")).toBe(false)
      expect(isRTL("de")).toBe(false)
    })

    it("should handle case-insensitive input", () => {
      expect(isRTL("AR")).toBe(true)
      expect(isRTL("He")).toBe(true)
    })
  })

  describe("getBaseLanguage", () => {
    it("should return the article's base language", () => {
      expect(getBaseLanguage(mockArticle)).toBe("en")
    })

    it("should default to 'en' when baseLanguage is not set", () => {
      const articleWithoutLang = { ...mockArticle, baseLanguage: undefined }
      expect(getBaseLanguage(articleWithoutLang)).toBe("en")
    })
  })

  describe("getTranslatedContent", () => {
    it("should return original content when requesting base language", () => {
      const result = getTranslatedContent(mockArticle, "en")
      expect(result.title).toBe(mockArticle.title)
      expect(result.content).toBe(mockArticle.content)
      expect(result.isTranslated).toBe(false)
    })

    it("should fallback to base when translation is missing", () => {
      ;(getWikiTranslationByArticleIdAndLang as jest.Mock).mockReturnValue(undefined)

      const result = getTranslatedContent(mockArticle, "es")
      expect(result.title).toBe(mockArticle.title)
      expect(result.content).toBe(mockArticle.content)
      expect(result.isTranslated).toBe(false)
    })

    it("should return translated content when published translation exists", () => {
      const mockTranslation: WikiTranslation = {
        id: "trans-1",
        articleId: mockArticle.id,
        languageCode: "es",
        title: "Guía de Cuidado para Perros",
        content: "# Introducción\n\nEsta es una guía sobre perros.",
        status: "published",
        createdAt: "2024-01-02T00:00:00Z",
        updatedAt: "2024-01-02T00:00:00Z",
      }

      ;(getWikiTranslationByArticleIdAndLang as jest.Mock).mockReturnValue(mockTranslation)

      const result = getTranslatedContent(mockArticle, "es")
      expect(result.title).toBe("Guía de Cuidado para Perros")
      expect(result.content).toBe("# Introducción\n\nEsta es una guía sobre perros.")
      expect(result.isTranslated).toBe(true)
    })

    it("should fallback to base when translation status is not published", () => {
      const mockTranslation: WikiTranslation = {
        id: "trans-1",
        articleId: mockArticle.id,
        languageCode: "es",
        title: "Guía de Cuidado para Perros",
        content: "# Introducción",
        status: "draft",
        createdAt: "2024-01-02T00:00:00Z",
        updatedAt: "2024-01-02T00:00:00Z",
      }

      ;(getWikiTranslationByArticleIdAndLang as jest.Mock).mockReturnValue(mockTranslation)

      const result = getTranslatedContent(mockArticle, "es")
      expect(result.title).toBe(mockArticle.title)
      expect(result.content).toBe(mockArticle.content)
      expect(result.isTranslated).toBe(false)
    })

    it("should handle partial translations with fallback", () => {
      const mockTranslation: WikiTranslation = {
        id: "trans-1",
        articleId: mockArticle.id,
        languageCode: "es",
        title: "Guía de Cuidado para Perros",
        content: undefined, // Missing content
        status: "published",
        createdAt: "2024-01-02T00:00:00Z",
        updatedAt: "2024-01-02T00:00:00Z",
      }

      ;(getWikiTranslationByArticleIdAndLang as jest.Mock).mockReturnValue(mockTranslation)

      const result = getTranslatedContent(mockArticle, "es")
      expect(result.title).toBe("Guía de Cuidado para Perros")
      expect(result.content).toBe(mockArticle.content) // Falls back to base
      expect(result.isTranslated).toBe(true)
    })

    it("should detect RTL correctly for Arabic", () => {
      const result = getTranslatedContent(mockArticle, "ar")
      expect(result.isRTL).toBe(true)
    })

    it("should detect RTL correctly for Hebrew", () => {
      const result = getTranslatedContent(mockArticle, "he")
      expect(result.isRTL).toBe(true)
    })
  })

  describe("getTranslatedTitle", () => {
    it("should return original title when requesting base language", () => {
      expect(getTranslatedTitle(mockArticle, "en")).toBe(mockArticle.title)
    })

    it("should return translated title when available", () => {
      const mockTranslation: WikiTranslation = {
        id: "trans-1",
        articleId: mockArticle.id,
        languageCode: "es",
        title: "Guía de Cuidado para Perros",
        content: "Content",
        status: "published",
        createdAt: "2024-01-02T00:00:00Z",
        updatedAt: "2024-01-02T00:00:00Z",
      }

      ;(getWikiTranslationByArticleIdAndLang as jest.Mock).mockReturnValue(mockTranslation)
      expect(getTranslatedTitle(mockArticle, "es")).toBe("Guía de Cuidado para Perros")
    })

    it("should fallback to base title when translation is missing", () => {
      ;(getWikiTranslationByArticleIdAndLang as jest.Mock).mockReturnValue(undefined)
      expect(getTranslatedTitle(mockArticle, "es")).toBe(mockArticle.title)
    })
  })

  describe("getTranslatedContentBlocks", () => {
    it("should return blocks with original content for base language", () => {
      const blocks = getTranslatedContentBlocks(mockArticle, "en")
      expect(blocks.length).toBeGreaterThan(0)
      expect(blocks[0].original).toBeTruthy()
      expect(blocks[0].translated).toBe(null)
      expect(blocks[0].isMissing).toBe(false)
    })

    it("should mark blocks as missing when translation doesn't exist", () => {
      ;(getWikiTranslationByArticleIdAndLang as jest.Mock).mockReturnValue(undefined)

      const blocks = getTranslatedContentBlocks(mockArticle, "es")
      expect(blocks.every((b) => b.isMissing)).toBe(true)
    })

    it("should return translated blocks when available", () => {
      const mockTranslation: WikiTranslation = {
        id: "trans-1",
        articleId: mockArticle.id,
        languageCode: "es",
        content: "# Introducción\n\nEsta es una guía sobre perros.",
        status: "published",
        createdAt: "2024-01-02T00:00:00Z",
        updatedAt: "2024-01-02T00:00:00Z",
      }

      ;(getWikiTranslationByArticleIdAndLang as jest.Mock).mockReturnValue(mockTranslation)

      const blocks = getTranslatedContentBlocks(mockArticle, "es")
      expect(blocks.some((b) => b.translated !== null)).toBe(true)
    })
  })

  describe("generateDiff", () => {
    it("should generate diff for identical texts", () => {
      const diff = generateDiff("Hello\nWorld", "Hello\nWorld")
      expect(diff.every((d) => d.type === "unchanged")).toBe(true)
    })

    it("should detect added lines", () => {
      const diff = generateDiff("Hello", "Hello\nWorld")
      const addedLines = diff.filter((d) => d.type === "added")
      expect(addedLines.length).toBeGreaterThan(0)
    })

    it("should detect removed lines", () => {
      const diff = generateDiff("Hello\nWorld", "Hello")
      const removedLines = diff.filter((d) => d.type === "removed")
      expect(removedLines.length).toBeGreaterThan(0)
    })

    it("should detect changed lines", () => {
      const diff = generateDiff("Hello\nOld", "Hello\nNew")
      const changedLines = diff.filter((d) => d.type !== "unchanged")
      expect(changedLines.length).toBeGreaterThan(0)
    })
  })

  describe("isTranslationIncomplete", () => {
    it("should return true when translation is null", () => {
      expect(isTranslationIncomplete(mockArticle, null)).toBe(true)
    })

    it("should return true when translation has fewer blocks", () => {
      const incompleteTranslation: WikiTranslation = {
        id: "trans-1",
        articleId: mockArticle.id,
        languageCode: "es",
        content: "# Introducción", // Only one block vs multiple in base
        status: "published",
        createdAt: "2024-01-02T00:00:00Z",
        updatedAt: "2024-01-02T00:00:00Z",
      }

      expect(isTranslationIncomplete(mockArticle, incompleteTranslation)).toBe(true)
    })

    it("should return false when translation is complete", () => {
      const completeTranslation: WikiTranslation = {
        id: "trans-1",
        articleId: mockArticle.id,
        languageCode: "es",
        content: mockArticle.content, // Same number of blocks
        status: "published",
        createdAt: "2024-01-02T00:00:00Z",
        updatedAt: "2024-01-02T00:00:00Z",
      }

      expect(isTranslationIncomplete(mockArticle, completeTranslation)).toBe(false)
    })
  })

  describe("getTranslationProgress", () => {
    it("should return 0 when translation is null", () => {
      expect(getTranslationProgress(mockArticle, null)).toBe(0)
    })

    it("should return 0 when translation has no content", () => {
      const emptyTranslation: WikiTranslation = {
        id: "trans-1",
        articleId: mockArticle.id,
        languageCode: "es",
        content: undefined,
        status: "draft",
        createdAt: "2024-01-02T00:00:00Z",
        updatedAt: "2024-01-02T00:00:00Z",
      }

      expect(getTranslationProgress(mockArticle, emptyTranslation)).toBe(0)
    })

    it("should calculate progress correctly", () => {
      const partialTranslation: WikiTranslation = {
        id: "trans-1",
        articleId: mockArticle.id,
        languageCode: "es",
        content: "# Introducción", // Partial content
        status: "published",
        createdAt: "2024-01-02T00:00:00Z",
        updatedAt: "2024-01-02T00:00:00Z",
      }

      const progress = getTranslationProgress(mockArticle, partialTranslation)
      expect(progress).toBeGreaterThan(0)
      expect(progress).toBeLessThan(100)
    })

    it("should return 100 for complete translations", () => {
      const completeTranslation: WikiTranslation = {
        id: "trans-1",
        articleId: mockArticle.id,
        languageCode: "es",
        content: mockArticle.content,
        status: "published",
        createdAt: "2024-01-02T00:00:00Z",
        updatedAt: "2024-01-02T00:00:00Z",
      }

      expect(getTranslationProgress(mockArticle, completeTranslation)).toBe(100)
    })
  })

  describe("Fallback logic", () => {
    it("should fallback to base when translation block is missing", () => {
      const mockTranslation: WikiTranslation = {
        id: "trans-1",
        articleId: mockArticle.id,
        languageCode: "es",
        title: "Guía",
        content: "# Introducción", // Missing later blocks
        status: "published",
        createdAt: "2024-01-02T00:00:00Z",
        updatedAt: "2024-01-02T00:00:00Z",
      }

      ;(getWikiTranslationByArticleIdAndLang as jest.Mock).mockReturnValue(mockTranslation)

      const blocks = getTranslatedContentBlocks(mockArticle, "es")
      const missingBlocks = blocks.filter((b) => b.isMissing)
      expect(missingBlocks.length).toBeGreaterThan(0)

      // Verify fallback works in getTranslatedContent
      const result = getTranslatedContent(mockArticle, "es")
      // Should use translated content where available
      expect(result.content).toContain("Introducción")
    })
  })
})

