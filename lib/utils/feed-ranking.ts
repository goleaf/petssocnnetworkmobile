import type { BlogPost } from "@/lib/types"

export interface EngagementCounts {
  likes: number
  comments: number
  shares: number
  saves: number
}

/**
 * Compute a recency multiplier based on post age.
 * Buckets (inclusive of lower bound, exclusive of upper):
 * - <1 hour: 1.0
 * - 1–3 hours: 0.9
 * - 3–6 hours: 0.7
 * - 6–12 hours: 0.5
 * - 12–24 hours: 0.3
 * - 1–2 days: 0.1
 * - >2 days: 0.05
 */
export function computeRecencyMultiplier(createdAt: string, now: Date = new Date()): number {
  const created = new Date(createdAt).getTime()
  const ageMs = Math.max(0, now.getTime() - created)
  const hourMs = 60 * 60 * 1000
  const dayMs = 24 * hourMs

  if (ageMs < 1 * hourMs) return 1.0
  if (ageMs < 3 * hourMs) return 0.9
  if (ageMs < 6 * hourMs) return 0.7
  if (ageMs < 12 * hourMs) return 0.5
  if (ageMs < 24 * hourMs) return 0.3
  if (ageMs < 2 * dayMs) return 0.1
  return 0.05
}

/**
 * Compute a weighted engagement score from counts.
 * Weights: likes 0.2, comments 0.3, shares 0.25, saves 0.15.
 */
export function computeEngagementScore(counts: EngagementCounts): number {
  const { likes, comments, shares, saves } = counts
  return likes * 0.2 + comments * 0.3 + shares * 0.25 + saves * 0.15
}

/**
 * Compute final score combining engagement and recency multiplier.
 */
export function scorePost(
  post: Pick<BlogPost, "createdAt">,
  counts: EngagementCounts,
  now: Date = new Date(),
): number {
  const base = computeEngagementScore(counts)
  const decay = computeRecencyMultiplier(post.createdAt, now)
  return base * decay
}

/**
 * Sort posts by descending score; ties fall back to createdAt (newest first).
 */
export function sortPostsByScore<
  T extends Pick<BlogPost, "id" | "createdAt">
>(
  posts: T[],
  getCounts: (post: T) => EngagementCounts,
  now: Date = new Date(),
): T[] {
  return [...posts].sort((a, b) => {
    const scoreA = scorePost(a, getCounts(a), now)
    const scoreB = scorePost(b, getCounts(b), now)
    if (scoreA !== scoreB) return scoreB - scoreA
    const dateA = new Date(a.createdAt).getTime()
    const dateB = new Date(b.createdAt).getTime()
    return dateB - dateA
  })
}

