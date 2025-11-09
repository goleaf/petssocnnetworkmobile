import type { BlogPost, Place } from "@/lib/types"
import { getBlogPosts } from "@/lib/storage"
import { getCommentsByPostId } from "@/lib/storage"
import { getUsers, isPostSaved } from "@/lib/storage"

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
  /** Weight for author affinity factor (0-1) */
  affinityWeight: number
  /** Weight for content-type preference factor (0-1) */
  contentTypePreferenceWeight: number
  /** Weight for topic relevance factor (0-1) */
  topicRelevanceWeight: number
  /** Half-life for time decay in hours (default: 48 hours) */
  timeDecayHalfLifeHours: number
  /** Maximum distance in km for proximity scoring (default: 50km) */
  maxProximityDistanceKm: number
}

const DEFAULT_CONFIG: RankingConfig = {
  timeDecayWeight: 0.4,
  engagementWeight: 0.4,
  proximityWeight: 0.2,
  affinityWeight: 0.25,
  contentTypePreferenceWeight: 0.15,
  topicRelevanceWeight: 0.2,
  timeDecayHalfLifeHours: 48,
  maxProximityDistanceKm: 50,
}

/**
 * User-specific context to personalize ranking
 */
export type ContentKind = "photo" | "video" | "text"

export interface UserRankingContext {
  /** Current viewer user id */
  currentUserId: string
  /** IDs the user follows */
  followingIds?: Set<string>
  /** IDs with mutual follow (both follow each other) */
  mutualFollowingIds?: Set<string>
  /** Interactions with authors keyed by authorId */
  interactionsByAuthor?: Map<string, { reactions: number; comments: number; views?: number; messages?: number }>
  /** Content-type preference counts or normalized weights */
  contentTypePreference?: { photo: number; video: number; text: number }
  /** Topic preferences (lowercased tag/hashtag -> weight/count) */
  topicPreferences?: Map<string, number>
  /** Explicit interests from user profile */
  userInterests?: Set<string>
  /** Author IDs the user co-owns pets with (if applicable) */
  coOwnerAuthorIds?: Set<string>
  /** Words/phrases to completely mute from viewer's feeds */
  mutedKeywords?: string[]
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
 * Piecewise recency multiplier based on hours since creation
 */
function piecewiseRecencyMultiplier(createdAt: string): number {
  const now = Date.now()
  const created = new Date(createdAt).getTime()
  const hoursOld = (now - created) / (1000 * 60 * 60)
  if (hoursOld < 1) return 1.0
  if (hoursOld < 3) return 0.9
  if (hoursOld < 6) return 0.7
  if (hoursOld < 12) return 0.5
  if (hoursOld < 24) return 0.3
  if (hoursOld < 48) return 0.1
  return 0.05
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

// ------------------------------ Negative signals helpers ------------------------------

const REPORT_DEMOTION_THRESHOLD = 3
const RARE_ENGAGEMENT_LOOKBACK_DAYS = 90
const VERY_SHORT_NO_MEDIA_LEN = 50
const EXCESSIVE_HASHTAGS_THRESHOLD = 10

// Simple clickbait patterns
const CLICKBAIT_PATTERNS: RegExp[] = [
  /you won't believe/gi,
  /what happens next/gi,
  /shocking/gi,
  /must see/gi,
  /one weird trick/gi,
  /click here/gi,
  /before you .*read/gi,
  /secret.*revealed/gi,
]

function getLocalReportCounts(): Map<string, number> {
  if (typeof window === "undefined") return new Map()
  try {
    const raw = localStorage.getItem("pet_social_reports")
    if (!raw) return new Map()
    const arr = JSON.parse(raw) as Array<{ postId?: string }>
    const map = new Map<string, number>()
    for (const r of arr) {
      if (!r?.postId) continue
      map.set(r.postId, (map.get(r.postId) || 0) + 1)
    }
    return map
  } catch {
    return new Map()
  }
}

function getAllHashtags(post: BlogPost): string[] {
  const inField = Array.isArray(post.hashtags) ? post.hashtags : []
  const inContent = Array.from(new Set((post.content.match(/#(\w+)/g) || []).map((h) => h.replace(/^#/, ""))))
  return [...new Set([...inField, ...inContent])]
}

function stripMarkdown(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, " ") // code blocks
    .replace(/`[^`]*`/g, " ")
    .replace(/!\[[^\]]*\]\([^\)]*\)/g, " ") // images
    .replace(/\[[^\]]*\]\([^\)]*\)/g, " ") // links
    .replace(/[*_~`>#-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function containsMutedKeywords(post: BlogPost, muted: string[] | undefined): boolean {
  if (!muted || muted.length === 0) return false
  const hay = `${post.title || ""} ${post.content || ""} ${getAllHashtags(post).join(" ")} ${
    Array.isArray(post.tags) ? post.tags.join(" ") : ""
  }`.toLowerCase()
  return muted.some((kw) => kw && hay.includes(kw.toLowerCase()))
}

function isVeryShortNoMedia(post: BlogPost): boolean {
  const len = stripMarkdown(`${post.title ? post.title + " " : ""}${post.content || ""}`).length
  const hasMedia = Boolean(post.coverImage || post.media?.images?.length || post.media?.videos?.length)
  return len > 0 && len < VERY_SHORT_NO_MEDIA_LEN && !hasMedia
}

function hasExcessiveHashtags(post: BlogPost): boolean {
  const count = getAllHashtags(post).length
  return count > EXCESSIVE_HASHTAGS_THRESHOLD
}

function hasClickbait(post: BlogPost): boolean {
  const text = `${post.title || ""} ${post.content || ""}`
  return CLICKBAIT_PATTERNS.some((re) => re.test(text))
}

function getReportCount(post: BlogPost, localReportCounts: Map<string, number>): number {
  const inObject = Array.isArray(post.reports) ? post.reports.length : 0
  const inLocal = localReportCounts.get(post.id) || 0
  return inObject + inLocal
}

function computeAuthorEngagementRatio(
  viewerId: string,
  authorId: string,
  lookbackDays: number,
): number {
  // Inspect posts by this author in recent window, count how many the viewer engaged with
  const all = getBlogPosts()
  const cutoff = Date.now() - lookbackDays * 24 * 60 * 60 * 1000
  const authored = all.filter((p) => p.authorId === authorId && new Date(p.createdAt).getTime() >= cutoff)
  if (authored.length === 0) return 1 // if no recent posts, don't penalize

  let engaged = 0
  for (const p of authored) {
    const reacted = p.reactions
      ? Object.values(p.reactions).some((arr) => (arr || []).includes(viewerId))
      : (p.likes || []).includes(viewerId)
    const comments = getCommentsByPostId(p.id)
    const commented = comments.some((c) => c.userId === viewerId)
    if (reacted || commented) engaged += 1
  }
  return engaged / authored.length
}

function getHiddenTopics(viewerId?: string): Set<string> {
  if (typeof window === "undefined" || !viewerId) return new Set()
  const keys = [
    `pet_social_hidden_topics_${viewerId}`,
    `pet_social_hidden_keywords_${viewerId}`,
    `pet_social_hidden_topics`,
    `pet_social_hidden_keywords`,
  ]
  const out = new Set<string>()
  for (const k of keys) {
    try {
      const raw = localStorage.getItem(k)
      if (!raw) continue
      const arr = JSON.parse(raw) as string[]
      for (const s of arr || []) out.add(String(s).toLowerCase())
    } catch {
      // ignore
    }
  }
  return out
}

function matchesHiddenTopics(post: BlogPost, hidden: Set<string>): boolean {
  if (!hidden.size) return false
  const hay = `${post.title || ""} ${post.content || ""} ${getAllHashtags(post).join(" ")} ${
    Array.isArray(post.tags) ? post.tags.join(" ") : ""
  }`.toLowerCase()
  for (const h of hidden) {
    if (h && hay.includes(h)) return true
  }
  return false
}

/** Determine post content kind based on attached media */
function getPostContentKind(post: BlogPost): ContentKind {
  const hasVideo = Boolean(post.media?.videos && post.media.videos.length > 0)
  if (hasVideo) return "video"
  const hasPhoto = Boolean(post.media?.images && post.media.images.length > 0)
  if (hasPhoto) return "photo"
  return "text"
}

/** Calculate affinity score (0..1) between viewer and post author */
function calculateAffinity(
  post: BlogPost,
  context?: UserRankingContext,
): number {
  if (!context) return 0
  const authorId = post.authorId

  let score = 0

  // Follow and mutual follow signals
  const follows = context.followingIds?.has(authorId) ? 1 : 0
  const mutual = context.mutualFollowingIds?.has(authorId) ? 1 : 0
  if (follows) score += 0.4
  if (mutual) score += 0.2 // additional boost on top of follows

  // Co-owner boost if provided
  if (context.coOwnerAuthorIds?.has(authorId)) {
    score += 0.2
  }

  // Interaction frequency with this author
  const interactions = context.interactionsByAuthor?.get(authorId)
  if (interactions) {
    const reactions = interactions.reactions || 0
    const comments = interactions.comments || 0
    const messages = interactions.messages || 0
    const views = interactions.views || 0
    // Weighted sum, normalize to 0..1
    // Reactions:1, Comments:2, Messages:3, Views:0.05
    const raw = reactions * 1 + comments * 2 + messages * 3 + views * 0.05
    const normalized = Math.min(raw / 20, 1) // 20 points to saturate
    score += normalized * 0.6
  }

  // Clamp 0..1
  return Math.max(0, Math.min(1, score))
}

/** Calculate content-type preference score (0..1) for this post */
function calculateContentTypePreference(
  post: BlogPost,
  context?: UserRankingContext,
): number {
  if (!context?.contentTypePreference) return 0
  const kind = getPostContentKind(post)
  const prefs = context.contentTypePreference
  const total = (prefs.photo || 0) + (prefs.video || 0) + (prefs.text || 0)
  if (total <= 0) return 0
  const value = kind === "photo" ? prefs.photo : kind === "video" ? prefs.video : prefs.text
  // Return normalized share for this kind
  return Math.max(0, Math.min(1, value / total))
}

/** Extract lowercase topic tokens from a post (hashtags + tags) */
function extractPostTopics(post: BlogPost): string[] {
  const set = new Set<string>()
  ;(post.hashtags || []).forEach((h) => {
    if (typeof h === "string" && h.trim()) set.add(h.trim().toLowerCase())
  })
  ;(post.tags || []).forEach((t) => {
    if (typeof t === "string" && t.trim()) set.add(t.trim().toLowerCase())
  })
  // Parse inline hashtags in content: #topic
  if (typeof post.content === "string" && post.content.includes("#")) {
    const matches = post.content.match(/#([\p{L}\p{N}_-]+)/gu) || []
    matches.forEach((m) => set.add(m.replace(/^#/, "").toLowerCase()))
  }
  return Array.from(set)
}

/** Calculate topic relevance (0..1) based on user's interests and past topics */
function calculateTopicRelevance(
  post: BlogPost,
  context?: UserRankingContext,
): number {
  if (!context) return 0
  const topics = extractPostTopics(post)
  if (topics.length === 0) return 0

  let score = 0

  // Match against explicit user interests (exact term match)
  if (context.userInterests && context.userInterests.size > 0) {
    const interestMatches = topics.filter((t) => context.userInterests!.has(t))
    if (interestMatches.length > 0) {
      score += Math.min(0.3 + interestMatches.length * 0.05, 0.5)
    }
  }

  // Match against learned topic preferences (frequency map)
  if (context.topicPreferences && context.topicPreferences.size > 0) {
    let total = 0
    context.topicPreferences.forEach((v) => (total += v))
    if (total > 0) {
      let prefScore = 0
      topics.forEach((t) => {
        const v = context.topicPreferences!.get(t)
        if (v && v > 0) {
          prefScore += v / total
        }
      })
      // Normalize and cap
      score += Math.min(prefScore, 0.7)
    }
  }

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
  config: Partial<RankingConfig> = {},
  userContext?: UserRankingContext,
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
  const affinityScore = calculateAffinity(post, userContext)
  const contentTypePrefScore = calculateContentTypePreference(post, userContext)
  const topicRelevanceScore = calculateTopicRelevance(post, userContext)

  // Weighted combination
  // For posts without place tags, proximity is 0, so only time-decay and engagement count
  const totalWeight =
    finalConfig.timeDecayWeight +
    finalConfig.engagementWeight +
    (proximityScore > 0 ? finalConfig.proximityWeight : 0) +
    (affinityScore > 0 ? finalConfig.affinityWeight : 0) +
    (contentTypePrefScore > 0 ? finalConfig.contentTypePreferenceWeight : 0) +
    (topicRelevanceScore > 0 ? finalConfig.topicRelevanceWeight : 0)

  const normalizedWeights = {
    timeDecay: finalConfig.timeDecayWeight / totalWeight,
    engagement: finalConfig.engagementWeight / totalWeight,
    proximity: proximityScore > 0 ? finalConfig.proximityWeight / totalWeight : 0,
    affinity: affinityScore > 0 ? finalConfig.affinityWeight / totalWeight : 0,
    contentType: contentTypePrefScore > 0 ? finalConfig.contentTypePreferenceWeight / totalWeight : 0,
    topic: topicRelevanceScore > 0 ? finalConfig.topicRelevanceWeight / totalWeight : 0,
  }

  const finalScore =
    timeDecayScore * normalizedWeights.timeDecay +
    engagementScore * normalizedWeights.engagement +
    proximityScore * normalizedWeights.proximity +
    affinityScore * normalizedWeights.affinity +
    contentTypePrefScore * normalizedWeights.contentType +
    topicRelevanceScore * normalizedWeights.topic

  // Boost Question posts to drive visibility and answers
  let boost = 1
  if ((post as any).postType === 'question') {
    const createdMs = new Date(post.createdAt).getTime()
    const ageHours = (Date.now() - createdMs) / (1000 * 60 * 60)
    boost = ageHours <= 72 ? 1.2 : 1.08
  }

  return finalScore * boost
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
  config: Partial<RankingConfig> = {},
  userContext?: UserRankingContext,
): BlogPost[] {
  // Precompute share counts, save counts, and author follower counts to avoid O(N^2)
  const allPosts = getBlogPosts()
  const shareCounts = new Map<string, number>()
  for (const p of allPosts) {
    const origin = (p as any).sharedFromPostId as string | undefined
    if (origin) {
      shareCounts.set(origin, (shareCounts.get(origin) || 0) + 1)
    }
  }

  const users = getUsers()
  const saveCounts = new Map<string, number>()
  try {
    // Use isPostSaved for each user to count saves per post
    for (const u of users) {
      for (const p of posts) {
        try {
          if (isPostSaved(u.id, p.id)) {
            saveCounts.set(p.id, (saveCounts.get(p.id) || 0) + 1)
          }
        } catch {}
      }
    }
  } catch {}

  const authorFollowerCounts = new Map<string, number>()
  for (const u of users) {
    authorFollowerCounts.set(u.id, (u.followers?.length || 0))
  }
  const viewerId = userContext?.currentUserId
  const following = userContext?.followingIds ?? new Set<string>()
  const muted = userContext?.mutedKeywords || []
  const localReportCounts = getLocalReportCounts()
  const hiddenTopics = getHiddenTopics(viewerId)
  const engagementCache = new Map<string, number>()

  const scoredPosts = posts
    .filter((post) => {
      // Exclude entirely if user muted keywords match
      if (viewerId && containsMutedKeywords(post, muted)) return false
      return true
    })
    .map((post) => {
    const commentCount = commentCounts.get(post.id) || 0
    const place = post.placeId ? places.get(post.placeId) || null : null
    const ageHours = (Date.now() - new Date(post.createdAt).getTime()) / (1000 * 60 * 60)
    let score: number
    if (ageHours >= 1 && typeof (post as any).relevanceScore === 'number') {
      // Use precomputed score for older posts
      score = (post as any).relevanceScore as number
    } else {
      // Compute on-the-fly for recent posts (< 1h) or when score missing
      score = computePseudocodeRankingScore(
        post,
        commentCount,
        place,
        userLocation,
        config,
        userContext,
        { shareCounts, saveCounts, authorFollowerCounts }
      )
    }

    // Apply negative signals as multiplicative penalties
    let penalty = 1

    // Hidden similar topics → strong demotion (80%)
    if (viewerId && matchesHiddenTopics(post, hiddenTopics)) {
      penalty *= 0.2
    }

    // Rare engagement with author (only if following)
    if (viewerId && following.has(post.authorId)) {
      let ratio = engagementCache.get(post.authorId)
      if (ratio === undefined) {
        ratio = computeAuthorEngagementRatio(viewerId, post.authorId, RARE_ENGAGEMENT_LOOKBACK_DAYS)
        engagementCache.set(post.authorId, ratio)
      }
      if (ratio < 0.1) {
        penalty *= 0.5
      }
    }

    // Reported by multiple users OR flagged → demote significantly
    const reportCount = getReportCount(post, localReportCounts)
    if ((reportCount >= REPORT_DEMOTION_THRESHOLD) || post.queueStatus === "flagged") {
      penalty *= 0.3
    }

    // Low-quality signals
    if (isVeryShortNoMedia(post)) {
      penalty *= 0.6
    }
    if (hasExcessiveHashtags(post)) {
      penalty *= 0.5
    }
    if (hasClickbait(post)) {
      penalty *= 0.6
    }

    score *= penalty
    return { post, score }
  })

  // Sort by score descending
  scoredPosts.sort((a, b) => b.score - a.score)

  return scoredPosts.map((item) => item.post)
}

// Extended extras used to compute on-the-fly engagement metrics
interface Extras {
  shareCounts: Map<string, number>
  saveCounts: Map<string, number>
  authorFollowerCounts: Map<string, number>
}

/**
 * Override the core scoring to follow a simplified, multiplicative model:
 * base = (likes*1 + comments*3 + shares*2.5 + saves*1.5) [normalized] * recency_multiplier
 * final = base * (1 + affinity) * (0.5 + contentTypePref) * (1 + topicScore/10)
 */
function computePseudocodeRankingScore(
  post: BlogPost,
  commentCount: number,
  place: Place | null,
  userLocation: { lat: number; lng: number } | null,
  config: Partial<RankingConfig>,
  userContext: UserRankingContext | undefined,
  extras: Extras,
): number {
  // Recency
  const recencyMult = piecewiseRecencyMultiplier(post.createdAt)

  // Likes/reactions
  const reactionsTotal = post.reactions
    ? Object.values(post.reactions).reduce((sum, arr) => sum + (arr?.length || 0), 0)
    : (post.likes?.length || 0)

  // Shares and saves
  const shares = extras.shareCounts.get(post.id) || 0
  const saves = extras.saveCounts.get(post.id) || 0

  // Engagement per pseudocode
  let engagement = reactionsTotal * 1.0 + commentCount * 3.0 + shares * 2.5 + saves * 1.5

  // Normalize by author follower count to prevent absolute dominance
  const followers = extras.authorFollowerCounts.get(post.authorId) || 0
  if (followers > 1000) {
    const denom = Math.log10(followers)
    if (denom > 0) engagement = engagement / denom
  }

  const base = engagement * recencyMult

  // Affinity boost (0..1 -> 1..2)
  const affinity = calculateAffinity(post, userContext)
  const affinityBoost = 1 + affinity

  // Content-type preference (0..1 -> 0.5..1.5)
  const ctp = calculateContentTypePreference(post, userContext)
  const typeBoost = 0.5 + ctp

  // Topic relevance boost: sum raw topic prefs for hashtags then /10
  let topicScoreRaw = 0
  if (userContext?.topicPreferences) {
    const topics = getAllHashtags(post).map((t) => t.toLowerCase())
    for (const t of topics) {
      topicScoreRaw += userContext.topicPreferences.get(t) || 0
    }
  }
  const topicBoost = 1 + topicScoreRaw / 10

  let finalScore = base * affinityBoost * typeBoost * topicBoost

  // Mild proximity consideration: slight bump if very close (retain some local feel)
  const proximityScore = calculateProximity(post, place, userLocation)
  if (proximityScore > 0) {
    finalScore *= 1 + Math.min(proximityScore * 0.2, 0.2)
  }

  return finalScore
}
