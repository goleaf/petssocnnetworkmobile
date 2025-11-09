import { calculateProfileCompletionPercent } from '@/lib/utils/profile-overview'
import type { User } from '@/lib/types'

function baseUser(): User {
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
    },
  }
}

describe('Profile completion percentage', () => {
  test('calculates weighted fields correctly', () => {
    const u: User = {
      ...baseUser(),
      avatar: 'a.jpg', // +10
      coverPhoto: 'c.jpg', // +5
      bio: 'hello', // +15
      location: 'City, Country', // +5
      dateOfBirth: '2000-01-01', // +5
      emailVerified: true, // +10
      interests: ['x'], // +10
      phone: '123456',
      // phoneVerified assumed false (0)
      website: 'https://example.com', // contactInfo +5
      // social links
      // @ts-ignore
      socialMedia: { instagram: 'ig' }, // +5
    }
    const percent = calculateProfileCompletionPercent(u, 1) // hasPet +20
    // 10 +5 +15 +5 +5 +10 +10 +20 +5 +5 = 90
    expect(percent).toBe(90)
  })
})

