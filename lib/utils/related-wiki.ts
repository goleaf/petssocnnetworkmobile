import { getWikiArticles } from "@/lib/storage"
import type { WikiArticle } from "@/lib/types"

/**
 * Find related wiki articles based on post content, tags, and categories
 */
export function findRelatedWikiArticles(
  postContent: string,
  postTags: string[] = [],
  postCategories: string[] = []
): WikiArticle[] {
  const allArticles = getWikiArticles()
  const contentLower = postContent.toLowerCase()
  const tagsLower = postTags.map((t) => t.toLowerCase())
  const categoriesLower = postCategories.map((c) => c.toLowerCase())

  // Score articles based on relevance
  const scoredArticles = allArticles.map((article) => {
    let score = 0

    // Check title match
    const titleLower = article.title.toLowerCase()
    if (tagsLower.some((tag) => titleLower.includes(tag))) score += 5
    if (categoriesLower.some((cat) => titleLower.includes(cat))) score += 3

    // Check content match
    const articleContentLower = (article.content || "").toLowerCase()
    tagsLower.forEach((tag) => {
      if (articleContentLower.includes(tag)) score += 2
      if (contentLower.includes(tag)) score += 1
    })

    // Check tags match
    if (article.tags && Array.isArray(article.tags)) {
      const articleTagsLower = article.tags.map((t) => t.toLowerCase())
      const commonTags = tagsLower.filter((tag) => articleTagsLower.includes(tag))
      score += commonTags.length * 3
    }

    // Check category match
    if (article.category && categoriesLower.includes(article.category.toLowerCase())) {
      score += 4
    }

    return { article, score }
  })

  // Return top 3 related articles
  return scoredArticles
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((item) => item.article)
}

