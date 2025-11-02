import type { Mission } from "@/lib/types"
import { getStorage } from "@/lib/storage"
import { getWikiArticles } from "@/lib/storage"
import { getBlogPosts } from "@/lib/storage"
import { getPlaces } from "@/lib/storage"

/**
 * Mission system for gamification and community engagement
 */

export interface Mission {
  id: string
  title: string
  description: string
  target: number
  currentProgress?: number
  category: "wiki" | "social" | "community" | "content"
  reward?: string
  actionUrl?: string
  actionLabel?: string
  expiresAt?: string
}

const DEFAULT_MISSIONS: Mission[] = [
  {
    id: "add-3-photos-dog-parks-austin",
    title: "Add 3 photos for Dog Parks in Austin",
    description: "Help others discover great dog parks by adding photos",
    target: 3,
    category: "content",
    reward: "500 points",
    actionUrl: "/places/create",
    actionLabel: "Add Photo",
  },
  {
    id: "create-first-wiki-article",
    title: "Create your first wiki article",
    description: "Share your knowledge with the community",
    target: 1,
    category: "wiki",
    reward: "1000 points + Contributor Badge",
    actionUrl: "/wiki/create",
    actionLabel: "Create Article",
  },
  {
    id: "edit-5-wiki-articles",
    title: "Edit 5 wiki articles",
    description: "Help improve existing articles",
    target: 5,
    category: "wiki",
    reward: "750 points",
    actionUrl: "/wiki",
    actionLabel: "Browse Articles",
  },
  {
    id: "complete-care-checklist",
    title: "Complete pet care checklist",
    description: "Mark off all items in your pet's care checklist",
    target: 7,
    category: "community",
    reward: "300 points",
    actionUrl: "/pet",
    actionLabel: "View Checklist",
  },
  {
    id: "share-5-posts",
    title: "Share 5 posts",
    description: "Share helpful posts with your network",
    target: 5,
    category: "social",
    reward: "250 points",
    actionUrl: "/feed",
    actionLabel: "View Feed",
  },
]

function getMissionProgress(missionId: string, userId?: string): number {
  const storageKey = `mission_${missionId}`
  const saved = getStorage<number>(storageKey)
  if (saved !== null) return saved
  
  // Calculate progress based on mission type
  switch (missionId) {
    case "add-3-photos-dog-parks-austin": {
      const places = getPlaces()
      const austinPlaces = places.filter(
        (p) =>
          p.location?.city?.toLowerCase().includes("austin") &&
          p.photos &&
          p.photos.length > 0
      )
      return Math.min(austinPlaces.length, 3)
    }
    
    case "create-first-wiki-article": {
      if (!userId) return 0
      const articles = getWikiArticles()
      const userArticles = articles.filter((a) => a.authorId === userId)
      return Math.min(userArticles.length, 1)
    }
    
    case "edit-5-wiki-articles": {
      if (!userId) return 0
      const articles = getWikiArticles()
      let editCount = 0
      articles.forEach((article) => {
        // Check revisions (simplified - in real app would check revision history)
        if (article.authorId === userId) editCount++
      })
      return Math.min(editCount, 5)
    }
    
    case "share-5-posts": {
      if (!userId) return 0
      const posts = getBlogPosts()
      const userPosts = posts.filter((p) => p.authorId === userId)
      return Math.min(userPosts.length, 5)
    }
    
    default:
      return 0
  }
}

export function getAvailableMissions(userId?: string): Mission[] {
  const now = new Date()
  
  return DEFAULT_MISSIONS.map((mission) => {
    // Check if mission is expired
    if (mission.expiresAt && new Date(mission.expiresAt) < now) {
      return null
    }
    
    // Get current progress
    const progress = getMissionProgress(mission.id, userId)
    
    return {
      ...mission,
      currentProgress: progress,
    }
  }).filter((m): m is Mission => m !== null)
}

export function updateMissionProgress(missionId: string, progress: number): void {
  const storageKey = `mission_${missionId}`
  // Note: This would use setStorage in a real implementation
  // For now, we're using localStorage directly via getStorage/setStorage
  localStorage.setItem(storageKey, JSON.stringify(progress))
}

