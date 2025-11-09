import { canViewProfile, canViewProfileField } from '@/lib/utils/privacy'
import type { User } from '@/lib/types'

jest.mock('@/lib/storage', () => ({
  getUserById: (id: string) => ({ id, blockedUsers: [] }),
}))

function userFactory(overrides: Partial<User> = {}): User {
  return {
    id: 'u1',
    email: 'u1@example.com',
    username: 'user1',
    fullName: 'User One',
    joinedAt: new Date().toISOString(),
    followers: [],
    following: [],
    privacy: {
      profile: 'public',
      email: 'private',
      location: 'public',
      pets: 'public',
      posts: 'public',
      followers: 'public',
      following: 'public',
      searchable: true,
      allowFollowRequests: 'public',
      allowTagging: 'public',
      joinDateVisibility: 'public',
      lastActiveVisibility: 'public',
      sections: {
        basics: 'public',
        statistics: 'public',
      },
    },
    ...overrides,
  }
}

describe('Privacy settings', () => {
  test('anonymous viewer sees public profile, not private', () => {
    const pub = userFactory({ privacy: { ...userFactory().privacy!, profile: 'public' } })
    const priv = userFactory({ privacy: { ...userFactory().privacy!, profile: 'private' } })
    expect(canViewProfile(pub, null)).toBe(true)
    expect(canViewProfile(priv, null)).toBe(false)
  })

  test('followers-only visible to follower', () => {
    const u = userFactory({ privacy: { ...userFactory().privacy!, profile: 'followers-only' }, followers: ['v1'] })
    expect(canViewProfile(u, 'v1')).toBe(true)
    expect(canViewProfile(u, 'v2')).toBe(false)
  })

  test('owner always sees own profile and fields', () => {
    const u = userFactory({ privacy: { ...userFactory().privacy!, profile: 'private', email: 'never' } })
    expect(canViewProfile(u, u.id)).toBe(true)
    expect(canViewProfileField('email', u, u.id)).toBe(true)
  })

  test('email field respects field-level privacy', () => {
    const uPublic = userFactory({ privacy: { ...userFactory().privacy!, email: 'public' } })
    const uFollowers = userFactory({ privacy: { ...userFactory().privacy!, email: 'followers-only' }, followers: ['v1'] })
    const uNever = userFactory({ privacy: { ...userFactory().privacy!, email: 'never' } })
    expect(canViewProfileField('email', uPublic, null)).toBe(true)
    expect(canViewProfileField('email', uFollowers, 'v1')).toBe(true)
    expect(canViewProfileField('email', uFollowers, 'v2')).toBe(false)
    expect(canViewProfileField('email', uNever, 'any')).toBe(false)
  })
})

