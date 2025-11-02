import type { CachedArticle, CachedImage, SyncStatus, OfflineRead, BlogPost, WikiArticle } from "./types"

const DB_NAME = "pet_social_offline_cache"
const DB_VERSION = 1

const STORES = {
  ARTICLES: "cached_articles",
  IMAGES: "cached_images",
  READS: "offline_reads",
} as const

const MAX_CACHE_SIZE = 100 * 1024 * 1024 // 100MB
const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB per image
const MAX_CACHED_ARTICLES = 500
const MAX_CACHED_IMAGES = 200
const CACHE_EXPIRY_DAYS = 30

let dbInstance: IDBDatabase | null = null
let dbReady: Promise<IDBDatabase>

// Initialize IndexedDB
async function initDB(): Promise<IDBDatabase> {
  if (dbInstance) return dbInstance

  dbReady = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      dbInstance = request.result
      resolve(dbInstance)
    }

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result

      // Create articles store
      if (!db.objectStoreNames.contains(STORES.ARTICLES)) {
        const articleStore = db.createObjectStore(STORES.ARTICLES, { keyPath: "id" })
        articleStore.createIndex("type", "type", { unique: false })
        articleStore.createIndex("cachedAt", "cachedAt", { unique: false })
        articleStore.createIndex("lastAccessed", "lastAccessed", { unique: false })
      }

      // Create images store (Blob storage)
      if (!db.objectStoreNames.contains(STORES.IMAGES)) {
        const imageStore = db.createObjectStore(STORES.IMAGES, { keyPath: "url" })
        imageStore.createIndex("cachedAt", "cachedAt", { unique: false })
        imageStore.createIndex("lastAccessed", "lastAccessed", { unique: false })
      }

      // Create reads tracker
      if (!db.objectStoreNames.contains(STORES.READS)) {
        const readStore = db.createObjectStore(STORES.READS, { keyPath: "articleId" })
        readStore.createIndex("readAt", "readAt", { unique: false })
      }
    }
  })

  return dbReady
}

// Helper to get DB instance
async function getDB(): Promise<IDBDatabase> {
  if (dbInstance) return dbInstance
  return await initDB()
}

// Article Cache Functions

export async function cacheArticle(article: BlogPost | WikiArticle, type: "blog" | "wiki"): Promise<void> {
  try {
    const db = await getDB()
    const tx = db.transaction(STORES.ARTICLES, "readwrite")
    const store = tx.objectStore(STORES.ARTICLES)

    const cached: CachedArticle = {
      id: article.id,
      type,
      data: article,
      cachedAt: new Date().toISOString(),
      lastAccessed: new Date().toISOString(),
      accessCount: 0,
    }

    await new Promise<void>((resolve, reject) => {
      const request = store.put(cached)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })

    await tx.done
    await cleanupOldArticles(db)
  } catch (error) {
    console.error("Failed to cache article:", error)
    throw error
  }
}

export async function getCachedArticle(id: string, type: "blog" | "wiki"): Promise<BlogPost | WikiArticle | null> {
  try {
    const db = await getDB()
    const tx = db.transaction(STORES.ARTICLES, "readonly")
    const store = tx.objectStore(STORES.ARTICLES)

    const cached = await new Promise<CachedArticle | undefined>((resolve, reject) => {
      const request = store.get(id)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })

    await tx.done

    if (!cached || cached.type !== type) return null

    // Check if expired
    const cachedDate = new Date(cached.cachedAt)
    const expiryDate = new Date(cachedDate.getTime() + CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000)
    if (new Date() > expiryDate) {
      await removeCachedArticle(id)
      return null
    }

    // Update access metadata
    await updateArticleAccess(id)

    return cached.data
  } catch (error) {
    console.error("Failed to get cached article:", error)
    return null
  }
}

async function updateArticleAccess(id: string): Promise<void> {
  try {
    const db = await getDB()
    const tx = db.transaction(STORES.ARTICLES, "readwrite")
    const store = tx.objectStore(STORES.ARTICLES)

    const cached = await new Promise<CachedArticle | undefined>((resolve, reject) => {
      const request = store.get(id)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })

    if (cached) {
      cached.lastAccessed = new Date().toISOString()
      cached.accessCount += 1

      await new Promise<void>((resolve, reject) => {
        const request = store.put(cached)
        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      })
    }

    await tx.done
  } catch (error) {
    console.error("Failed to update article access:", error)
  }
}

async function removeCachedArticle(id: string): Promise<void> {
  try {
    const db = await getDB()
    const tx = db.transaction(STORES.ARTICLES, "readwrite")
    const store = tx.objectStore(STORES.ARTICLES)

    await new Promise<void>((resolve, reject) => {
      const request = store.delete(id)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })

    await tx.done
  } catch (error) {
    console.error("Failed to remove cached article:", error)
  }
}

async function cleanupOldArticles(db: IDBDatabase): Promise<void> {
  try {
    const tx = db.transaction(STORES.ARTICLES, "readwrite")
    const store = tx.objectStore(STORES.ARTICLES)

    const allArticles = await new Promise<CachedArticle[]>((resolve, reject) => {
      const request = store.getAll()
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })

    // Sort by last accessed, least recently used first
    allArticles.sort((a, b) => new Date(a.lastAccessed).getTime() - new Date(b.lastAccessed).getTime())

    // Remove oldest if over limit
    if (allArticles.length > MAX_CACHED_ARTICLES) {
      const toRemove = allArticles.slice(0, allArticles.length - MAX_CACHED_ARTICLES)
      for (const article of toRemove) {
        await new Promise<void>((resolve, reject) => {
          const request = store.delete(article.id)
          request.onsuccess = () => resolve()
          request.onerror = () => reject(request.error)
        })
      }
    }

    await tx.done
  } catch (error) {
    console.error("Failed to cleanup old articles:", error)
  }
}

// Image Cache Functions

export async function cacheImage(url: string, blob: Blob): Promise<void> {
  try {
    if (blob.size > MAX_IMAGE_SIZE) {
      console.warn(`Image too large to cache: ${blob.size} bytes`)
      return
    }

    const db = await getDB()
    const tx = db.transaction(STORES.IMAGES, "readwrite")
    const store = tx.objectStore(STORES.IMAGES)

    const cached: CachedImage = {
      url,
      blob,
      cachedAt: new Date().toISOString(),
      lastAccessed: new Date().toISOString(),
      accessCount: 0,
      size: blob.size,
    }

    await new Promise<void>((resolve, reject) => {
      const request = store.put(cached)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })

    await tx.done
    await cleanupOldImages(db)
  } catch (error) {
    console.error("Failed to cache image:", error)
    throw error
  }
}

export async function getCachedImage(url: string): Promise<Blob | null> {
  try {
    const db = await getDB()
    const tx = db.transaction(STORES.IMAGES, "readonly")
    const store = tx.objectStore(STORES.IMAGES)

    const cached = await new Promise<CachedImage | undefined>((resolve, reject) => {
      const request = store.get(url)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })

    await tx.done

    if (!cached) return null

    // Check if expired
    const cachedDate = new Date(cached.cachedAt)
    const expiryDate = new Date(cachedDate.getTime() + CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000)
    if (new Date() > expiryDate) {
      await removeCachedImage(url)
      return null
    }

    // Update access metadata
    await updateImageAccess(url)

    return cached.blob
  } catch (error) {
    console.error("Failed to get cached image:", error)
    return null
  }
}

async function updateImageAccess(url: string): Promise<void> {
  try {
    const db = await getDB()
    const tx = db.transaction(STORES.IMAGES, "readwrite")
    const store = tx.objectStore(STORES.IMAGES)

    const cached = await new Promise<CachedImage | undefined>((resolve, reject) => {
      const request = store.get(url)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })

    if (cached) {
      cached.lastAccessed = new Date().toISOString()
      cached.accessCount += 1

      await new Promise<void>((resolve, reject) => {
        const request = store.put(cached)
        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      })
    }

    await tx.done
  } catch (error) {
    console.error("Failed to update image access:", error)
  }
}

async function removeCachedImage(url: string): Promise<void> {
  try {
    const db = await getDB()
    const tx = db.transaction(STORES.IMAGES, "readwrite")
    const store = tx.objectStore(STORES.IMAGES)

    await new Promise<void>((resolve, reject) => {
      const request = store.delete(url)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })

    await tx.done
  } catch (error) {
    console.error("Failed to remove cached image:", error)
  }
}

async function cleanupOldImages(db: IDBDatabase): Promise<void> {
  try {
    const tx = db.transaction(STORES.IMAGES, "readwrite")
    const store = tx.objectStore(STORES.IMAGES)

    const allImages = await new Promise<CachedImage[]>((resolve, reject) => {
      const request = store.getAll()
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })

    // Sort by last accessed, least recently used first
    allImages.sort((a, b) => new Date(a.lastAccessed).getTime() - new Date(b.lastAccessed).getTime())

    // Remove oldest if over limit
    if (allImages.length > MAX_CACHED_IMAGES) {
      const toRemove = allImages.slice(0, allImages.length - MAX_CACHED_IMAGES)
      for (const image of toRemove) {
        await new Promise<void>((resolve, reject) => {
          const request = store.delete(image.url)
          request.onsuccess = () => resolve()
          request.onerror = () => reject(request.error)
        })
      }
    }

    await tx.done
  } catch (error) {
    console.error("Failed to cleanup old images:", error)
  }
}

// Offline Read Tracking

export async function trackOfflineRead(articleId: string, articleType: "blog" | "wiki", progress?: number): Promise<void> {
  try {
    const db = await getDB()
    const tx = db.transaction(STORES.READS, "readwrite")
    const store = tx.objectStore(STORES.READS)

    const read: OfflineRead = {
      articleId,
      articleType,
      readAt: new Date().toISOString(),
      progress,
    }

    await new Promise<void>((resolve, reject) => {
      const request = store.put(read)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })

    await tx.done
  } catch (error) {
    console.error("Failed to track offline read:", error)
  }
}

export async function getOfflineReads(): Promise<OfflineRead[]> {
  try {
    const db = await getDB()
    const tx = db.transaction(STORES.READS, "readonly")
    const store = tx.objectStore(STORES.READS)

    const reads = await new Promise<OfflineRead[]>((resolve, reject) => {
      const request = store.getAll()
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })

    await tx.done
    return reads.sort((a, b) => new Date(b.readAt).getTime() - new Date(a.readAt).getTime())
  } catch (error) {
    console.error("Failed to get offline reads:", error)
    return []
  }
}

// Cache Statistics

export async function getCacheStats(): Promise<{
  articleCount: number
  imageCount: number
  totalCacheSize: number
  oldestCacheDate: string | null
}> {
  try {
    const db = await getDB()
    const articleTx = db.transaction(STORES.ARTICLES, "readonly")
    const imageTx = db.transaction(STORES.IMAGES, "readonly")

    const articles = await new Promise<CachedArticle[]>((resolve, reject) => {
      const request = articleTx.objectStore(STORES.ARTICLES).getAll()
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })

    const images = await new Promise<CachedImage[]>((resolve, reject) => {
      const request = imageTx.objectStore(STORES.IMAGES).getAll()
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })

    await Promise.all([articleTx.done, imageTx.done])

    const totalSize = images.reduce((sum, img) => sum + img.size, 0)
    const allDates = [
      ...articles.map((a) => new Date(a.cachedAt).getTime()),
      ...images.map((i) => new Date(i.cachedAt).getTime()),
    ]
    const oldest = allDates.length > 0 ? new Date(Math.min(...allDates)).toISOString() : null

    return {
      articleCount: articles.length,
      imageCount: images.length,
      totalCacheSize: totalSize,
      oldestCacheDate: oldest,
    }
  } catch (error) {
    console.error("Failed to get cache stats:", error)
    return {
      articleCount: 0,
      imageCount: 0,
      totalCacheSize: 0,
      oldestCacheDate: null,
    }
  }
}

// Clear Cache

export async function clearCache(): Promise<void> {
  try {
    const db = await getDB()
    const articleTx = db.transaction(STORES.ARTICLES, "readwrite")
    const imageTx = db.transaction(STORES.IMAGES, "readwrite")
    const readTx = db.transaction(STORES.READS, "readwrite")

    await Promise.all([
      new Promise<void>((resolve, reject) => {
        const request = articleTx.objectStore(STORES.ARTICLES).clear()
        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      }),
      new Promise<void>((resolve, reject) => {
        const request = imageTx.objectStore(STORES.IMAGES).clear()
        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      }),
      new Promise<void>((resolve, reject) => {
        const request = readTx.objectStore(STORES.READS).clear()
        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      }),
    ])

    await Promise.all([articleTx.done, imageTx.done, readTx.done])
  } catch (error) {
    console.error("Failed to clear cache:", error)
    throw error
  }
}

