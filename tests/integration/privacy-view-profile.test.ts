/** @jest-environment jsdom */

let storeUser: any
let currentViewer: any = null

describe('Integration: Privacy view profile', () => {
  beforeEach(() => {
    jest.resetModules()
    currentViewer = null
    storeUser = {
      id: 'u1', username: 'user1', fullName: 'User One', email: 'u1@example.com', joinedAt: '2022-01-01',
      followers: ['v1'], following: [], bio: 'Hello',
      privacy: { profile: 'followers-only', email: 'followers-only', location: 'public', joinDateVisibility: 'public', lastActiveVisibility: 'public', searchable: true, allowFollowRequests: 'public', allowTagging: 'public', sections: { basics: 'followers-only' } },
      location: 'City, Country',
    }
  })

  test('anonymous cannot see followers-only basics/email', async () => {
    jest.doMock('@/lib/auth-server', () => ({ getCurrentUser: async () => currentViewer }))
    jest.doMock('@/lib/storage-server', () => ({ getServerUserById: (id: string) => (storeUser && storeUser.id === id ? storeUser : undefined) }))
    const { GET } = await import('@/app/api/users/[userId]/profile/route')
    const req: any = {}
    const res: any = await GET(req, { params: { userId: 'u1' } })
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.fullName).toBeNull()
    expect(body.bio).toBeNull()
    expect(body.email).toBeNull()
  })

  test('follower can see basics and email', async () => {
    jest.doMock('@/lib/auth-server', () => ({ getCurrentUser: async () => currentViewer }))
    jest.doMock('@/lib/storage-server', () => ({ getServerUserById: (id: string) => (storeUser && storeUser.id === id ? storeUser : undefined) }))
    const { GET } = await import('@/app/api/users/[userId]/profile/route')
    currentViewer = { id: 'v1', username: 'viewer' }
    const res: any = await GET({}, { params: { userId: 'u1' } })
    const body = await res.json()
    expect(body.fullName).toBe('User One')
    expect(body.bio).toBe('Hello')
    expect(body.email).toBe('u1@example.com')
  })
})
