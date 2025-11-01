/**
 * Tests for RTL (Right-to-Left) language support
 * Verifies RTL detection and proper fallback handling for RTL languages
 */

import { isRTL, getTranslatedContent } from "../utils/translations"
import type { WikiArticle, WikiTranslation } from "../types"
import { getWikiTranslationByArticleIdAndLang } from "../storage"

// Mock the storage functions
jest.mock("../storage", () => ({
  getWikiTranslationByArticleIdAndLang: jest.fn(),
}))

describe("RTL Language Support", () => {
  const mockArticle: WikiArticle = {
    id: "article-1",
    title: "Dog Care Guide",
    slug: "dog-care-guide",
    category: "care",
    content: "# Introduction\n\nThis is a guide about dogs.",
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

  describe("RTL Detection", () => {
    const rtlLanguages = ["ar", "he", "fa", "ur", "yi"]
    const ltrLanguages = ["en", "es", "fr", "de", "it", "pt", "zh", "ja", "ko", "ru"]

    it("should correctly identify all RTL languages", () => {
      rtlLanguages.forEach((lang) => {
        expect(isRTL(lang)).toBe(true)
        expect(isRTL(lang.toUpperCase())).toBe(true)
        expect(isRTL(lang.charAt(0).toUpperCase() + lang.slice(1))).toBe(true)
      })
    })

    it("should correctly identify all LTR languages", () => {
      ltrLanguages.forEach((lang) => {
        expect(isRTL(lang)).toBe(false)
      })
    })

    it("should handle case-insensitive input", () => {
      expect(isRTL("AR")).toBe(true)
      expect(isRTL("He")).toBe(true)
      expect(isRTL("FA")).toBe(true)
      expect(isRTL("en")).toBe(false)
      expect(isRTL("ES")).toBe(false)
    })
  })

  describe("RTL Translation Content", () => {
    it("should mark Arabic translations as RTL", () => {
      const mockTranslation: WikiTranslation = {
        id: "trans-ar",
        articleId: mockArticle.id,
        languageCode: "ar",
        title: "دليل رعاية الكلاب",
        content: "# مقدمة\n\nهذا دليل عن الكلاب.",
        status: "published",
        createdAt: "2024-01-02T00:00:00Z",
        updatedAt: "2024-01-02T00:00:00Z",
      }

      ;(getWikiTranslationByArticleIdAndLang as jest.Mock).mockReturnValue(mockTranslation)

      const result = getTranslatedContent(mockArticle, "ar")
      expect(result.isRTL).toBe(true)
      expect(result.title).toBe("دليل رعاية الكلاب")
      expect(result.content).toBe("# مقدمة\n\nهذا دليل عن الكلاب.")
    })

    it("should mark Hebrew translations as RTL", () => {
      const mockTranslation: WikiTranslation = {
        id: "trans-he",
        articleId: mockArticle.id,
        languageCode: "he",
        title: "מדריך טיפול בכלבים",
        content: "# הקדמה\n\nזה מדריך על כלבים.",
        status: "published",
        createdAt: "2024-01-02T00:00:00Z",
        updatedAt: "2024-01-02T00:00:00Z",
      }

      ;(getWikiTranslationByArticleIdAndLang as jest.Mock).mockReturnValue(mockTranslation)

      const result = getTranslatedContent(mockArticle, "he")
      expect(result.isRTL).toBe(true)
      expect(result.title).toBe("מדריך טיפול בכלבים")
    })

    it("should mark Persian translations as RTL", () => {
      const mockTranslation: WikiTranslation = {
        id: "trans-fa",
        articleId: mockArticle.id,
        languageCode: "fa",
        title: "راهنمای مراقبت از سگ",
        content: "# مقدمه\n\nاین راهنمای مراقبت از سگ است.",
        status: "published",
        createdAt: "2024-01-02T00:00:00Z",
        updatedAt: "2024-01-02T00:00:00Z",
      }

      ;(getWikiTranslationByArticleIdAndLang as jest.Mock).mockReturnValue(mockTranslation)

      const result = getTranslatedContent(mockArticle, "fa")
      expect(result.isRTL).toBe(true)
    })

    it("should not mark LTR translations as RTL", () => {
      const mockTranslation: WikiTranslation = {
        id: "trans-es",
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
      expect(result.isRTL).toBe(false)
    })
  })

  describe("RTL Fallback Behavior", () => {
    it("should fallback to base language while maintaining RTL detection", () => {
      ;(getWikiTranslationByArticleIdAndLang as jest.Mock).mockReturnValue(undefined)

      const result = getTranslatedContent(mockArticle, "ar")
      expect(result.isRTL).toBe(true) // Still detects RTL even when falling back
      expect(result.title).toBe(mockArticle.title) // Falls back to base
      expect(result.content).toBe(mockArticle.content) // Falls back to base
      expect(result.isTranslated).toBe(false)
    })

    it("should handle partial RTL translations with fallback", () => {
      const partialTranslation: WikiTranslation = {
        id: "trans-ar",
        articleId: mockArticle.id,
        languageCode: "ar",
        title: "دليل رعاية الكلاب",
        content: undefined, // Missing content - should fallback
        status: "published",
        createdAt: "2024-01-02T00:00:00Z",
        updatedAt: "2024-01-02T00:00:00Z",
      }

      ;(getWikiTranslationByArticleIdAndLang as jest.Mock).mockReturnValue(partialTranslation)

      const result = getTranslatedContent(mockArticle, "ar")
      expect(result.isRTL).toBe(true)
      expect(result.title).toBe("دليل رعاية الكلاب") // Translated title
      expect(result.content).toBe(mockArticle.content) // Falls back to base content
      expect(result.isTranslated).toBe(true)
    })

    it("should handle RTL translation with draft status (should fallback)", () => {
      const draftTranslation: WikiTranslation = {
        id: "trans-ar",
        articleId: mockArticle.id,
        languageCode: "ar",
        title: "دليل رعاية الكلاب",
        content: "# مقدمة",
        status: "draft", // Not published - should fallback
        createdAt: "2024-01-02T00:00:00Z",
        updatedAt: "2024-01-02T00:00:00Z",
      }

      ;(getWikiTranslationByArticleIdAndLang as jest.Mock).mockReturnValue(draftTranslation)

      const result = getTranslatedContent(mockArticle, "ar")
      expect(result.isRTL).toBe(true) // Still detects RTL
      expect(result.title).toBe(mockArticle.title) // Falls back due to draft status
      expect(result.content).toBe(mockArticle.content) // Falls back due to draft status
      expect(result.isTranslated).toBe(false)
    })
  })

  describe("RTL Content Integrity", () => {
    it("should preserve RTL text content", () => {
      const mockTranslation: WikiTranslation = {
        id: "trans-ar",
        articleId: mockArticle.id,
        languageCode: "ar",
        title: "دليل رعاية الكلاب",
        content: "# مقدمة\n\nهذا دليل عن الكلاب.\n\n## التغذية\n\nأطعم كلبك مرتين في اليوم.",
        status: "published",
        createdAt: "2024-01-02T00:00:00Z",
        updatedAt: "2024-01-02T00:00:00Z",
      }

      ;(getWikiTranslationByArticleIdAndLang as jest.Mock).mockReturnValue(mockTranslation)

      const result = getTranslatedContent(mockArticle, "ar")
      
      // Verify RTL content is preserved
      expect(result.content).toContain("مقدمة")
      expect(result.content).toContain("هذا دليل")
      expect(result.content).toContain("التغذية")
      expect(result.isRTL).toBe(true)
    })

    it("should handle mixed content (RTL with LTR text)", () => {
      // Some Arabic content may contain English words/numbers
      const mockTranslation: WikiTranslation = {
        id: "trans-ar",
        articleId: mockArticle.id,
        languageCode: "ar",
        title: "دليل رعاية الكلاب",
        content: "# مقدمة\n\nهذا دليل عن الكلاب. 123 ABC",
        status: "published",
        createdAt: "2024-01-02T00:00:00Z",
        updatedAt: "2024-01-02T00:00:00Z",
      }

      ;(getWikiTranslationByArticleIdAndLang as jest.Mock).mockReturnValue(mockTranslation)

      const result = getTranslatedContent(mockArticle, "ar")
      expect(result.isRTL).toBe(true)
      expect(result.content).toContain("123 ABC") // LTR content within RTL
    })
  })
})

