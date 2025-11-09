import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-server'
import { getServerUserById, getServerUsers, updateServerUser } from '@/lib/storage-server'
import type { PrivacyLevel, User } from '@/lib/types'
import { canViewProfileSection } from '@/lib/utils/privacy'
import { broadcastEvent } from '@/lib/server/sse'
import { addServerUsernameHistory, isUsernameReservedWithinDays } from '@/lib/server-username-history'
import { setCached, deleteCached } from '@/lib/scalability/cache-layer'
import { computeProfileCompletionForServer } from '@/lib/utils/profile-compute'

export const runtime = 'nodejs'

type SizeSet = { small: string | null; medium: string | null; large: string | null; original: string | null; thumbnail?: string | null }

function deriveAvatarSizes(url?: string | null): SizeSet {
  if (!url) return { small: null, medium: null, large: null, original: null, thumbnail: null }
  const base = new URL(url, 'http://local') // dummy base to parse
  const path = base.pathname
  const qs = base.search
  const re = /(original|large|medium|small|thumb|thumbnail)\.jpg$/
  if (re.test(path)) {
    const p = path.replace(re, '')
    return {
      original: `${p}original.jpg${qs}`,
      large: `${p}large.jpg${qs}`,
      medium: `${p}medium.jpg${qs}`,
      small: `${p}small.jpg${qs}`,
      thumbnail: `${p}thumb.jpg${qs}`,
    }
  }
  // Fallback: same URL for all sizes
  return { small: url, medium: url, large: url, original: url, thumbnail: url }
}

function deriveCoverSizes(url?: string | null): { small: string | null; medium: string | null; large: string | null; original: string | null } {
  if (!url) return { small: null, medium: null, large: null, original: null }
  const base = new URL(url, 'http://local')
  const path = base.pathname
  const qs = base.search
  const re = /(original|large|medium|small)\.jpg$/
  if (re.test(path)) {
    const p = path.replace(re, '')
    return {
      original: `${p}original.jpg${qs}`,
      large: `${p}large.jpg${qs}`,
      medium: `${p}medium.jpg${qs}`,
      small: `${p}small.jpg${qs}`,
    }
  }
  return { small: url, medium: url, large: url, original: url }
}

function isAllowed(privacy: PrivacyLevel | undefined, viewerId: string | null, owner: User, fallback: boolean = true): boolean {
  if (viewerId === owner.id) return true
  if (!privacy) return fallback
  if (privacy === 'public') return true
  if (privacy === 'private') return false
  // followers-only
  return viewerId ? owner.followers.includes(viewerId) : false
}

function maskLocation(user: any): { country?: string; region?: string; city?: string } | null {
  const loc = user.location as string | undefined
  if (!loc) return null
  const parts = loc.split(',').map((s) => s.trim()).filter(Boolean)
  if (parts.length === 0) return null
  const city = (user.city as string) || (parts.length >= 1 ? parts[0] : undefined)
  const region = (user.region as string) || (parts.length >= 2 ? parts[parts.length - 2] : undefined)
  const country = (user.country as string) || (parts.length >= 1 ? parts[parts.length - 1] : undefined)
  return { country, region, city }
}

function formatBirthday(user: User, visibility: User['privacy'] extends { birthdayVisibility: infer T } ? any : any, viewerId: string | null) {
  const v = user.privacy?.birthdayVisibility || 'private'
  const isFollower = viewerId ? user.followers.includes(viewerId) : false
  if (viewerId !== user.id) {
    if (v === 'private') return { birthday: null, age: null }
    if (v === 'followers-only' && !isFollower) return { birthday: null, age: null }
  }
  if (!user.dateOfBirth) return { birthday: null, age: null }
  const date = new Date(user.dateOfBirth)
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  const year = `${date.getFullYear()}`
  const age = computeAge(user.dateOfBirth)
  if (v === 'public_hide_year') {
    return { birthday: `${month}-${day}`, age }
  }
  return { birthday: `${year}-${month}-${day}`, age }
}

function computeAge(birthday?: string): number | null {
  if (!birthday) return null
  const d = new Date(birthday)
  if (Number.isNaN(d.getTime())) return null
  const diff = Date.now() - d.getTime()
  const years = Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000))
  return years < 0 ? 0 : years
}

function computeCompletion(user: any, petsCount: number = 0): number {
  return computeProfileCompletionForServer(user as User, petsCount)
}

export function buildProfileResponse(user: User, viewerId: string | null): any {
  const isOwner = viewerId === user.id
  const basicsVisible = canViewProfileSection('basics', user, viewerId)
  const emailPrivacy = user.privacy?.email as PrivacyLevel | undefined
  const phonePrivacy = (user.privacy?.phone as PrivacyLevel | undefined) || 'private'
  const avatarPrivacy = (user.privacy?.avatarVisibility as PrivacyLevel | undefined) || user.privacy?.profile
  const coverPrivacy = (user.privacy?.coverPhotoVisibility as PrivacyLevel | undefined) || user.privacy?.profile
  const locationPrivacy = user.privacy?.location as PrivacyLevel | undefined
  const locationGranularity = user.privacy?.locationGranularity || 'country'
  const joinPrivacy = user.privacy?.joinDateVisibility as PrivacyLevel | undefined
  const lastActivePrivacy = (user.privacy?.lastActiveVisibility as any) || 'public'

  const emailAllowed = isAllowed(emailPrivacy, viewerId, user)
  const email = emailAllowed || isOwner ? user.email : null
  const phoneAllowed = isAllowed(phonePrivacy, viewerId, user, false)
  const phoneNumber = phoneAllowed || isOwner ? (user as any).phone || null : null
  const avatarAllowed = isAllowed(avatarPrivacy, viewerId, user)
  const avatarSizes = avatarAllowed || isOwner ? deriveAvatarSizes(user.avatar) : { small: null, medium: null, large: null, original: null, thumbnail: null }
  const coverAllowed = isAllowed(coverPrivacy, viewerId, user)
  const coverSizes = coverAllowed || isOwner ? deriveCoverSizes(user.coverPhoto) : { small: null, medium: null, large: null, original: null }

  const locationAllowed = isAllowed(locationPrivacy, viewerId, user)
  let location: { country?: string; region?: string; city?: string } | null = null
  if ((locationAllowed || isOwner) && user.location) {
    const m = maskLocation(user)
    if (m) {
      if (locationGranularity === 'hidden' && !isOwner) location = null
      else if (locationGranularity === 'country') location = { country: m.country }
      else if (locationGranularity === 'region') location = { country: m.country, region: m.region }
      else location = { country: m.country, region: m.region, city: m.city }
    }
  }

  const { birthday, age } = formatBirthday(user, user.privacy?.birthdayVisibility, viewerId)
  const agePrivacy = user.privacy?.ageVisibility as PrivacyLevel | undefined
  const ageAllowed = isAllowed(agePrivacy, viewerId, user)
  const finalAge = (isOwner || ageAllowed) ? age : null

  const joinedAllowed = isAllowed(joinPrivacy, viewerId, user)
  const joinedAt = isOwner || joinedAllowed ? user.joinedAt : null

  let lastActiveAt: string | null = null
  if (isOwner) lastActiveAt = (user as any).lastSeen || null
  else if (lastActivePrivacy !== 'hidden' && lastActivePrivacy !== 'private') {
    if (lastActivePrivacy === 'followers-only') {
      lastActiveAt = viewerId && user.followers.includes(viewerId) ? (user as any).lastSeen || null : null
    } else {
      lastActiveAt = (user as any).lastSeen || null
    }
  }

  const displayName = (user as any).handle || user.fullName
  const fullName = basicsVisible || isOwner ? user.fullName : null
  const websiteUrl = basicsVisible || isOwner ? user.website || null : null
  const bio = basicsVisible || isOwner ? user.bio || null : null
  const gender = basicsVisible || isOwner ? (user as any).gender || null : null
  const interests = basicsVisible || isOwner ? user.interests || [] : []
  const languages = basicsVisible || isOwner ? ((user as any).languages || []) : []
  const socialLinks = basicsVisible || isOwner ? ((user as any).socialMedia || {}) : {}

  const followersCount = user.followers?.length ?? 0
  const followingCount = user.following?.length ?? 0
  const postsCount = 0

  const isVerified = user.badge === 'verified' || (user.emailVerified && (user as any).phoneVerified)
  const verificationBadgeType = isVerified ? 'blue' : (user.isPro ? 'gold' : null)
  // Ensure cached counts if stale (5 minutes)
  try {
    const updatedAt = (user as any).cachedCounts?.updatedAt
    const stale = !updatedAt || (Date.now() - new Date(updatedAt).getTime() > 5 * 60 * 1000)
    if (stale) {
      updateServerUser(user.id, { cachedCounts: { followers: user.followers?.length ?? 0, following: user.following?.length ?? 0, updatedAt: new Date().toISOString() } } as any)
    }
  } catch {}

  const profileCompletionPercentage = (user as any).cachedCompletionPercent ?? computeCompletion(user)
  const stats = isOwner ? { lifetimeViews: 0, uniqueVisitors: 0, last30Days: [] as any[] } : undefined

  return {
    userId: user.id,
    username: user.username,
    displayName,
    fullName,
    email,
    phoneNumber,
    bio,
    profilePhotoUrl: avatarSizes,
    coverPhotoUrl: coverSizes,
    location,
    birthday,
    age: finalAge,
    gender,
    interests,
    languages,
    socialLinks,
    websiteUrl,
    joinedAt,
    isVerified,
    verificationBadgeType,
    profileCompletionPercentage,
    lastActiveAt,
    followersCount,
    followingCount,
    postsCount,
    stats,
  }
}

export async function GET(request: NextRequest, context: { params: Promise<{ userId: string }> }) {
  const viewer = await getCurrentUser()
  const viewerId = viewer?.id || null
  const { userId } = await context.params
  const user = getServerUserById(userId)
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
  const response = buildProfileResponse(user, viewerId)
  // Cache a full profile object (owner view) with TTL 1 hour for backend reuse
  try { await setCached(`profile:${user.id}`, buildProfileResponse(user, user.id), 3600) } catch {}
  // Cache username mapping for quick lookups (24h TTL)
  try { await setCached(`profile:username:${user.username}`, user.id, 86400) } catch {}
  return NextResponse.json(response)
}

function getClientIp(req: NextRequest): string | null {
  const xf = req.headers.get('x-forwarded-for')
  if (xf) return xf.split(',')[0].trim()
  const xr = req.headers.get('x-real-ip')
  if (xr) return xr
  return null
}

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function validateUrl(url: string): boolean {
  try { const u = new URL(url); return ['http:', 'https:'].includes(u.protocol) } catch { return false }
}

export async function PUT(request: NextRequest, context: { params: Promise<{ userId: string }> }) {
  const viewer = await getCurrentUser()
  const { userId } = await context.params
  if (!viewer || viewer.id !== userId) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
  }

  const user = getServerUserById(userId)
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  let payload: any
  try { payload = await request.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const updates: any = {}
  const changes: Array<{ field: string; before: any; after: any }> = []
  const sensitiveChanged: string[] = []

  const allow = new Set([
    'username','fullName','bio','location','website','phone','interests','languages','socialMedia','gender','privacy','handle','dateOfBirth'
  ])

  for (const key of Object.keys(payload)) {
    if (key === 'password' || key === 'currentPassword') continue
    if (!allow.has(key)) continue
    updates[key] = payload[key]
  }

  // Validation
  const allUsers = getServerUsers()

  if (updates.fullName !== undefined) {
    if (typeof updates.fullName !== 'string' || updates.fullName.trim().length === 0 || updates.fullName.length > 100) {
      return NextResponse.json({ error: 'fullName must be 1-100 characters' }, { status: 400 })
    }
  }

  if (updates.bio !== undefined) {
    if (typeof updates.bio !== 'string' || updates.bio.length > 1000) {
      return NextResponse.json({ error: 'bio must be <= 1000 characters' }, { status: 400 })
    }
  }

  if (updates.website !== undefined) {
    if (updates.website && !validateUrl(updates.website)) {
      return NextResponse.json({ error: 'website must be a valid URL' }, { status: 400 })
    }
  }

  if (updates.interests !== undefined) {
    if (!Array.isArray(updates.interests) || updates.interests.some((x: any) => typeof x !== 'string' || x.length > 60) || updates.interests.length > 50) {
      return NextResponse.json({ error: 'interests must be an array of strings (<=50 items)' }, { status: 400 })
    }
  }

  if (updates.languages !== undefined) {
    if (!Array.isArray(updates.languages) || updates.languages.some((x: any) => typeof x !== 'string' || x.length > 40) || updates.languages.length > 30) {
      return NextResponse.json({ error: 'languages must be an array of strings (<=30 items)' }, { status: 400 })
    }
  }

  if (updates.socialMedia !== undefined) {
    if (typeof updates.socialMedia !== 'object' || Array.isArray(updates.socialMedia)) {
      return NextResponse.json({ error: 'socialMedia must be an object' }, { status: 400 })
    }
  }

  // Sensitive changes
  const password = payload.password || payload.currentPassword

  if (updates.username !== undefined && updates.username !== user.username) {
    const u = String(updates.username).trim()
    if (!/^[a-zA-Z0-9_\-.]{3,20}$/.test(u)) {
      return NextResponse.json({ error: 'username must be 3-20 chars [A-Z,a-z,0-9,_,-,.]' }, { status: 400 })
    }
    const exists = allUsers.some((x) => x.id !== user.id && x.username.toLowerCase() === u.toLowerCase())
    if (exists) return NextResponse.json({ error: 'username is taken' }, { status: 409 })
    // 30-day cooldown
    const last = user.lastUsernameChangeAt ? new Date(user.lastUsernameChangeAt).getTime() : 0
    const THIRTY = 30 * 24 * 60 * 60 * 1000
    if (last && Date.now() - last < THIRTY) {
      const daysLeft = Math.ceil((THIRTY - (Date.now() - last)) / (24*60*60*1000))
      return NextResponse.json({ error: `Username can be changed again in ${daysLeft} days` }, { status: 429 })
    }
    // Reserved by others within 30 days
    if (isUsernameReservedWithinDays(u, 30, user.id)) {
      return NextResponse.json({ error: 'username is reserved' }, { status: 409 })
    }
    sensitiveChanged.push('username')
  }

  if (updates.email !== undefined && updates.email !== user.email) {
    const e = String(updates.email).trim().toLowerCase()
    if (!validateEmail(e)) return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
    const exists = allUsers.some((x) => x.id !== user.id && x.email.toLowerCase() === e)
    if (exists) return NextResponse.json({ error: 'Email already in use' }, { status: 409 })
    sensitiveChanged.push('email')
  }

  if (updates.phone !== undefined && updates.phone !== (user as any).phone) {
    const p = String(updates.phone)
    if (p && !/^[0-9+()\-\s]{6,20}$/.test(p)) {
      return NextResponse.json({ error: 'Invalid phone number format' }, { status: 400 })
    }
    sensitiveChanged.push('phone')
  }

  if (sensitiveChanged.length > 0) {
    if (!password || password !== (user as any).password) {
      return NextResponse.json({ error: 'Password required for sensitive changes' }, { status: 401 })
    }
  }

  // Apply transactionally
  const next: any = { ...user }
  for (const key of Object.keys(updates)) {
    next[key] = updates[key]
  }

  const changedFields: string[] = []
  Object.keys(updates).forEach((k) => {
    const before = (user as any)[k]
    const after = updates[k]
    if (JSON.stringify(before) !== JSON.stringify(after)) {
      changedFields.push(k)
      changes.push({ field: k, before, after })
    }
  })

  // Username history
  if (updates.username && updates.username !== user.username) {
    next.lastUsernameChangeAt = new Date().toISOString()
  }

  // Update cached completion before commit
  next.cachedCompletionPercent = computeCompletion(next)
  // Commit
  updateServerUser(user.id, next)

  // Record username history after commit
  if (updates.username && updates.username !== user.username) {
    addServerUsernameHistory({ userId: user.id, previousUsername: user.username, newUsername: updates.username, changedAt: next.lastUsernameChangeAt })
  }

  // Broadcast SSE event to connected clients
  broadcastEvent({ type: 'profileUpdated', userId: user.id, fields: changedFields, ts: Date.now() })

  // Invalidate profile cache and update username mapping cache
  try {
    await deleteCached(`profile:${user.id}`)
    if (updates.username && updates.username !== user.username) {
      // Old username mapping
      try { await deleteCached(`profile:username:${user.username}`) } catch {}
      try { await setCached(`profile:username:${updates.username}`, user.id, 86400) } catch {}
    }
  } catch {}

  // Audit log (console for demo)
  const ip = getClientIp(request)
  const ts = new Date().toISOString()
  console.log('[AUDIT] profile.update', { actorId: user.id, targetId: user.id, ip, ts, changes })

  // Return updated, privacy-aware profile (owner context)
  const updatedUser = getServerUserById(user.id)!
  return NextResponse.json(buildProfileResponse(updatedUser, user.id))
}
