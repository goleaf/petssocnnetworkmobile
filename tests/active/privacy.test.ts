import { canViewProfile, canViewProfileField } from '@/lib/utils/privacy'
import {
  getDefaultPrivacySettings,
  getDefaultMessagingPrivacySettings,
  getPrivacySettings,
  updatePrivacySettings,
  canViewContent,
  blockUser,
  unblockUser,
  muteUser,
  unmuteUser,
  getBlockedUsers,
  getMutedUsers,
  isUserBlocked,
  isUserMuted,
  bulkBlockUsers
} from '@/lib/services/privacy'
import type { User } from '@/lib/types'
import { prisma } from '@/lib/prisma'

jest.mock('@/lib/storage', () => ({
  getUserById: (id: string) => ({ id, blockedUsers: [] }),
}))

jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    blockedUser: {
      findUnique: jest.fn(),
      create: jest.fn(),
      deleteMany: jest.fn(),
      findMany: jest.fn(),
    },
    mutedUser: {
      findUnique: jest.fn(),
      create: jest.fn(),
      deleteMany: jest.fn(),
      findMany: jest.fn(),
    },
  },
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

describe('Privacy Service - Default Settings', () => {
  test('getDefaultPrivacySettings returns correct defaults', () => {
    const defaults = getDefaultPrivacySettings()
    expect(defaults.profile).toBe('public')
    expect(defaults.email).toBe('private')
    expect(defaults.searchable).toBe(true)
    expect(defaults.sections.basics).toBe('public')
  })

  test('getDefaultMessagingPrivacySettings returns correct defaults', () => {
    const defaults = getDefaultMessagingPrivacySettings()
    expect(defaults.whoCanMessage).toBe('public')
    expect(defaults.readReceipts).toBe(true)
    expect(defaults.typingIndicators).toBe(true)
    expect(defaults.allowForwarding).toBe(true)
  })
})

describe('Privacy Service - Settings Management', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('getPrivacySettings returns user settings', async () => {
    const mockPrivacy = { profile: 'private', email: 'private' }
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
      privacy: mockPrivacy
    })

    const settings = await getPrivacySettings('user1')
    expect(settings.profile).toBe('private')
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: 'user1' },
      select: { privacy: true }
    })
  })

  test('getPrivacySettings returns defaults when no settings exist', async () => {
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({ privacy: null })

    const settings = await getPrivacySettings('user1')
    expect(settings.profile).toBe('public')
    expect(settings.email).toBe('private')
  })

  test('updatePrivacySettings merges and saves settings', async () => {
    const currentSettings = getDefaultPrivacySettings()
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
      privacy: currentSettings
    })
    ;(prisma.user.update as jest.Mock).mockResolvedValue({})

    await updatePrivacySettings('user1', { profile: 'private' })

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user1' },
      data: expect.objectContaining({
        privacy: expect.objectContaining({ profile: 'private' })
      })
    })
  })
})

describe('Privacy Service - Blocking', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('blockUser creates block relationship', async () => {
    ;(prisma.blockedUser.findUnique as jest.Mock).mockResolvedValue(null)
    ;(prisma.blockedUser.create as jest.Mock).mockResolvedValue({})

    await blockUser('user1', 'user2')

    expect(prisma.blockedUser.create).toHaveBeenCalledWith({
      data: {
        userId: 'user1',
        blockedId: 'user2'
      }
    })
  })

  test('blockUser prevents self-blocking', async () => {
    await expect(blockUser('user1', 'user1')).rejects.toThrow('Cannot block yourself')
  })

  test('blockUser is idempotent - does not create duplicate blocks', async () => {
    ;(prisma.blockedUser.findUnique as jest.Mock).mockResolvedValue({
      userId: 'user1',
      blockedId: 'user2'
    })

    await blockUser('user1', 'user2')

    expect(prisma.blockedUser.create).not.toHaveBeenCalled()
  })

  test('unblockUser removes block relationship', async () => {
    ;(prisma.blockedUser.deleteMany as jest.Mock).mockResolvedValue({})

    await unblockUser('user1', 'user2')

    expect(prisma.blockedUser.deleteMany).toHaveBeenCalledWith({
      where: {
        userId: 'user1',
        blockedId: 'user2'
      }
    })
  })

  test('isUserBlocked returns true when blocked', async () => {
    ;(prisma.blockedUser.findUnique as jest.Mock).mockResolvedValue({
      userId: 'user1',
      blockedId: 'user2'
    })

    const result = await isUserBlocked('user1', 'user2')
    expect(result).toBe(true)
  })

  test('isUserBlocked returns false when not blocked', async () => {
    ;(prisma.blockedUser.findUnique as jest.Mock).mockResolvedValue(null)

    const result = await isUserBlocked('user1', 'user2')
    expect(result).toBe(false)
  })

  test('getBlockedUsers returns list of blocked users', async () => {
    const mockBlocked = [
      {
        userId: 'user1',
        blockedId: 'user2',
        blockedAt: new Date(),
        blocked: {
          id: 'user2',
          username: 'blocked_user',
          displayName: 'Blocked User',
          avatarUrl: null
        }
      }
    ]
    ;(prisma.blockedUser.findMany as jest.Mock).mockResolvedValue(mockBlocked)

    const result = await getBlockedUsers('user1')
    expect(result).toHaveLength(1)
    expect(result[0].blocked.username).toBe('blocked_user')
  })
})

describe('Privacy Service - Muting', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('muteUser creates mute relationship', async () => {
    ;(prisma.mutedUser.findUnique as jest.Mock).mockResolvedValue(null)
    ;(prisma.mutedUser.create as jest.Mock).mockResolvedValue({})

    await muteUser('user1', 'user2')

    expect(prisma.mutedUser.create).toHaveBeenCalledWith({
      data: {
        userId: 'user1',
        mutedId: 'user2'
      }
    })
  })

  test('muteUser prevents self-muting', async () => {
    await expect(muteUser('user1', 'user1')).rejects.toThrow('Cannot mute yourself')
  })

  test('muteUser is idempotent - does not create duplicate mutes', async () => {
    ;(prisma.mutedUser.findUnique as jest.Mock).mockResolvedValue({
      userId: 'user1',
      mutedId: 'user2'
    })

    await muteUser('user1', 'user2')

    expect(prisma.mutedUser.create).not.toHaveBeenCalled()
  })

  test('unmuteUser removes mute relationship', async () => {
    ;(prisma.mutedUser.deleteMany as jest.Mock).mockResolvedValue({})

    await unmuteUser('user1', 'user2')

    expect(prisma.mutedUser.deleteMany).toHaveBeenCalledWith({
      where: {
        userId: 'user1',
        mutedId: 'user2'
      }
    })
  })

  test('isUserMuted returns true when muted', async () => {
    ;(prisma.mutedUser.findUnique as jest.Mock).mockResolvedValue({
      userId: 'user1',
      mutedId: 'user2'
    })

    const result = await isUserMuted('user1', 'user2')
    expect(result).toBe(true)
  })

  test('isUserMuted returns false when not muted', async () => {
    ;(prisma.mutedUser.findUnique as jest.Mock).mockResolvedValue(null)

    const result = await isUserMuted('user1', 'user2')
    expect(result).toBe(false)
  })

  test('getMutedUsers returns list of muted users', async () => {
    const mockMuted = [
      {
        userId: 'user1',
        mutedId: 'user2',
        mutedAt: new Date(),
        muted: {
          id: 'user2',
          username: 'muted_user',
          displayName: 'Muted User',
          avatarUrl: null
        }
      }
    ]
    ;(prisma.mutedUser.findMany as jest.Mock).mockResolvedValue(mockMuted)

    const result = await getMutedUsers('user1')
    expect(result).toHaveLength(1)
    expect(result[0].muted.username).toBe('muted_user')
  })
})

describe('Privacy Service - Bulk Operations', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('bulkBlockUsers blocks multiple users successfully', async () => {
    ;(prisma.user.findUnique as jest.Mock)
      .mockResolvedValueOnce({ id: 'user2', username: 'user2' })
      .mockResolvedValueOnce({ id: 'user3', username: 'user3' })
    ;(prisma.blockedUser.findUnique as jest.Mock).mockResolvedValue(null)
    ;(prisma.blockedUser.create as jest.Mock).mockResolvedValue({})

    const results = await bulkBlockUsers('user1', ['user2', 'user3'])

    expect(results).toHaveLength(2)
    expect(results[0].success).toBe(true)
    expect(results[1].success).toBe(true)
  })

  test('bulkBlockUsers handles non-existent users', async () => {
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)

    const results = await bulkBlockUsers('user1', ['nonexistent'])

    expect(results).toHaveLength(1)
    expect(results[0].success).toBe(false)
    expect(results[0].error).toBe('User not found')
  })

  test('bulkBlockUsers handles errors gracefully', async () => {
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'user2', username: 'user2' })
    ;(prisma.blockedUser.findUnique as jest.Mock).mockResolvedValue(null)
    ;(prisma.blockedUser.create as jest.Mock).mockRejectedValue(new Error('Database error'))

    const results = await bulkBlockUsers('user1', ['user2'])

    expect(results).toHaveLength(1)
    expect(results[0].success).toBe(false)
    expect(results[0].error).toBe('Database error')
  })
})

describe('Privacy Service - Content Visibility', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('canViewContent allows public content for anonymous users', async () => {
    ;(prisma.blockedUser.findUnique as jest.Mock).mockResolvedValue(null)

    const result = await canViewContent(null, 'user1', 'public')
    expect(result).toBe(true)
  })

  test('canViewContent blocks private content for anonymous users', async () => {
    const result = await canViewContent(null, 'user1', 'private')
    expect(result).toBe(false)
  })

  test('canViewContent allows owner to see their own content', async () => {
    const result = await canViewContent('user1', 'user1', 'private')
    expect(result).toBe(true)
  })

  test('canViewContent blocks content from blocked users', async () => {
    ;(prisma.blockedUser.findUnique as jest.Mock).mockResolvedValue({
      userId: 'user1',
      blockedId: 'user2'
    })

    const result = await canViewContent('user2', 'user1', 'public')
    expect(result).toBe(false)
  })
})

