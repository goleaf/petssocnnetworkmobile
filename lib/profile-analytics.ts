"use client"

// Lightweight client-side analytics for demo purposes.

export type ReferrerSource = 'search' | 'direct' | 'post' | 'profile' | 'other'

export type ProfileViewRecord = {
  profileId: string
  viewerKey: string // userId or anonymous id
  ts: number
  source: ReferrerSource
}

const STORAGE_KEY = 'profile_analytics_views'
const VISITOR_ID_KEY = 'profile_analytics_visitor_id'
const MEDIA_KEY = 'profile_analytics_media'
const CLICKS_KEY = 'profile_analytics_clicks'
const FOLLOWS_KEY = 'profile_analytics_follows'

function readViews(): ProfileViewRecord[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as ProfileViewRecord[]) : []
  } catch {
    return []
  }
}

function writeViews(records: ProfileViewRecord[]) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
  } catch {}
}

function getOrCreateVisitorId(): string {
  if (typeof window === 'undefined') return 'server'
  let id = localStorage.getItem(VISITOR_ID_KEY)
  if (!id) {
    id = `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
    try { localStorage.setItem(VISITOR_ID_KEY, id) } catch {}
  }
  return id
}

export function classifyReferrer(ref: string | null | undefined): ReferrerSource {
  if (!ref) return 'direct'
  try {
    const url = new URL(ref)
    const host = url.hostname.toLowerCase()
    const path = url.pathname
    if (host.includes('google.') || host.includes('bing.') || host.includes('duckduckgo.') || host.includes('yahoo.')) {
      return 'search'
    }
    if (path.includes('/post')) return 'post'
    if (path.includes('/user/') || path.includes('/profile/')) return 'profile'
    return 'other'
  } catch {
    return 'other'
  }
}

export function recordProfileView(profileId: string, viewerId: string | null, source?: ReferrerSource) {
  if (typeof window === 'undefined') return
  // Avoid counting multiple times in one session for same profile
  const sessionKey = `profile_viewed_session_${profileId}`
  if (sessionStorage.getItem(sessionKey)) return
  sessionStorage.setItem(sessionKey, '1')

  const viewerKey = viewerId || getOrCreateVisitorId()
  const records = readViews()
  records.push({ profileId, viewerKey, ts: Date.now(), source: source || 'direct' })
  writeViews(records)
}

export function recordMediaView(profileId: string, media: 'avatar' | 'cover') {
  if (typeof window === 'undefined') return
  const raw = localStorage.getItem(MEDIA_KEY)
  const arr: Array<{ profileId: string; media: string; ts: number }> = raw ? JSON.parse(raw) : []
  arr.push({ profileId, media, ts: Date.now() })
  localStorage.setItem(MEDIA_KEY, JSON.stringify(arr))
}

export function recordLinkClick(profileId: string, link: 'bio' | 'website' | `social:${string}`) {
  if (typeof window === 'undefined') return
  const raw = localStorage.getItem(CLICKS_KEY)
  const arr: Array<{ profileId: string; link: string; ts: number }> = raw ? JSON.parse(raw) : []
  arr.push({ profileId, link, ts: Date.now() })
  localStorage.setItem(CLICKS_KEY, JSON.stringify(arr))
}

export function recordFollowEvent(profileId: string, followerId: string, action: 'follow' | 'unfollow') {
  if (typeof window === 'undefined') return
  const raw = localStorage.getItem(FOLLOWS_KEY)
  const arr: Array<{ profileId: string; followerId: string; action: string; ts: number }> = raw ? JSON.parse(raw) : []
  arr.push({ profileId, followerId, action, ts: Date.now() })
  localStorage.setItem(FOLLOWS_KEY, JSON.stringify(arr))
}

function countInWindow<T extends { ts: number }>(items: T[], days: number): number {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000
  return items.filter((i) => i.ts >= cutoff).length
}

export function getProfileActions(profileId: string) {
  const mediaRaw = (typeof window !== 'undefined' && localStorage.getItem(MEDIA_KEY)) || '[]'
  const clicksRaw = (typeof window !== 'undefined' && localStorage.getItem(CLICKS_KEY)) || '[]'
  const followsRaw = (typeof window !== 'undefined' && localStorage.getItem(FOLLOWS_KEY)) || '[]'
  const media: Array<{ profileId: string; media: string; ts: number }> = JSON.parse(mediaRaw)
  const clicks: Array<{ profileId: string; link: string; ts: number }> = JSON.parse(clicksRaw)
  const follows: Array<{ profileId: string; followerId: string; action: string; ts: number }> = JSON.parse(followsRaw)

  const myMedia = media.filter((m) => m.profileId === profileId)
  const avatarViews = myMedia.filter((m) => m.media === 'avatar')
  const coverViews = myMedia.filter((m) => m.media === 'cover')

  const myClicks = clicks.filter((c) => c.profileId === profileId)
  const bioClicks = myClicks.filter((c) => c.link === 'bio')
  const websiteClicks = myClicks.filter((c) => c.link === 'website')
  const socialClicks: Record<string, number> = {}
  myClicks.filter((c) => c.link.startsWith('social:')).forEach((c) => {
    const platform = c.link.split(':')[1] || 'unknown'
    socialClicks[platform] = (socialClicks[platform] || 0) + 1
  })

  const myFollows = follows.filter((f) => f.profileId === profileId && f.action === 'follow')
  const followersGainedWeek = countInWindow(myFollows, 7)
  const followersGainedMonth = countInWindow(myFollows, 30)

  return {
    avatarViews: avatarViews.length,
    coverViews: coverViews.length,
    bioClicks: bioClicks.length,
    websiteClicks: websiteClicks.length,
    socialClicks,
    followersGainedWeek,
    followersGainedMonth,
  }
}

export function getProfileStats(profileId: string) {
  const records = readViews().filter((r) => r.profileId === profileId)
  const lifetimeTotal = records.length
  const byViewer = new Map<string, number>()
  records.forEach((r) => byViewer.set(r.viewerKey, (byViewer.get(r.viewerKey) || 0) + 1))
  let unique = 0
  let returning = 0
  byViewer.forEach((count) => {
    if (count > 1) returning++
    else unique++
  })

  // Top referrers
  const refCounts: Record<ReferrerSource, number> = { search: 0, direct: 0, post: 0, profile: 0, other: 0 }
  records.forEach((r) => { refCounts[r.source] = (refCounts[r.source] || 0) + 1 })

  // Last 30 days daily series
  const now = new Date()
  const days: { date: string; views: number }[] = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(now.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    const count = records.filter((r) => new Date(r.ts).toISOString().slice(0, 10) === key).length
    days.push({ date: key, views: count })
  }

  return { lifetimeTotal, uniqueVisitors: unique, returningVisitors: returning, refCounts, days }
}
