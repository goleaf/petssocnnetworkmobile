import { getGroups, getGroupCategories } from "./storage"
import type { Group, GroupCategory } from "./types"

const CACHE_VERSION_KEY = "pet_social_cache_version"
const CACHE_EXPIRY_MS = 5 * 60 * 1000 // 5 minutes

interface CacheData {
  version: number
  timestamp: number
  groups: Group[]
  categories: GroupCategory[]
}

/**
 * Get current cache version from localStorage
 */
function getCacheVersion(): number {
  if (typeof window === "undefined") return 0
  const version = localStorage.getItem(CACHE_VERSION_KEY)
  return version ? parseInt(version, 10) : 1
}

/**
 * Increment cache version when data changes
 */
export function invalidateCache(): void {
  if (typeof window === "undefined") return
  const currentVersion = getCacheVersion()
  localStorage.setItem(CACHE_VERSION_KEY, (currentVersion + 1).toString())
}

/**
 * Check if cache is valid based on version and expiry
 */
function isCacheValid(cacheData: CacheData | null): boolean {
  if (!cacheData) return false
  
  const now = Date.now()
  const age = now - cacheData.timestamp
  
  // Check if cache has expired
  if (age > CACHE_EXPIRY_MS) return false
  
  // Check if cache version matches current version
  return cacheData.version === getCacheVersion()
}

/**
 * Get cached groups data
 */
export function getCachedGroups(): Group[] | null {
  if (typeof window === "undefined") return null
  
  try {
    const cacheDataStr = localStorage.getItem("pet_social_groups_cache")
    if (!cacheDataStr) return null
    
    const cacheData: CacheData = JSON.parse(cacheDataStr)
    
    if (isCacheValid(cacheData)) {
      return cacheData.groups
    }
    
    return null
  } catch (error) {
    console.error("Error reading groups cache:", error)
    return null
  }
}

/**
 * Get cached categories data
 */
export function getCachedCategories(): GroupCategory[] | null {
  if (typeof window === "undefined") return null
  
  try {
    const cacheDataStr = localStorage.getItem("pet_social_groups_cache")
    if (!cacheDataStr) return null
    
    const cacheData: CacheData = JSON.parse(cacheDataStr)
    
    if (isCacheValid(cacheData)) {
      return cacheData.categories
    }
    
    return null
  } catch (error) {
    console.error("Error reading categories cache:", error)
    return null
  }
}

/**
 * Store groups and categories in cache
 */
export function setGroupsCache(groups: Group[], categories: GroupCategory[]): void {
  if (typeof window === "undefined") return
  
  try {
    const cacheData: CacheData = {
      version: getCacheVersion(),
      timestamp: Date.now(),
      groups,
      categories,
    }
    
    localStorage.setItem("pet_social_groups_cache", JSON.stringify(cacheData))
  } catch (error) {
    console.error("Error storing groups cache:", error)
  }
}

/**
 * Get groups with caching
 */
export function getGroupsCached(): Group[] {
  const cached = getCachedGroups()
  if (cached) return cached
  
  const groups = getGroups()
  const categories = getGroupCategories()
  setGroupsCache(groups, categories)
  
  return groups
}

/**
 * Get categories with caching
 */
export function getGroupCategoriesCached(): GroupCategory[] {
  const cached = getCachedCategories()
  if (cached) return cached
  
  const groups = getGroups()
  const categories = getGroupCategories()
  setGroupsCache(groups, categories)
  
  return categories
}

/**
 * Clear all cached data
 */
export function clearCache(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem("pet_social_groups_cache")
}


