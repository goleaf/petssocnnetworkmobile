import { isUsernameAvailable, addUsernameHistory } from '@/lib/storage'

describe('Username availability', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  test('detects taken usernames', () => {
    const users = [
      { id: 'u1', username: 'taken', fullName: 'User', email: 'u@example.com', joinedAt: '2020-01-01', followers: [], following: [] },
    ]
    localStorage.setItem('pet_social_users', JSON.stringify(users))
    expect(isUsernameAvailable('taken')).toBe(false)
    expect(isUsernameAvailable('free')).toBe(true)
  })

  test('respects reserved previous usernames', () => {
    const users = [
      { id: 'u1', username: 'current', fullName: 'User', email: 'u@example.com', joinedAt: '2020-01-01', followers: [], following: [] },
    ]
    localStorage.setItem('pet_social_users', JSON.stringify(users))
    addUsernameHistory({ userId: 'someone-else', previousUsername: 'reserved', newUsername: 'new', changedAt: new Date().toISOString() })
    expect(isUsernameAvailable('reserved')).toBe(false)
  })
})

