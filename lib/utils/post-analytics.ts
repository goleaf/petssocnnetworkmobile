import { getBlogPostById, getCommentsByPostId } from "@/lib/storage"
import type {
  PostAnalytics,
  PostAnalyticsPeriod,
  PostAudienceSegment,
  PostDailyMetric,
  PostEngagementBreakdown,
  PostPerformanceTrend,
  PostReactionBreakdown,
  PostTrafficSource,
  ReactionType,
} from "@/lib/types"

const REACTION_TYPES: ReactionType[] = ["like", "love", "laugh", "wow", "sad", "angry"]

function createSeededRandom(seed: string): () => number {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = Math.imul(31, hash) + seed.charCodeAt(i)
    hash |= 0
  }
  return () => {
    hash ^= hash << 13
    hash ^= hash >> 17
    hash ^= hash << 5
    const result = (hash >>> 0) / 0xffffffff
    return result === 0 ? 0.0001 : result
  }
}

function getPeriodScale(period: PostAnalyticsPeriod, rng: () => number): number {
  const base =
    period === 7 ? 0.45 : period === 30 ? 1 : period === 90 ? 2.2 : 3.0
  const jitter = 0.88 + rng() * 0.28
  return Math.max(0.2, base * jitter)
}

function scaleBreakdown(
  base: PostEngagementBreakdown,
  factor: number
): PostEngagementBreakdown {
  return {
    reactions: Math.max(0, Math.round(base.reactions * factor)),
    comments: Math.max(0, Math.round(base.comments * factor)),
    shares: Math.max(1, Math.round(base.shares * factor)),
    saves: Math.max(1, Math.round(base.saves * factor)),
    linkClicks: Math.max(1, Math.round(base.linkClicks * factor)),
  }
}

function generateReactionBreakdown(
  baseReactions: Record<ReactionType, number>,
  factor: number
): PostReactionBreakdown[] {
  const breakdown = REACTION_TYPES.map((type) => ({
    type,
    value: Math.max(0, Math.round((baseReactions[type] ?? 0) * factor)),
  }))
  const desiredTotal = breakdown.reduce((sum, item) => sum + item.value, 0)
  const targetTotal = Math.max(
    0,
    Math.round(
      REACTION_TYPES.reduce((sum, type) => sum + (baseReactions[type] ?? 0), 0) *
        factor,
    ),
  )
  const diff = targetTotal - desiredTotal
  if (diff !== 0 && breakdown.length > 0) {
    breakdown[0].value = Math.max(0, breakdown[0].value + diff)
  }
  return breakdown
}

function generateDailyPerformance(
  totalViews: number,
  totalImpressions: number,
  totalEngagements: number,
  reach: number,
  period: PostAnalyticsPeriod,
  rng: () => number
): PostDailyMetric[] {
  const periodDays = period === "lifetime" ? 30 : period
  const pointCount =
    period === 7 ? 7 : period === 30 ? 14 : period === 90 ? 12 : 12
  const interval = Math.max(1, Math.round(periodDays / pointCount))
  const baseViews = totalViews / pointCount
  const baseImpressions = totalImpressions / pointCount
  const baseEngagements = totalEngagements / pointCount
  const baseReach = reach / pointCount
  const data: PostDailyMetric[] = []
  const now = new Date()

  for (let index = pointCount - 1; index >= 0; index--) {
    const date = new Date(now)
    date.setDate(now.getDate() - index * interval)
    const views = Math.max(0, Math.round(baseViews * (0.75 + rng() * 0.5)))
    const impressions = Math.max(
      0,
      Math.round(baseImpressions * (0.85 + rng() * 0.4)),
    )
    const engagements = Math.max(
      0,
      Math.round(baseEngagements * (0.7 + rng() * 0.6)),
    )
    const dailyReach = Math.max(
      0,
      Math.round(baseReach * (0.8 + rng() * 0.4)),
    )
    data.push({
      date: date.toISOString(),
      views,
      impressions,
      engagements,
      reach: Math.min(views, dailyReach),
    })
  }

  return data
}

function generateTrafficSources(rng: () => number): PostTrafficSource[] {
  const sources = ["Home feed", "Profile", "Explore", "Group shares", "External"]
  const weights = sources.map(() => 0.6 + rng() * 1.4)
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0)

  let percentages = weights.map(
    (weight) => Math.round((weight / totalWeight) * 1000) / 10,
  )
  const sum = percentages.reduce((acc, value) => acc + value, 0)
  const diff = Math.round((100 - sum) * 10) / 10
  percentages[0] = Math.max(0, Math.round((percentages[0] + diff) * 10) / 10)

  return sources.map((source, index) => ({
    source,
    value: Number(percentages[index].toFixed(1)),
  }))
}

function generateAudienceSegments(
  total: number,
  rng: () => number
): PostAudienceSegment[] {
  if (total <= 0) {
    return [
      { label: "Followers", value: 0 },
      { label: "Non-followers", value: 0 },
      { label: "New visitors", value: 0 },
    ]
  }

  let remaining = total
  const followers = Math.min(
    remaining,
    Math.round(total * (0.4 + rng() * 0.15)),
  )
  remaining -= followers

  const nonFollowers = Math.min(
    remaining,
    Math.round(total * (0.3 + rng() * 0.12)),
  )
  remaining -= nonFollowers

  const newVisitors = Math.max(0, total - followers - nonFollowers)

  return [
    { label: "Followers", value: followers },
    { label: "Non-followers", value: nonFollowers },
    { label: "New visitors", value: newVisitors },
  ]
}

function generateTrend(rng: () => number): PostPerformanceTrend {
  const compute = () =>
    Math.round(((rng() - 0.45) * 18) * 10) / 10 // Slight positive bias
  return {
    viewsChange: compute(),
    engagementsChange: compute(),
    reachChange: compute(),
  }
}

function ensurePositive(value: number, minimum: number): number {
  return value < minimum ? minimum : value
}

export function getPostAnalytics(
  postId: string,
  period: PostAnalyticsPeriod = 30
): PostAnalytics | null {
  const post = getBlogPostById(postId)
  if (!post) return null

  const comments = getCommentsByPostId(postId)
  const rng = createSeededRandom(`${postId}:${period}`)

  const baseReactions: Record<ReactionType, number> = REACTION_TYPES.reduce(
    (acc, type) => {
      const entries = post.reactions?.[type]
      acc[type] = Array.isArray(entries) ? entries.length : 0
      return acc
    },
    {} as Record<ReactionType, number>,
  )

  let totalReactions = REACTION_TYPES.reduce(
    (sum, type) => sum + (baseReactions[type] ?? 0),
    0,
  )

  if (totalReactions === 0) {
    const weights = REACTION_TYPES.map(() => 0.1 + rng() * 0.9)
    const weightSum = weights.reduce((sum, weight) => sum + weight, 0)
    const fallbackTotal = Math.max(
      post.likes?.length ?? 0,
      Math.round(10 + rng() * 30),
    )
    REACTION_TYPES.forEach((type, index) => {
      baseReactions[type] = Math.round(
        (weights[index] / weightSum) * fallbackTotal,
      )
    })
    const reactionSum = REACTION_TYPES.reduce(
      (sum, type) => sum + baseReactions[type],
      0,
    )
    const diff = fallbackTotal - reactionSum
    if (diff !== 0) {
      baseReactions.like = ensurePositive((baseReactions.like ?? 0) + diff, 0)
    }
    totalReactions = fallbackTotal
  }

  const commentCount = comments.length

  const baseBreakdown: PostEngagementBreakdown = {
    reactions: totalReactions,
    comments: ensurePositive(
      Math.max(commentCount, Math.round(commentCount * (0.85 + rng() * 0.35))),
      commentCount > 0 ? 1 : 0,
    ),
    shares: ensurePositive(
      Math.round(totalReactions * (0.25 + rng() * 0.2)),
      totalReactions > 0 ? 1 : 0,
    ),
    saves: ensurePositive(
      Math.round(totalReactions * (0.18 + rng() * 0.18)),
      totalReactions > 0 ? 1 : 0,
    ),
    linkClicks: ensurePositive(
      Math.round(
        (totalReactions + Math.max(commentCount, 1)) *
          (0.35 + rng() * 0.25),
      ),
      totalReactions > 0 || commentCount > 0 ? 1 : 0,
    ),
  }

  const scaleFactor = getPeriodScale(period, rng)
  const breakdown = scaleBreakdown(baseBreakdown, scaleFactor)
  const totalEngagements =
    breakdown.reactions +
    breakdown.comments +
    breakdown.shares +
    breakdown.saves +
    breakdown.linkClicks

  const totalViews = Math.max(
    Math.round(
      totalEngagements * (4.5 + rng() * 1.8) + scaleFactor * 120 + 90,
    ),
    totalEngagements + 50,
  )

  const totalImpressions = Math.max(
    totalViews + Math.round(totalViews * (0.08 + rng() * 0.2)) + 10,
    totalViews + 25,
  )

  const reach = Math.min(
    totalViews,
    Math.max(
      Math.round(totalViews * (0.62 + rng() * 0.2)),
      Math.round(totalEngagements * (1.1 + rng() * 0.4)),
    ),
  )

  const uniqueViewers = Math.min(
    reach,
    Math.max(Math.round(reach * (0.82 + rng() * 0.12)), Math.round(reach * 0.7)),
  )

  const engagementRate =
    totalViews > 0 ? Number(((totalEngagements / totalViews) * 100).toFixed(2)) : 0
  const clickThroughRate =
    totalImpressions > 0
      ? Number(((breakdown.linkClicks / totalImpressions) * 100).toFixed(2))
      : 0

  const reactionsByType = generateReactionBreakdown(baseReactions, scaleFactor)
  const dailyPerformance = generateDailyPerformance(
    totalViews,
    totalImpressions,
    totalEngagements,
    reach,
    period,
    rng,
  )
  const trafficSources = generateTrafficSources(rng)
  const audienceSegments = generateAudienceSegments(uniqueViewers, rng)
  const trend = generateTrend(rng)
  const averageViewDuration =
    Math.round((35 + rng() * 55) * 10) / 10 // seconds

  return {
    postId,
    period,
    totalViews,
    totalImpressions,
    reach,
    uniqueViewers,
    totalEngagements,
    engagementRate,
    clickThroughRate,
    averageViewDuration,
    breakdown,
    reactionsByType,
    dailyPerformance,
    audienceSegments,
    trafficSources,
    trend,
  }
}
