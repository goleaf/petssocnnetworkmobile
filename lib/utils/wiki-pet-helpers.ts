import { getWikiArticles, getWikiArticlesByCategory } from "@/lib/storage"
import type { WikiArticle, Pet } from "@/lib/types"

/**
 * Get breed summary from wiki articles
 * Looks for articles in "breeds" category that match the pet's breed
 */
export function getBreedSummary(pet: Pet): WikiArticle | null {
  if (!pet.breed) return null

  const breedArticles = getWikiArticlesByCategory("breeds")
  
  // Normalize breed name for matching
  const normalizedBreed = pet.breed.toLowerCase().trim()
  
  // Try to find article that matches breed name
  const matchingArticle = breedArticles.find((article) => {
    const titleNormalized = article.title.toLowerCase()
    const contentNormalized = article.content.toLowerCase()
    
    // Check if breed name appears in title or content
    return (
      titleNormalized.includes(normalizedBreed) ||
      contentNormalized.includes(normalizedBreed)
    )
  })
  
  // If no exact match, try to find by slug or partial match
  if (!matchingArticle) {
    return breedArticles.find((article) => {
      const slugNormalized = article.slug.toLowerCase()
      return slugNormalized.includes(normalizedBreed.replace(/\s+/g, "-"))
    }) || null
  }
  
  return matchingArticle || null
}

/**
 * Extract summary text from wiki article content
 * Returns first 300 characters or up to first heading
 */
export function extractBreedSummary(article: WikiArticle): string {
  if (!article.content) return ""
  
  // Remove markdown headers and get first paragraph
  const content = article.content
    .replace(/^#+\s+/gm, "") // Remove markdown headers
    .replace(/\n+/g, " ") // Replace newlines with spaces
    .trim()
  
  // Get first 300 characters or until first period after 200 chars
  if (content.length <= 300) {
    return content
  }
  
  // Try to find a good stopping point
  const excerpt = content.substring(0, 300)
  const lastPeriod = excerpt.lastIndexOf(".")
  const lastSentence = lastPeriod > 200 ? excerpt.substring(0, lastPeriod + 1) : excerpt.trim()
  
  return lastSentence || content.substring(0, 300) + "..."
}

/**
 * Get care checklist items from wiki articles
 * Returns care articles filtered by pet species
 */
export function getCareChecklist(pet: Pet): WikiArticle[] {
  const careArticles = getWikiArticlesByCategory("care")
  
  if (!pet.species) {
    return careArticles.slice(0, 5) // Return first 5 if no species
  }
  
  // Filter articles that match the pet's species
  const speciesArticles = careArticles.filter((article) => {
    if (!article.species || article.species.length === 0) {
      return true // Include general articles
    }
    return article.species.includes(pet.species)
  })
  
  // Sort by views/engagement and return top 5
  return speciesArticles
    .sort((a, b) => (b.views || 0) - (a.views || 0))
    .slice(0, 5)
}

/**
 * Extract checklist items from article content
 * Looks for markdown lists or numbered lists in the content
 */
export function extractChecklistItems(article: WikiArticle, maxItems: number = 5): string[] {
  if (!article.content) return []
  
  const items: string[] = []
  const lines = article.content.split("\n")
  
  for (const line of lines) {
    if (items.length >= maxItems) break
    
    // Match markdown list items (-, *, +)
    const unorderedMatch = line.match(/^[-*+]\s+(.+)$/)
    // Match numbered list items
    const orderedMatch = line.match(/^\d+\.\s+(.+)$/)
    
    if (unorderedMatch) {
      items.push(unorderedMatch[1].trim())
    } else if (orderedMatch) {
      items.push(orderedMatch[1].trim())
    }
  }
  
  // If no list items found, extract first few sentences
  if (items.length === 0) {
    const sentences = article.content
      .replace(/^#+\s+/gm, "")
      .split(/[.!?]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 20 && s.length < 200)
      .slice(0, maxItems)
    
    return sentences
  }
  
  return items.slice(0, maxItems)
}

