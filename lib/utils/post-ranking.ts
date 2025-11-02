import type { BlogPost, Place } from "@/lib/types"

/**
 * Configuration for ranking algorithm weights
 */
export interface RankingConfig {
  /** Weight for time-decay factor (0-1) */
  timeDecayWeight: number
  /** Weight for engagement factor (0-1) */
  engagementWeight: number
  /** Weight for proximity factor (0-1) */
  proximityWeight: number
  /** Half-life for time decay in hours (default: 48 hours) */
  timeDecayHalfLifeHours: number
  /** Maximum distance in km for proximity scoring (default: 50km) */
  maxProximityDistanceKm: number
}

const DEFAULT_CONFIG: RankingConfig = {
  timeDecayWeight: 0.4,
  engagementWeight: 0.4,
  proximityWeight: 0.2,
  timeDecayHalfLifeHours: 48,
  maxProximityDistanceKm: 50,
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * @returns distance in kilometers
 */
function calculateDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371 // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/**
 * Calculate time-decay score using exponential decay
 * Recent posts get higher scores, older posts decay exponentially
 * @param createdAt ISO timestamp string
 * @param halfLifeHours Half-life in hours (e.g., 48 means score halves every 48 hours)
 * @returns Score between 0 and 1
 */
function calculateTimeDecay(
  createdAt: string,
  halfLifeHours: number = DEFAULT_CONFIG.timeDecayHalfLifeHours
): number {
  const now = new Date().getTime()
  const created = new Date(createdAt).getTime()
  const ageHours = (now - created) / (1000 * 60 * 60)
  
  // Exponential decay: score = 2^(-age/halfLife)
  // This means score halves every halfLifeHours
  const score = Math.pow(2, -ageHours / halfLifeHours)
  
  // Ensure score is between 0 and 1
  return Math.max(0, Math.min(1, score))
}

/**
 * Calculate engagement score based on reactions and comments
 * @param post The blog post
 * @param commentCount Number of comments on the post
 * @returns Normalized engagement score between 0 and 1
 */
function calculateEngagement(
  post: BlogPost,
  commentCount: number
): number {
  // Count total reactions
  let reactionCount = 0
  if (post.reactions) {
    reactionCount = Object.values(post.reactions).reduce(
      (sum, arr) => sum + (arr?.length || 0),
      0
    )
  } else if (post.likes) {
    reactionCount = post.likes.length
  }

  // Engagement metrics (can be adjusted)
  const reactionsScore = Math.min(reactionCount / 50, 1) // Normalize to max 50 reactions
  const commentsScore = Math.min(commentCount / 20, 1) // Normalize to max 20 comments
  
  // Weighted combination (reactions weighted more than comments)
  const engagementScore = reactionsScore * 0.7 + commentsScore * 0.3
  
  // Log scaling to prevent extremely popular posts from dominating
  return Math.log10(engagementScore * 9 + 1) / Math.log10(10)
}

/**
 * Calculate proximity score for place-tagged posts
 * Closer places get higher scores, using inverse distance
 * @param post The blog post
 * @param place The place object (if post is place-tagged)
 * @param userLocation User's current location (optional)
 * @param maxDistanceKm Maximum distance for scoring (default: 50km)
 * @returns Score between 0 and 1, or 0 if not place-tagged or no user location
 */
function calculateProximity(
  post: BlogPost,
  place: Place | null,
  userLocation: { lat: number; lng: number } | null,
  maxDistanceKm: number = DEFAULT_CONFIG.maxProximityDistanceKm
): number {
  // No proximity score if post isn't place-tagged or no user location
  if (!post.placeId || !place || !userLocation) {
    return 0
  }

  const distanceKm = calculateDistanceKm(
    userLocation.lat,
    userLocation.lng,
    place.lat,
    place.lng
  )

  // If beyond max distance, return 0
  if (distanceKm > maxDistanceKm) {
    return 0
  }

  // Inverse distance scoring: closer = higher score
  // Score = 1 - (distance / maxDistance)
  // Using exponential decay for smoother curve
  const normalizedDistance = distanceKm / maxDistanceKm
  const score = Math.exp(-2 * normalizedDistance) // Exponential decay

  return Math.max(0, Math.min(1, score))
}

/**
 * Calculate ranking score for a post
 * Combines time-decay, engagement, and proximity (for place-tagged posts)
 * 
 * @param post The blog post to rank
 * @param commentCount Number of comments on the post
 * @param place Place object if post is place-tagged (optional)
 * @param userLocation User's current location for proximity calculation (optional)
 * @param config Ranking configuration (optional, uses defaults if not provided)
 * @returns Final ranking score (higher = better rank)
 */
export function calculatePostRankingScore(
  post: BlogPost,
  commentCount: number,
  place: Place | null = null,
  userLocation: { lat: number; lng: number } | null = null,
  config: Partial<RankingConfig> = {}
): number {
  const finalConfig: RankingConfig = { ...DEFAULT_CONFIG, ...config }

  // Calculate individual factors
  const timeDecayScore = calculateTimeDecay(
    post.createdAt,
    finalConfig.timeDecayHalfLifeHours
  )
  const engagementScore = calculateEngagement(post, commentCount)
  const proximityScore = calculateProximity(
    post,
    place,
    userLocation,
    finalConfig.maxProximityDistanceKm
  )

  // Weighted combination
  // For posts without place tags, proximity is 0, so only time-decay and engagement count
  const totalWeight =
    finalConfig.timeDecayWeight +
    finalConfig.engagementWeight +
    (proximityScore > 0 ? finalConfig.proximityWeight : 0)

  const normalizedWeights = {
    timeDecay: finalConfig.timeDecayWeight / totalWeight,
    engagement: finalConfig.engagementWeight / totalWeight,
    proximity: proximityScore > 0 ? finalConfig.proximityWeight / totalWeight : 0,
  }

  const finalScore =
    timeDecayScore * normalizedWeights.timeDecay +
    engagementScore * normalizedWeights.engagement +
    proximityScore * normalizedWeights.proximity

  return finalScore
}

/**
 * Rank posts by their calculated score
 * @param posts Array of posts to rank
 * @param commentCounts Map of postId -> comment count
 * @param places Map of placeId -> Place object
 * @param userLocation User's current location (optional)
 * @param config Ranking configuration (optional)
 * @returns Posts sorted by ranking score (highest first)
 */
export function rankPosts(
  posts: BlogPost[],
  commentCounts: Map<string, number>,
  places: Map<string, Place>,
  userLocation: { lat: number; lng: number } | null = null,
  config: Partial<RankingConfig> = {}
): BlogPost[] {
  const scoredPosts = posts.map((post) => {
    const commentCount = commentCounts.get(post.id) || 0
    const place = post.placeId ? places.get(post.placeId) || null : null
    const score = calculatePostRankingScore(
      post,
      commentCount,
      place,
      userLocation,
      config
    )

    return { post, score }
  })

  // Sort by score descending
  scoredPosts.sort((a, b) => b.score - a.score)

  return scoredPosts.map((item) => item.post)
}

