import type { WikiArticle } from "@/lib/types"
import { getWikiArticles } from "@/lib/storage"

/**
 * Creates a case-insensitive lookup map of wiki article titles
 */
export function createWikiTitleMap(): Map<string, WikiArticle> {
  const articles = getWikiArticles()
  const map = new Map<string, WikiArticle>()
  
  articles.forEach((article) => {
    // Store with lowercase key for case-insensitive matching
    const key = article.title.toLowerCase()
    // Keep the first article if duplicates exist
    if (!map.has(key)) {
      map.set(key, article)
    }
  })
  
  return map
}

/**
 * Finds all wiki article titles that appear in the given text
 * Returns an array of matches with their positions and associated articles
 */
export interface WikiMatch {
  term: string
  article: WikiArticle
  startIndex: number
  endIndex: number
}

export function findWikiTermsInText(text: string): WikiMatch[] {
  if (!text || typeof text !== "string") return []
  
  const wikiMap = createWikiTitleMap()
  const matches: WikiMatch[] = []
  const processedIndices = new Set<number>()
  
  // Sort articles by title length (longest first) to match longer titles first
  const articles = Array.from(wikiMap.values()).sort(
    (a, b) => b.title.length - a.title.length
  )
  
  // Find all occurrences of each wiki title in the text
  articles.forEach((article) => {
    const title = article.title
    const titleLower = title.toLowerCase()
    let searchIndex = 0
    
    while (true) {
      const index = text.toLowerCase().indexOf(titleLower, searchIndex)
      if (index === -1) break
      
      // Check if this position is already matched by a longer term
      let isOverlapped = false
      for (const match of matches) {
        if (
          (index >= match.startIndex && index < match.endIndex) ||
          (index + title.length > match.startIndex && index + title.length <= match.endIndex)
        ) {
          isOverlapped = true
          break
        }
      }
      
      if (!isOverlapped) {
        // Check word boundaries - ensure we're matching whole words
        const charBefore = index > 0 ? text[index - 1] : " "
        const charAfter = index + title.length < text.length ? text[index + title.length] : " "
        // Allow word boundaries (whitespace, punctuation, or start/end of string)
        const isWordBoundary = 
          (index === 0 || /[\s\p{P}]/u.test(charBefore)) && 
          (index + title.length === text.length || /[\s\p{P}]/u.test(charAfter))
        
        if (isWordBoundary) {
          matches.push({
            term: text.substring(index, index + title.length),
            article,
            startIndex: index,
            endIndex: index + title.length,
          })
          processedIndices.add(index)
        }
      }
      
      searchIndex = index + 1
    }
  })
  
  // Sort matches by start index
  return matches.sort((a, b) => a.startIndex - b.startIndex)
}

/**
 * Processes text and replaces wiki terms with React elements
 * Returns an array of strings and React elements for rendering
 */
export interface TextSegment {
  type: "text" | "link"
  content: string
  article?: WikiArticle
}

export function processWikiLinks(text: string): TextSegment[] {
  if (!text || typeof text !== "string") return [{ type: "text", content: text }]
  
  const matches = findWikiTermsInText(text)
  if (matches.length === 0) {
    return [{ type: "text", content: text }]
  }
  
  const segments: TextSegment[] = []
  let lastIndex = 0
  
  matches.forEach((match) => {
    // Add text before the match
    if (match.startIndex > lastIndex) {
      segments.push({
        type: "text",
        content: text.substring(lastIndex, match.startIndex),
      })
    }
    
    // Add the link
    segments.push({
      type: "link",
      content: match.term,
      article: match.article,
    })
    
    lastIndex = match.endIndex
  })
  
  // Add remaining text after last match
  if (lastIndex < text.length) {
    segments.push({
      type: "text",
      content: text.substring(lastIndex),
    })
  }
  
  return segments
}

