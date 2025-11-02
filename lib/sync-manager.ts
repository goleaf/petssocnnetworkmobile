import type { SyncStatus, CachedArticle, CachedImage } from "./types"
import { cacheArticle, getCachedArticle } from "./offline-cache"
import type { BlogPost, WikiArticle } from "./types"

class SyncManager {
  private onlineStatus: boolean = typeof navigator !== "undefined" ? navigator.onLine : true
  private listeners: Set<(status: SyncStatus) => void> = new Set()
  private syncInProgress: boolean = false
  private lastSyncAt?: string
  private pendingSyncCount: number = 0
  private lastError?: string

  constructor() {
    if (typeof window !== "undefined") {
      window.addEventListener("online", this.handleOnline.bind(this))
      window.addEventListener("offline", this.handleOffline.bind(this))
    }
  }

  private async handleOnline() {
    this.onlineStatus = true
    this.notifyListeners()
    // Sync on reconnect
    await this.sync()
  }

  private async handleOffline() {
    this.onlineStatus = false
    this.notifyListeners()
  }

  getStatus(): SyncStatus {
    return {
      isOnline: this.onlineStatus,
      lastSyncAt: this.lastSyncAt,
      pendingSyncCount: this.pendingSyncCount,
      syncInProgress: this.syncInProgress,
      lastError: this.lastError,
    }
  }

  async sync(): Promise<void> {
    if (this.syncInProgress || !this.onlineStatus) {
      return
    }

    this.syncInProgress = true
    this.notifyListeners()

    try {
      // Sync logic would go here
      // For now, just update timestamp
      this.lastSyncAt = new Date().toISOString()
      this.pendingSyncCount = 0
      this.lastError = undefined
    } catch (error) {
      this.lastError = error instanceof Error ? error.message : "Unknown error"
      console.error("Sync failed:", error)
    } finally {
      this.syncInProgress = false
      this.notifyListeners()
    }
  }

  subscribe(listener: (status: SyncStatus) => void): () => void {
    this.listeners.add(listener)
    listener(this.getStatus()) // Send current status immediately

    return () => {
      this.listeners.delete(listener)
    }
  }

  private notifyListeners() {
    const status = this.getStatus()
    this.listeners.forEach((listener) => listener(status))
  }

  isOnline(): boolean {
    return this.onlineStatus
  }

  async prefetchArticles(articles: (BlogPost | WikiArticle)[]): Promise<void> {
    if (!this.onlineStatus) {
      return
    }

    try {
      await Promise.all(
        articles.map(async (article) => {
          const type = this.detectArticleType(article)
          if (type) {
            await cacheArticle(article, type)
          }
        })
      )
    } catch (error) {
      console.error("Failed to prefetch articles:", error)
    }
  }

  private detectArticleType(article: BlogPost | WikiArticle): "blog" | "wiki" | null {
    if ("category" in article && "coverImage" in article && "views" in article) {
      return "wiki"
    }
    if ("petId" in article && "authorId" in article && "tags" in article) {
      return "blog"
    }
    return null
  }
}

// Singleton instance
export const syncManager = new SyncManager()

// Helper to format cache size
export function formatCacheSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
}

