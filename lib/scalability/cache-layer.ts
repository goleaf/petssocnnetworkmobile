/**
 * Server-side cache layer with cache-busting on publish
 * Supports Redis, Memcached, or in-memory fallback
 */

/**
 * Cache adapter interface
 */
export interface CacheAdapter {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
  invalidatePattern(pattern: string): Promise<void>;
}

/**
 * In-memory cache adapter (fallback)
 */
class MemoryCacheAdapter implements CacheAdapter {
  private cache: Map<string, { value: unknown; expires: number }> = new Map();

  async get<T>(key: string): Promise<T | null> {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }

    return item.value as T;
  }

  async set<T>(key: string, value: T, ttl: number = 3600): Promise<void> {
    const expires = Date.now() + ttl * 1000;
    this.cache.set(key, { value, expires });
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }

  async invalidatePattern(pattern: string): Promise<void> {
    const regex = new RegExp(pattern.replace('*', '.*'));
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }
}

/**
 * Redis cache adapter
 */
class RedisCacheAdapter implements CacheAdapter {
  private client: any;

  constructor(redisUrl?: string) {
    // Lazy load redis client
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const redis = require('redis');
      this.client = redis.createClient({ url: redisUrl || process.env.REDIS_URL });
      this.client.connect().catch(console.error);
    } catch (error) {
      console.warn('Redis not available, falling back to memory cache');
      return new MemoryCacheAdapter();
    }
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch {
      return null;
    }
  }

  async set<T>(key: string, value: T, ttl: number = 3600): Promise<void> {
    try {
      await this.client.setEx(key, ttl, JSON.stringify(value));
    } catch (error) {
      console.error('Redis set error:', error);
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch (error) {
      console.error('Redis delete error:', error);
    }
  }

  async clear(): Promise<void> {
    try {
      await this.client.flushDb();
    } catch (error) {
      console.error('Redis clear error:', error);
    }
  }

  async invalidatePattern(pattern: string): Promise<void> {
    try {
      const keys = await this.client.keys(pattern.replace('*', '*'));
      if (keys.length > 0) {
        await this.client.del(keys);
      }
    } catch (error) {
      console.error('Redis invalidatePattern error:', error);
    }
  }
}

/**
 * Get cache adapter based on environment
 */
function getCacheAdapter(): CacheAdapter {
  const redisUrl = process.env.REDIS_URL;
  
  if (redisUrl) {
    return new RedisCacheAdapter(redisUrl);
  }

  return new MemoryCacheAdapter();
}

// Singleton cache instance
let cacheAdapter: CacheAdapter | null = null;

function getCache(): CacheAdapter {
  if (!cacheAdapter) {
    cacheAdapter = getCacheAdapter();
  }
  return cacheAdapter;
}

/**
 * Cache key generators
 */
export const CacheKeys = {
  content: (type: string, id: string) => `content:${type}:${id}`,
  contentList: (type: string, filters: string) => `content:${type}:list:${filters}`,
  user: (id: string) => `user:${id}`,
  search: (query: string, filters: string) => `search:${query}:${filters}`,
  tag: (tag: string) => `tag:${tag}`,
};

/**
 * Get cached value
 */
export async function getCached<T>(key: string): Promise<T | null> {
  return getCache().get<T>(key);
}

/**
 * Set cached value
 */
export async function setCached<T>(key: string, value: T, ttl: number = 3600): Promise<void> {
  await getCache().set(key, value, ttl);
}

/**
 * Delete cached value
 */
export async function deleteCached(key: string): Promise<void> {
  await getCache().delete(key);
}

/**
 * Invalidate cache for content type
 */
export async function invalidateContentCache(contentType: string, contentId?: string): Promise<void> {
  const cache = getCache();

  if (contentId) {
    // Invalidate specific content
    await cache.delete(CacheKeys.content(contentType, contentId));
  }

  // Invalidate all lists for this content type
  await cache.invalidatePattern(`content:${contentType}:list:*`);

  // Invalidate search caches
  await cache.invalidatePattern(`search:*`);
}

/**
 * Cache-busting on publish
 * Call this when content is published or updated
 */
export async function bustCacheOnPublish(
  contentType: string,
  contentId: string,
  tags?: string[]
): Promise<void> {
  const cache = getCache();

  // Invalidate content cache
  await cache.delete(CacheKeys.content(contentType, contentId));

  // Invalidate content lists
  await cache.invalidatePattern(`content:${contentType}:list:*`);

  // Invalidate tag caches if tags provided
  if (tags) {
    for (const tag of tags) {
      await cache.delete(CacheKeys.tag(tag));
    }
  }

  // Invalidate search caches
  await cache.invalidatePattern(`search:*`);

  // Increment cache version for client-side cache invalidation
  // This can be stored in a shared cache or database
  const versionKey = 'cache:version';
  const currentVersion = (await cache.get<number>(versionKey)) || 0;
  await cache.set(versionKey, currentVersion + 1, 86400); // 24 hours
}

/**
 * Get cache version (for client-side cache invalidation)
 */
export async function getCacheVersion(): Promise<number> {
  const cache = getCache();
  return (await cache.get<number>('cache:version')) || 0;
}

/**
 * Cache with automatic invalidation
 */
export async function cached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 3600
): Promise<T> {
  const cached = await getCached<T>(key);
  if (cached !== null) {
    return cached;
  }

  const value = await fetcher();
  await setCached(key, value, ttl);
  return value;
}

