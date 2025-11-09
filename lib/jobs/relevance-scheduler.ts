import { getBlogPosts, getCommentsByPostId, getPlaces, getUsers, isPostSaved, updateBlogPost } from "@/lib/storage"
import type { BlogPost, Place } from "@/lib/types"
import { computePseudocodeRankingScore as _unused, rankPosts } from "@/lib/utils/post-ranking"
import { getBlogPosts as _getAll } from "@/lib/storage"
import { getUsers as _getUsers } from "@/lib/storage"
import { getPlaces as _getPlaces } from "@/lib/storage"
import { getCommentsByPostId as _getComments } from "@/lib/storage"
import { isPostSaved as _isSaved } from "@/lib/storage"
import { calculatePostRankingScore as _legacy } from "@/lib/utils/post-ranking"
import { getBlogPosts as allPosts } from "@/lib/storage"
import { getUsers as allUsers } from "@/lib/storage"

// We will compute a viewer-agnostic relevance score based on recency and engagement
// using the pseudocode model (affinity/topic/type boosts default to neutral when no context is provided).

function hoursSince(iso: string): number {
  return (Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60)
}

export function updateRelevanceScores(windowDays: number = 7): { updated: number; considered: number } {
  const posts = getBlogPosts()
  const users = getUsers()
  const places: Place[] = getPlaces()
  const placesMap = new Map<string, Place>(places.map((p) => [p.id, p]))

  const cutoffMs = Date.now() - windowDays * 24 * 60 * 60 * 1000
  const recent = posts.filter((p) => new Date(p.createdAt).getTime() >= cutoffMs && !(p as any).deletedAt)

  // Precompute share counts
  const shareCounts = new Map<string, number>()
  for (const p of posts) {
    const origin = (p as any).sharedFromPostId as string | undefined
    if (origin) shareCounts.set(origin, (shareCounts.get(origin) || 0) + 1)
  }
  // Save counts (viewer-agnostic)
  const saveCounts = new Map<string, number>()
  try {
    for (const u of users) {
      for (const p of recent) {
        try { if (isPostSaved(u.id, p.id)) saveCounts.set(p.id, (saveCounts.get(p.id) || 0) + 1) } catch {}
      }
    }
  } catch {}
  // Author follower counts
  const authorFollowerCounts = new Map<string, number>()
  for (const u of users) authorFollowerCounts.set(u.id, (u.followers?.length || 0))

  let updated = 0
  for (const p of recent) {
    const place = p.placeId ? placesMap.get(p.placeId) || null : null
    const commentCount = getCommentsByPostId(p.id).length
    // Compute score with no user context (viewer-agnostic)
    const score = (function compute() {
      // Recency multiplier and engagement-based formula with shares/saves normalization
      const reactionsTotal = p.reactions ? Object.values(p.reactions).reduce((s, arr) => s + (arr?.length || 0), 0) : (p.likes?.length || 0)
      const shares = shareCounts.get(p.id) || 0
      const saves = saveCounts.get(p.id) || 0
      // Use the same piecewise + weighted model; to avoid duplication, mirror computePseudocodeRankingScore shape minimally
      // We'll reuse rankPosts' scorer indirectly by calling calculatePostRankingScore-like logic adapted in-rank.
      // For simplicity in this job, compute base via engagement + recency and neutral boosts.
      const now = Date.now()
      const ageHours = (now - new Date(p.createdAt).getTime()) / (1000 * 60 * 60)
      const recencyMult = ageHours < 1 ? 1.0 : ageHours < 3 ? 0.9 : ageHours < 6 ? 0.7 : ageHours < 12 ? 0.5 : ageHours < 24 ? 0.3 : ageHours < 48 ? 0.1 : 0.05
      let engagement = reactionsTotal * 1.0 + commentCount * 3.0 + shares * 2.5 + saves * 1.5
      const followers = authorFollowerCounts.get(p.authorId) || 0
      if (followers > 1000) {
        const denom = Math.log10(followers)
        if (denom > 0) engagement = engagement / denom
      }
      const base = engagement * recencyMult
      // Neutral boosts: affinity=0 -> *1; contentType=0 -> *0.5; topicScore=0 -> *1
      const typeBoost = 0.5
      let s = base * 1 * typeBoost * 1
      // tiny proximity bump if nearby; cannot compute viewer location here, skip
      return s
    })()

    const next: BlogPost = { ...p, relevanceScore: score, relevanceUpdatedAt: new Date().toISOString() }
    updateBlogPost(next)
    updated += 1
  }

  return { updated, considered: recent.length }
}

let started = false
export function ensureRelevanceCron() {
  if (started) return
  started = true
  try {
    setInterval(() => {
      try { updateRelevanceScores(7) } catch {}
    }, 5 * 60 * 1000)
  } catch {
    // ignore
  }
}

