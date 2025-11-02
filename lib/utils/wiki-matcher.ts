import type { BlogPost, WikiArticle } from "@/lib/types"
import { getWikiArticles } from "@/lib/storage"
import { findWikiTermsInText } from "./wiki-linking"

/**
 * Finds relevant wiki pages for a blog post based on content analysis
 */
export function findRelevantWikiPages(post: BlogPost): WikiArticle[] {
  const allWikiArticles = getWikiArticles()
  const relevantPages: WikiArticle[] = []
  
  // 1. Check for explicitly related wiki IDs
  if (post.relatedWikiIds && post.relatedWikiIds.length > 0) {
    post.relatedWikiIds.forEach((wikiId) => {
      const article = allWikiArticles.find((a) => a.id === wikiId)
      if (article) {
        relevantPages.push(article)
      }
    })
  }
  
  // 2. Find wiki terms mentioned in post content
  const content = post.content || ""
  const matches = findWikiTermsInText(content)
  
  matches.forEach((match) => {
    if (!relevantPages.find((p) => p.id === match.article.id)) {
      relevantPages.push(match.article)
    }
  })
  
  // 3. Match by tags
  if (post.tags && post.tags.length > 0) {
    post.tags.forEach((tag) => {
      const matchingArticles = allWikiArticles.filter(
        (article) =>
          article.tags.includes(tag.toLowerCase()) ||
          article.title.toLowerCase().includes(tag.toLowerCase())
      )
      matchingArticles.forEach((article) => {
        if (!relevantPages.find((p) => p.id === article.id)) {
          relevantPages.push(article)
        }
      })
    })
  }
  
  // 4. Match by category (e.g., health-update template → health wiki pages)
  if (post.template === "health-update") {
    const healthArticles = allWikiArticles.filter((a) => a.category === "health")
    healthArticles.slice(0, 3).forEach((article) => {
      if (!relevantPages.find((p) => p.id === article.id)) {
        relevantPages.push(article)
      }
    })
  }
  
  // Sort by relevance (explicit relations first, then by views/popularity)
  return relevantPages.sort((a, b) => {
    const aIsExplicit = post.relatedWikiIds?.includes(a.id) ? 1 : 0
    const bIsExplicit = post.relatedWikiIds?.includes(b.id) ? 1 : 0
    
    if (aIsExplicit !== bIsExplicit) {
      return bIsExplicit - aIsExplicit
    }
    
    return (b.views || 0) - (a.views || 0)
  })
}

