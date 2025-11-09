import type { BlogPost, Pet, User } from "@/lib/types"
import { canViewPost } from "@/lib/utils/privacy"

export type ContentType = "photo" | "video" | "text" | "link"

export interface DiversityOptions {
  windowSize?: number // Sliding window size for per-author caps
  maxPerAuthorInWindow?: number // Max posts by the same author within the window
  maxSameTypeRun?: number // Max consecutive posts of the same content type
}

const DEFAULT_OPTIONS: Required<DiversityOptions> = {
  windowSize: 10,
  maxPerAuthorInWindow: 3,
  maxSameTypeRun: 3,
}

export function classifyContentType(post: BlogPost): ContentType {
  const hasVideo = Boolean(post.media && post.media.videos && post.media.videos.length > 0)
  const hasImage = Boolean(post.media && post.media.images && post.media.images.length > 0)
  const hasLink = Boolean(post.media && post.media.links && post.media.links.length > 0)

  if (hasVideo) return "video"
  if (hasImage) return "photo"
  if (hasLink) return "link"
  return "text"
}

function engagementScore(post: BlogPost): number {
  if (post.reactions) {
    return Object.values(post.reactions).reduce((sum, arr) => sum + (arr?.length || 0), 0)
  }
  return post.likes?.length || 0
}

function isOutsideFollowNetwork(
  post: BlogPost,
  viewer: User,
  allPets: Pet[]
): boolean {
  if (post.authorId === viewer.id) return false
  const isFollowingUser = viewer.following?.includes(post.authorId) ?? false
  if (isFollowingUser) return false
  const pet = allPets.find((p) => p.id === post.petId)
  const isFollowingPet = pet?.followers?.includes(viewer.id) || viewer.followingPets?.includes(post.petId || "")
  return !isFollowingPet
}

/**
 * Reorder posts to enforce diversity:
 * - At most N posts by the same author within the last K items (sliding window)
 * - Limit long runs of the same content type (image/video/text)
 */
export function diversifyPosts(
  basePosts: BlogPost[],
  options: DiversityOptions = {}
): BlogPost[] {
  const { windowSize, maxPerAuthorInWindow, maxSameTypeRun } = {
    ...DEFAULT_OPTIONS,
    ...options,
  }

  const pool = [...basePosts]
  const output: BlogPost[] = []
  const windowAuthors: string[] = []
  const counts = new Map<string, number>()
  let lastType: ContentType | null = null
  let runLen = 0

  // Greedy selection with constraint relaxation
  while (pool.length > 0) {
    let chosenIdx = -1

    // Pass 1: enforce both author window and content type run
    for (let i = 0; i < pool.length; i++) {
      const p = pool[i]
      const authorCount = counts.get(p.authorId) || 0
      const type = classifyContentType(p)
      if (authorCount >= maxPerAuthorInWindow) continue
      if (lastType === type && runLen >= maxSameTypeRun) continue
      chosenIdx = i
      break
    }

    // Pass 2: relax content-type run, keep author constraint
    if (chosenIdx === -1) {
      for (let i = 0; i < pool.length; i++) {
        const p = pool[i]
        const authorCount = counts.get(p.authorId) || 0
        if (authorCount >= maxPerAuthorInWindow) continue
        chosenIdx = i
        break
      }
    }

    // Pass 3: pick the next post regardless (worst-case fallback)
    if (chosenIdx === -1) chosenIdx = 0

    const chosen = pool.splice(chosenIdx, 1)[0]
    output.push(chosen)

    // Update sliding window author counts
    windowAuthors.push(chosen.authorId)
    counts.set(chosen.authorId, (counts.get(chosen.authorId) || 0) + 1)
    if (windowAuthors.length > windowSize) {
      const removed = windowAuthors.shift() as string
      const prev = (counts.get(removed) || 0) - 1
      if (prev <= 0) counts.delete(removed)
      else counts.set(removed, prev)
    }

    // Update type run
    const t = classifyContentType(chosen)
    if (t === lastType) runLen += 1
    else {
      lastType = t
      runLen = 1
    }
  }

  return output
}

/**
 * Inject high-engagement discovery posts (outside follow network) at fixed positions.
 * If a discovery post already appears in the list, it is moved to the target slot.
 */
export function injectDiscovery(
  diversified: BlogPost[],
  discoveryPool: BlogPost[],
  viewer: User,
  allUsers: User[],
  allPets: Pet[],
  positions: number[] = [5, 15, 30, 50]
): BlogPost[] {
  const out = [...diversified]
  const visibleDiscovery = discoveryPool.filter((post) => {
    const author = allUsers.find((u) => u.id === post.authorId)
    if (!author) return false
    return canViewPost(post, author, viewer.id)
  })
  const candidates = visibleDiscovery
    .filter((p) => isOutsideFollowNetwork(p, viewer, allPets))
    .sort((a, b) => engagementScore(b) - engagementScore(a))

  const used = new Set<string>()
  for (const pos of positions) {
    const idx = Math.max(0, pos - 1)
    const candidate = candidates.find((p) => !used.has(p.id))
    if (!candidate) break
    used.add(candidate.id)

    const existingIndex = out.findIndex((p) => p.id === candidate.id)
    if (existingIndex !== -1) out.splice(existingIndex, 1)

    // Ensure array is large enough then insert
    const insertAt = Math.min(idx, out.length)
    out.splice(insertAt, 0, candidate)
  }

  return out
}

/**
 * Convenience: diversify base posts and inject discovery posts from a pool.
 */
export function diversifyAndInjectFeed(
  basePosts: BlogPost[],
  discoveryPool: BlogPost[],
  viewer: User,
  allUsers: User[],
  allPets: Pet[],
  positions: number[] = [5, 15, 30, 50],
  options: DiversityOptions = {}
): BlogPost[] {
  const diversified = diversifyPosts(basePosts, options)
  return injectDiscovery(diversified, discoveryPool, viewer, allUsers, allPets, positions)
}

