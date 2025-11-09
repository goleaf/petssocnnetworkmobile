"use client"

type LinkPreview = {
  url: string
  title: string | null
  description: string | null
  image: string | null
  siteName: string | null
  favicon: string | null
}

const CACHE_KEY = 'pet_social_link_previews_v1'
const TTL_MS = 24 * 60 * 60 * 1000 // 1 day

type CacheEntry = {
  data: LinkPreview
  cachedAt: number
}

function loadCache(): Record<string, CacheEntry> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    return raw ? (JSON.parse(raw) as Record<string, CacheEntry>) : {}
  } catch {
    return {}
  }
}

function saveCache(cache: Record<string, CacheEntry>) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
  } catch {}
}

export function extractFirstUrl(text: string): string | null {
  const re = /(https?:\/\/[^\s]+|www\.[^\s]+)/i
  const m = text.match(re)
  if (!m) return null
  const u = m[0]
  return /^https?:\/\//i.test(u) ? u : `https://${u}`
}

export async function fetchLinkPreview(url: string): Promise<LinkPreview | null> {
  const cache = loadCache()
  const key = url.toLowerCase()
  const now = Date.now()
  const entry = cache[key]
  if (entry && now - entry.cachedAt < TTL_MS) {
    return entry.data
  }
  try {
    const res = await fetch(`/api/link-preview?url=${encodeURIComponent(url)}`)
    if (!res.ok) return null
    const data = (await res.json()) as LinkPreview
    cache[key] = { data, cachedAt: now }
    saveCache(cache)
    return data
  } catch {
    return null
  }
}

export type { LinkPreview }

