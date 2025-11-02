/**
 * Reputation Integration Module
 * 
 * Integrates reputation tracking with wiki edits, citations, and reviews
 */

import type { WikiArticle, WikiRevision } from "./types"
import {
  awardAcceptedEdit,
  awardAcceptedCitation,
  recordExpertReview,
  calculateArticleQuality,
  calculateQualityScore,
  updateArticleFreshness,
  checkAutopromotionQualified,
} from "./reputation"
import { getWikiArticleById, updateWikiArticle } from "./storage"

/**
 * Handle accepted edit - award points and update article stats
 */
export async function handleAcceptedEdit(
  articleId: string,
  authorId: string,
  revision: WikiRevision
): Promise<void> {
  // Award reputation points
  const { points, badge } = awardAcceptedEdit(authorId, articleId)

  // Update article statistics
  const article = await getWikiArticleById(articleId)
  if (article) {
    article.acceptedEditsCount = (article.acceptedEditsCount || 0) + 1

    // Recalculate quality
    article.qualityLevel = calculateArticleQuality(article)
    article.qualityScore = calculateQualityScore(article)

    await updateWikiArticle(articleId, article)
  }

  // Check for autopromotion
  const isAutopromoted = checkAutopromotionQualified(authorId)
  if (isAutopromoted && badge) {
    // User reached autopromotion threshold
    // Future edits from this user may require fewer checks
    console.log(
      `User ${authorId} reached autopromotion threshold with badge: ${badge.type}`
    )
  }
}

/**
 * Handle accepted citation - award points and update article stats
 */
export async function handleAcceptedCitation(
  articleId: string,
  authorId: string
): Promise<void> {
  // Award reputation points
  const { points, badge } = awardAcceptedCitation(authorId, articleId)

  // Update article statistics
  const article = await getWikiArticleById(articleId)
  if (article) {
    article.citationsCount = (article.citationsCount || 0) + 1

    // Recalculate quality
    article.qualityLevel = calculateArticleQuality(article)
    article.qualityScore = calculateQualityScore(article)

    await updateWikiArticle(articleId, article)
  }

  // Check for autopromotion
  const isAutopromoted = checkAutopromotionQualified(authorId)
  if (isAutopromoted && badge) {
    console.log(
      `User ${authorId} reached autopromotion threshold with badge: ${badge.type}`
    )
  }
}

/**
 * Handle expert review - record review and update freshness
 */
export async function handleExpertReview(
  articleId: string,
  reviewerId: string,
  reviewType: "full" | "quick" | "fact-check",
  status: "approved" | "needs-revision" | "flagged",
  notes?: string
): Promise<void> {
  // Record the review
  const review = recordExpertReview(
    articleId,
    reviewerId,
    reviewType,
    status,
    notes
  )

  // Update article statistics
  const article = await getWikiArticleById(articleId)
  if (article) {
    article.expertReviewsCount = (article.expertReviewsCount || 0) + 1
    article.lastExpertReview = review

    // Update freshness label (especially important for health articles)
    if (article.category === "health") {
      article.freshnessLabel = updateArticleFreshness(
        articleId,
        review.reviewedAt
      )
    }

    // Recalculate quality
    article.qualityLevel = calculateArticleQuality(article)
    article.qualityScore = calculateQualityScore(article)

    await updateWikiArticle(articleId, article)
  }
}

/**
 * Initialize quality metrics for a new article
 */
export async function initializeArticleQuality(
  article: WikiArticle
): Promise<WikiArticle> {
  article.qualityLevel = calculateArticleQuality(article)
  article.qualityScore = calculateQualityScore(article)
  article.acceptedEditsCount = 0
  article.citationsCount = 0
  article.expertReviewsCount = 0

  // Initialize freshness label for health articles
  if (article.category === "health") {
    article.freshnessLabel = updateArticleFreshness(article.id)
  }

  return article
}

/**
 * Check if user's edit should go through autopromotion (fewer checks)
 */
export function shouldUseAutopromotion(userId: string): boolean {
  return checkAutopromotionQualified(userId)
}

