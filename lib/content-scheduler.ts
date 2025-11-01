import type { ScheduledPost } from "./types"

const STORAGE_KEY = "pet_social_scheduled_posts"

function normalizeScheduledPost(post: ScheduledPost | (Partial<ScheduledPost> & { id: string; userId: string })): ScheduledPost {
  const status: ScheduledPost["status"] =
    post.status && ["scheduled", "published", "missed", "canceled"].includes(post.status)
      ? post.status
      : "scheduled"

  const contentType: ScheduledPost["contentType"] =
    post.contentType && ["blog", "feed", "story"].includes(post.contentType)
      ? post.contentType
      : "feed"

  const scheduledDate = post.scheduledAt ? new Date(post.scheduledAt) : new Date()
  const createdDate = post.createdAt ? new Date(post.createdAt) : new Date()
  const updatedDate = post.updatedAt ? new Date(post.updatedAt) : createdDate

  const safeScheduledAt = Number.isFinite(scheduledDate.getTime()) ? scheduledDate : new Date()
  const safeCreatedAt = Number.isFinite(createdDate.getTime()) ? createdDate : new Date()
  const safeUpdatedAt = Number.isFinite(updatedDate.getTime()) ? updatedDate : safeCreatedAt

  return {
    id: String(post.id),
    userId: String(post.userId),
    title: post.title || "Untitled Post",
    contentType,
    scheduledAt: safeScheduledAt.toISOString(),
    status,
    targetAudience: post.targetAudience || undefined,
    petId: post.petId || undefined,
    postId: post.postId || undefined,
    notes: post.notes || undefined,
    performanceScore:
      typeof post.performanceScore === "number" && Number.isFinite(post.performanceScore)
        ? post.performanceScore
        : undefined,
    recommendationReason: post.recommendationReason || undefined,
    createdAt: safeCreatedAt.toISOString(),
    updatedAt: safeUpdatedAt.toISOString(),
  }
}

function readStorage(): ScheduledPost[] {
  if (typeof window === "undefined") return []
  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) return []

  try {
    const parsed = JSON.parse(raw) as ScheduledPost[]
    return parsed.map(normalizeScheduledPost)
  } catch (error) {
    console.error("Failed to parse scheduled posts from storage", error)
    return []
  }
}

function writeStorage(posts: ScheduledPost[]) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(posts))
}

export function getScheduledPosts(): ScheduledPost[] {
  return readStorage()
}

export function getScheduledPostById(id: string): ScheduledPost | undefined {
  return readStorage().find((post) => post.id === id)
}

export function getScheduledPostsByUserId(userId: string): ScheduledPost[] {
  return readStorage()
    .filter((post) => post.userId === userId)
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
}

export function addScheduledPost(post: ScheduledPost) {
  if (typeof window === "undefined") return
  const posts = readStorage()
  const normalized = normalizeScheduledPost(post)
  posts.push(normalized)
  writeStorage(posts)
}

export function updateScheduledPost(id: string, updates: Partial<ScheduledPost>) {
  if (typeof window === "undefined") return
  const posts = readStorage()
  const index = posts.findIndex((post) => post.id === id)
  if (index === -1) return

  const updated: ScheduledPost = normalizeScheduledPost({
    ...posts[index],
    ...updates,
    id: posts[index].id,
    userId: posts[index].userId,
    updatedAt: new Date().toISOString(),
  })

  posts[index] = updated
  writeStorage(posts)
}

export function deleteScheduledPost(id: string) {
  if (typeof window === "undefined") return
  const posts = readStorage()
  const filtered = posts.filter((post) => post.id !== id)
  writeStorage(filtered)
}

export function upsertScheduledPost(post: ScheduledPost) {
  if (typeof window === "undefined") return
  const posts = readStorage()
  const index = posts.findIndex((existing) => existing.id === post.id)
  const normalized = normalizeScheduledPost(post)

  if (index === -1) {
    posts.push(normalized)
  } else {
    posts[index] = normalized
  }

  writeStorage(posts)
}
