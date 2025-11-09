/** @jest-environment jsdom */

import { NextResponse } from 'next/server'

// In-memory fakes
let storeUser: any
let cacheSetCalls: Array<{ key: string; value: any; ttl?: number }> = []
let cacheDeleteCalls: string[] = []
let currentViewer: any = null

jest.mock('@/lib/server/sse', () => ({ broadcastEvent: () => {} }))

jest.mock('@/lib/scalability/cache-layer', () => ({
  setCached: async (key: string, value: any, ttl?: number) => { cacheSetCalls.push({ key, value, ttl }) },
  deleteCached: async (key: string) => { cacheDeleteCalls.push(key) },
}))

describe('Integration: Profile update flow', () => {
  beforeEach(() => {
    jest.resetModules()
    cacheSetCalls = []
    cacheDeleteCalls = []
    currentViewer = { id: 'u1', username: 'user1', role: 'user' }
    // Mock cookie-based session to avoid Next.js cookies error and return viewer
    jest.doMock('next/headers', () => ({
      cookies: async () => ({
        get: () => ({ value: Buffer.from(JSON.stringify({ userId: 'u1', username: 'user1', role: 'user', expiresAt: Date.now() + 100000, issuedAt: Date.now() })).toString('base64') }),
        set: () => {},
        delete: () => {},
      }),
    }))
    jest.doMock('@/lib/session-store', () => ({ isSessionRevoked: () => false, updateSessionActivity: () => {} }))
    jest.doMock('@/lib/auth-server', () => ({ getCurrentUser: async () => currentViewer }))
    jest.doMock('@/lib/storage-server', () => ({
      getServerUserById: (id: string) => (storeUser && storeUser.id === id ? storeUser : undefined),
      getServerUsers: () => (storeUser ? [storeUser] : []),
      updateServerUser: (id: string, updates: any) => { if (storeUser && storeUser.id === id) storeUser = { ...storeUser, ...updates } },
    }))
    storeUser = {
      id: 'u1',
      email: 'user1@example.com',
      password: 'pass',
      username: 'user1',
      fullName: 'User One',
      joinedAt: '2022-01-01',
      followers: [],
      following: [],
      privacy: { profile: 'public', email: 'private', location: 'public', searchable: true, allowFollowRequests: 'public', allowTagging: 'public' },
    }
  })

  test('PUT updates multiple fields and invalidates caches', async () => {
    const { PUT } = await import('@/app/api/users/[userId]/profile/route')

    const payload = {
      fullName: 'New Name',
      bio: 'Hello world',
      website: 'https://example.com',
      socialMedia: { twitter: 'me' },
    }

    const req: any = { json: async () => payload, headers: { get: () => null } }
    const res = (await PUT(req, { params: { userId: 'u1' } })) as unknown as NextResponse
    const body = await (res as any).json()
    expect((res as any).status).toBe(200)
    expect(storeUser.fullName).toBe('New Name')
    expect(storeUser.bio).toBe('Hello world')
    expect(storeUser.website).toBe('https://example.com')
    // Cache invalidated
    expect(cacheDeleteCalls).toContain('profile:u1')
    // Response reflects new fields (owner context)
    expect(body.fullName).toBe('New Name')
    expect(body.bio).toBe('Hello world')
    expect(body.websiteUrl).toBe('https://example.com')
  })

  test('PUT username change honors cooldown and updates username cache', async () => {
    const { PUT } = await import('@/app/api/users/[userId]/profile/route')
    // Recent change => should 429
    storeUser.lastUsernameChangeAt = new Date().toISOString()
    let req: any = { json: async () => ({ username: 'newname', password: 'pass' }), headers: { get: () => null } }
    let res = (await PUT(req, { params: { userId: 'u1' } })) as any
    expect(res.status).toBe(429)

    // Older than 30 days => success
    const old = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString()
    storeUser.lastUsernameChangeAt = old
    cacheDeleteCalls = []
    cacheSetCalls = []
    req = { json: async () => ({ username: 'newname', password: 'pass' }), headers: { get: () => null } }
    res = (await PUT(req as any, { params: { userId: 'u1' } })) as any
    expect(res.status).toBe(200)
    expect(storeUser.username).toBe('newname')
    // Username mapping cache updated
    const setUserMap = cacheSetCalls.find((c) => c.key === 'profile:username:newname')
    expect(setUserMap).toBeTruthy()
    // Profile cache invalidated
    expect(cacheDeleteCalls).toContain('profile:u1')
  })
})
