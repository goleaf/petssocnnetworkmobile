/**
 * Reputation & Quality Signals System
 * 
 * Handles points, badges, autopromotion thresholds, and quality scoring
 * for wiki articles and user contributions.
 */

import type {
  Badge,
  BadgeType,
  ReputationPoints,
  AutopromotionThresholds,
  ArticleQualityLevel,
  ExpertReview,
  FreshnessLabel,
  WikiArticle,
} from "./types"
import { generateStorageId } from "./storage"

const STORAGE_KEYS = {
  REPUTATION_POINTS: "pet_social_reputation_points",
  BADGES: "pet_social_badges",
  EXPERT_REVIEWS: "pet_social_expert_reviews",
  FRESHNESS_LABELS: "pet_social_freshness_labels",
}

// Default autopromotion thresholds
export const DEFAULT_AUTOPROMOTION_THRESHOLDS: AutopromotionThresholds = {
  acceptedEdits: 100, // 100 accepted edits → fewer checks
  acceptedCitations: 50,
  expertReviews: 25,
  reputationScore: 1000,
}

// Points awarded for different actions
export const REPUTATION_POINT_VALUES = {
  ACCEPTED_EDIT: 10,
  ACCEPTED_CITATION: 15,
  EXPERT_REVIEW: 20,
  QUALITY_IMPROVEMENT: 25,
} as const

// Reputation level thresholds
export const REPUTATION_LEVELS = {
  novice: { min: 0, max: 99 },
  contributor: { min: 100, max: 499 },
  editor: { min: 500, max: 999 },
  expert: { min: 1000, max: 4999 },
  master: { min: 5000, max: Infinity },
} as const

/**
 * Get or create reputation points for a user
 */
export function getUserReputation(userId: string): ReputationPoints {
  const stored = localStorage.getItem(STORAGE_KEYS.REPUTATION_POINTS)
  const allReputation: Record<string, ReputationPoints> = stored
    ? JSON.parse(stored)
    : {}

  if (!allReputation[userId]) {
    allReputation[userId] = {
      userId,
      totalPoints: 0,
      acceptedEdits: 0,
      acceptedCitations: 0,
      expertReviews: 0,
      lastUpdated: new Date().toISOString(),
      level: "novice",
    }
    saveReputationPoints(allReputation)
  }

  return allReputation[userId]
}

/**
 * Save reputation points to storage
 */
function saveReputationPoints(
  reputation: Record<string, ReputationPoints>
): void {
  localStorage.setItem(
    STORAGE_KEYS.REPUTATION_POINTS,
    JSON.stringify(reputation)
  )
}

/**
 * Award points for an accepted edit
 */
export function awardAcceptedEdit(
  userId: string,
  articleId: string
): { points: ReputationPoints; badge?: Badge } {
  const reputation = getUserReputation(userId)
  reputation.acceptedEdits += 1
  reputation.totalPoints += REPUTATION_POINT_VALUES.ACCEPTED_EDIT
  reputation.lastUpdated = new Date().toISOString()
  reputation.level = calculateReputationLevel(reputation.totalPoints)

  const allReputation: Record<string, ReputationPoints> = JSON.parse(
    localStorage.getItem(STORAGE_KEYS.REPUTATION_POINTS) || "{}"
  )
  allReputation[userId] = reputation
  saveReputationPoints(allReputation)

  // Award badge if threshold reached
  let badge: Badge | undefined
  if (reputation.acceptedEdits === 100) {
    badge = awardBadge(userId, "accepted-edit", articleId)
  }

  return { points: reputation, badge }
}

/**
 * Award points for an accepted citation
 */
export function awardAcceptedCitation(
  userId: string,
  articleId: string
): { points: ReputationPoints; badge?: Badge } {
  const reputation = getUserReputation(userId)
  reputation.acceptedCitations += 1
  reputation.totalPoints += REPUTATION_POINT_VALUES.ACCEPTED_CITATION
  reputation.lastUpdated = new Date().toISOString()
  reputation.level = calculateReputationLevel(reputation.totalPoints)

  const allReputation: Record<string, ReputationPoints> = JSON.parse(
    localStorage.getItem(STORAGE_KEYS.REPUTATION_POINTS) || "{}"
  )
  allReputation[userId] = reputation
  saveReputationPoints(allReputation)

  // Award badge if threshold reached
  let badge: Badge | undefined
  if (reputation.acceptedCitations === 50) {
    badge = awardBadge(userId, "citation-master", articleId)
  }

  return { points: reputation, badge }
}

/**
 * Award points for an expert review
 */
export function awardExpertReview(
  userId: string,
  articleId: string
): { points: ReputationPoints; badge?: Badge } {
  const reputation = getUserReputation(userId)
  reputation.expertReviews += 1
  reputation.totalPoints += REPUTATION_POINT_VALUES.EXPERT_REVIEW
  reputation.lastUpdated = new Date().toISOString()
  reputation.level = calculateReputationLevel(reputation.totalPoints)

  const allReputation: Record<string, ReputationPoints> = JSON.parse(
    localStorage.getItem(STORAGE_KEYS.REPUTATION_POINTS) || "{}"
  )
  allReputation[userId] = reputation
  saveReputationPoints(allReputation)

  // Award badge if threshold reached
  let badge: Badge | undefined
  if (reputation.expertReviews === 25) {
    badge = awardBadge(userId, "reviewer", articleId)
  }

  return { points: reputation, badge }
}

/**
 * Calculate reputation level based on total points
 */
export function calculateReputationLevel(
  totalPoints: number
): ReputationPoints["level"] {
  if (totalPoints >= REPUTATION_LEVELS.master.min) return "master"
  if (totalPoints >= REPUTATION_LEVELS.expert.min) return "expert"
  if (totalPoints >= REPUTATION_LEVELS.editor.min) return "editor"
  if (totalPoints >= REPUTATION_LEVELS.contributor.min) return "contributor"
  return "novice"
}

/**
 * Award a badge to a user
 */
export function awardBadge(
  userId: string,
  type: BadgeType,
  relatedContentId?: string,
  metadata?: Record<string, unknown>
): Badge {
  const badge: Badge = {
    id: generateStorageId(),
    type,
    userId,
    earnedAt: new Date().toISOString(),
    relatedContentId,
    metadata,
  }

  const stored = localStorage.getItem(STORAGE_KEYS.BADGES)
  const allBadges: Badge[] = stored ? JSON.parse(stored) : []
  allBadges.push(badge)
  localStorage.setItem(STORAGE_KEYS.BADGES, JSON.stringify(allBadges))

  return badge
}

/**
 * Get all badges for a user
 */
export function getUserBadges(userId: string): Badge[] {
  const stored = localStorage.getItem(STORAGE_KEYS.BADGES)
  const allBadges: Badge[] = stored ? JSON.parse(stored) : []
  return allBadges.filter((badge) => badge.userId === userId)
}

/**
 * Check if user qualifies for autopromotion (fewer checks)
 */
export function checkAutopromotionQualified(
  userId: string,
  thresholds: AutopromotionThresholds = DEFAULT_AUTOPROMOTION_THRESHOLDS
): boolean {
  const reputation = getUserReputation(userId)

  return (
    reputation.acceptedEdits >= thresholds.acceptedEdits ||
    reputation.acceptedCitations >= thresholds.acceptedCitations ||
    reputation.expertReviews >= thresholds.expertReviews ||
    reputation.totalPoints >= thresholds.reputationScore
  )
}

/**
 * Calculate article quality level based on various factors
 */
export function calculateArticleQuality(
  article: WikiArticle
): ArticleQualityLevel {
  let score = 0

  // Base score from content length
  const contentLength = article.content.length
  if (contentLength < 500) score += 10 // Stub
  else if (contentLength < 1500) score += 30 // Start
  else if (contentLength < 3000) score += 50 // B
  else if (contentLength < 5000) score += 70 // A
  else score += 90 // Featured candidate

  // Citations boost
  const citations = article.citationsCount || 0
  score += Math.min(citations * 5, 30)

  // Expert reviews boost
  const reviews = article.expertReviewsCount || 0
  score += Math.min(reviews * 10, 20)

  // Accepted edits boost (shows quality improvement)
  const edits = article.acceptedEditsCount || 0
  score += Math.min(edits * 2, 15)

  // Quality level mapping
  if (score >= 90) return "featured"
  if (score >= 70) return "a"
  if (score >= 50) return "b"
  if (score >= 30) return "start"
  return "stub"
}

/**
 * Calculate quality score (0-100)
 */
export function calculateQualityScore(article: WikiArticle): number {
  let score = 0

  // Content quality (40 points max)
  const contentLength = article.content.length
  score += Math.min((contentLength / 5000) * 40, 40)

  // Citations (25 points max)
  const citations = article.citationsCount || 0
  score += Math.min(citations * 5, 25)

  // Expert reviews (20 points max)
  const reviews = article.expertReviewsCount || 0
  score += Math.min(reviews * 4, 20)

  // Accepted edits (15 points max)
  const edits = article.acceptedEditsCount || 0
  score += Math.min(edits * 1.5, 15)

  return Math.round(Math.min(score, 100))
}

/**
 * Record an expert review
 */
export function recordExpertReview(
  articleId: string,
  reviewerId: string,
  reviewType: ExpertReview["reviewType"],
  status: ExpertReview["status"],
  notes?: string
): ExpertReview {
  const review: ExpertReview = {
    id: generateStorageId(),
    articleId,
    reviewerId,
    reviewedAt: new Date().toISOString(),
    reviewType,
    status,
    notes,
  }

  const stored = localStorage.getItem(STORAGE_KEYS.EXPERT_REVIEWS)
  const allReviews: ExpertReview[] = stored ? JSON.parse(stored) : []
  allReviews.push(review)
  localStorage.setItem(STORAGE_KEYS.EXPERT_REVIEWS, JSON.stringify(allReviews))

  // Award points to reviewer
  if (status === "approved") {
    awardExpertReview(reviewerId, articleId)
  }

  return review
}

/**
 * Get expert reviews for an article
 */
export function getArticleExpertReviews(articleId: string): ExpertReview[] {
  const stored = localStorage.getItem(STORAGE_KEYS.EXPERT_REVIEWS)
  const allReviews: ExpertReview[] = stored ? JSON.parse(stored) : []
  return allReviews
    .filter((review) => review.articleId === articleId)
    .sort(
      (a, b) =>
        new Date(b.reviewedAt).getTime() - new Date(a.reviewedAt).getTime()
    )
}

/**
 * Calculate freshness label for health articles
 */
export function calculateFreshnessLabel(
  articleId: string,
  lastExpertReviewDate?: string
): FreshnessLabel {
  const now = new Date()
  const lastReview = lastExpertReviewDate
    ? new Date(lastExpertReviewDate)
    : null

  if (!lastReview) {
    return {
      articleId,
      reviewStatus: "needs-update",
    }
  }

  const daysSinceReview = Math.floor(
    (now.getTime() - lastReview.getTime()) / (1000 * 60 * 60 * 24)
  )

  // Health articles should be reviewed every 6 months
  const REVIEW_INTERVAL_DAYS = 180
  const nextReviewDue = new Date(
    lastReview.getTime() + REVIEW_INTERVAL_DAYS * 24 * 60 * 60 * 1000
  )

  let reviewStatus: FreshnessLabel["reviewStatus"]
  if (daysSinceReview < 90) {
    reviewStatus = "fresh"
  } else if (daysSinceReview < 180) {
    reviewStatus = "review-due"
  } else {
    reviewStatus = "stale"
  }

  return {
    articleId,
    lastExpertReviewDate: lastReview.toISOString(),
    reviewStatus,
    daysSinceReview,
    nextReviewDue: nextReviewDue.toISOString(),
  }
}

/**
 * Update freshness label for an article
 */
export function updateArticleFreshness(
  articleId: string,
  lastExpertReviewDate?: string
): FreshnessLabel {
  const label = calculateFreshnessLabel(articleId, lastExpertReviewDate)

  const stored = localStorage.getItem(STORAGE_KEYS.FRESHNESS_LABELS)
  const allLabels: Record<string, FreshnessLabel> = stored
    ? JSON.parse(stored)
    : {}
  allLabels[articleId] = label
  localStorage.setItem(
    STORAGE_KEYS.FRESHNESS_LABELS,
    JSON.stringify(allLabels)
  )

  return label
}

/**
 * Get freshness label for an article
 */
export function getArticleFreshnessLabel(
  articleId: string
): FreshnessLabel | null {
  const stored = localStorage.getItem(STORAGE_KEYS.FRESHNESS_LABELS)
  const allLabels: Record<string, FreshnessLabel> = stored
    ? JSON.parse(stored)
    : {}
  return allLabels[articleId] || null
}

