/**
 * Translation utilities for wiki articles
 * Handles fallback logic, RTL detection, and content retrieval
 */

import type { WikiArticle, WikiTranslation } from "@/lib/types"
import {
  getWikiArticleBySlug,
  getWikiTranslationByArticleIdAndLang,
} from "@/lib/storage"

/**
 * RTL language codes (ISO 639-1)
 */
const RTL_LANGUAGES = new Set([
  "ar", // Arabic
  "he", // Hebrew
  "fa", // Persian
  "ur", // Urdu
  "yi", // Yiddish
])

/**
 * Checks if a language code is RTL
 */
export function isRTL(languageCode: string): boolean {
  return RTL_LANGUAGES.has(languageCode.toLowerCase())
}

/**
 * Gets the base language of an article (defaults to "en")
 */
export function getBaseLanguage(article: WikiArticle): string {
  return article.baseLanguage || "en"
}

/**
 * Retrieves translated content with fallback to base language
 * Returns the title and content with proper fallback handling
 */
export function getTranslatedContent(
  article: WikiArticle,
  languageCode: string,
): {
  title: string
  content: string
  isTranslated: boolean
  isRTL: boolean
} {
  const baseLang = getBaseLanguage(article)
  const isRTLLang = isRTL(languageCode)

  // If requesting base language, return original content
  if (languageCode === baseLang) {
    return {
      title: article.title,
      content: article.content,
      isTranslated: false,
      isRTL: isRTLLang,
    }
  }

  // Try to get translation
  const translation = getWikiTranslationByArticleIdAndLang(article.id, languageCode)

  // If translation exists and is published, use it
  if (translation && translation.status === "published") {
    return {
      title: translation.title || article.title, // Fallback to base title if missing
      content: translation.content || article.content, // Fallback to base content if missing
      isTranslated: true,
      isRTL: isRTLLang,
    }
  }

  // Fallback to base language
  return {
    title: article.title,
    content: article.content,
    isTranslated: false,
    isRTL: isRTLLang,
  }
}

/**
 * Gets translated title with fallback
 */
export function getTranslatedTitle(
  article: WikiArticle,
  languageCode: string,
): string {
  const baseLang = getBaseLanguage(article)
  if (languageCode === baseLang) {
    return article.title
  }

  const translation = getWikiTranslationByArticleIdAndLang(article.id, languageCode)
  if (translation?.title && translation.status === "published") {
    return translation.title
  }

  return article.title
}

/**
 * Gets translated content with fallback (block by block)
 * Splits content into blocks and returns translated version with fallbacks
 */
export function getTranslatedContentBlocks(
  article: WikiArticle,
  languageCode: string,
): Array<{
  id: string
  original: string
  translated: string | null
  isMissing: boolean
}> {
  const baseLang = getBaseLanguage(article)
  
  // Split content into blocks (by paragraph/section)
  const blocks = splitContentIntoBlocks(article.content)
  
  if (languageCode === baseLang) {
    return blocks.map((block, index) => ({
      id: `block-${index}`,
      original: block,
      translated: null,
      isMissing: false,
    }))
  }

  const translation = getWikiTranslationByArticleIdAndLang(article.id, languageCode)
  
  if (!translation || translation.status !== "published") {
    return blocks.map((block, index) => ({
      id: `block-${index}`,
      original: block,
      translated: null,
      isMissing: true,
    }))
  }

  const translatedBlocks = translation.content ? splitContentIntoBlocks(translation.content) : []
  
  return blocks.map((block, index) => {
    const translatedBlock = translatedBlocks[index] || null
    return {
      id: `block-${index}`,
      original: block,
      translated: translatedBlock,
      isMissing: !translatedBlock,
    }
  })
}

/**
 * Splits markdown content into logical blocks
 */
function splitContentIntoBlocks(content: string): string[] {
  // Split by double newlines (paragraphs)
  // Also preserve markdown headers as separate blocks
  const blocks: string[] = []
  const lines = content.split("\n")
  let currentBlock: string[] = []

  for (const line of lines) {
    // Check if line is a header
    if (line.trim().startsWith("#")) {
      // Save previous block
      if (currentBlock.length > 0) {
        blocks.push(currentBlock.join("\n"))
        currentBlock = []
      }
      // Header is its own block
      blocks.push(line)
    } else if (line.trim() === "") {
      // Empty line - end current block
      if (currentBlock.length > 0) {
        blocks.push(currentBlock.join("\n"))
        currentBlock = []
      }
    } else {
      currentBlock.push(line)
    }
  }

  // Add remaining block
  if (currentBlock.length > 0) {
    blocks.push(currentBlock.join("\n"))
  }

  return blocks.filter((block) => block.trim().length > 0)
}

/**
 * Generates a diff between two strings
 * Returns simple line-based diff information
 */
export function generateDiff(
  oldText: string,
  newText: string,
): Array<{
  type: "added" | "removed" | "unchanged"
  content: string
  lineNumber?: number
}> {
  const oldLines = oldText.split("\n")
  const newLines = newText.split("\n")
  const diff: Array<{
    type: "added" | "removed" | "unchanged"
    content: string
    lineNumber?: number
  }> = []

  const maxLines = Math.max(oldLines.length, newLines.length)

  for (let i = 0; i < maxLines; i++) {
    const oldLine = oldLines[i]
    const newLine = newLines[i]

    if (oldLine === undefined && newLine !== undefined) {
      diff.push({ type: "added", content: newLine, lineNumber: i + 1 })
    } else if (oldLine !== undefined && newLine === undefined) {
      diff.push({ type: "removed", content: oldLine, lineNumber: i + 1 })
    } else if (oldLine === newLine) {
      diff.push({ type: "unchanged", content: oldLine, lineNumber: i + 1 })
    } else {
      diff.push({ type: "removed", content: oldLine, lineNumber: i + 1 })
      diff.push({ type: "added", content: newLine, lineNumber: i + 1 })
    }
  }

  return diff
}

/**
 * Checks if a translation is missing content blocks
 */
export function isTranslationIncomplete(
  article: WikiArticle,
  translation: WikiTranslation | null,
): boolean {
  if (!translation) return true

  const baseBlocks = splitContentIntoBlocks(article.content)
  const translatedBlocks = translation.content
    ? splitContentIntoBlocks(translation.content)
    : []

  return translatedBlocks.length < baseBlocks.length
}

/**
 * Gets translation progress percentage
 */
export function getTranslationProgress(
  article: WikiArticle,
  translation: WikiTranslation | null,
): number {
  if (!translation || !translation.content) return 0

  const baseBlocks = splitContentIntoBlocks(article.content)
  const translatedBlocks = splitContentIntoBlocks(translation.content)

  if (baseBlocks.length === 0) return 100

  return Math.round((translatedBlocks.length / baseBlocks.length) * 100)
}

