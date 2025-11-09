/** @jest-environment jsdom */

let storeUser: any
let cacheDeleteCalls: string[] = []

jest.mock('@/lib/storage-server', () => ({
  getServerUserById: (id: string) => (storeUser && storeUser.id === id ? storeUser : undefined),
  updateServerUser: (id: string, updates: any) => { if (storeUser && storeUser.id === id) storeUser = { ...storeUser, ...updates } },
}))

jest.mock('@/lib/server/sse', () => ({ broadcastEvent: () => {} }))

jest.mock('@/lib/scalability/cache-layer', () => ({
  deleteCached: async (key: string) => { cacheDeleteCalls.push(key) },
}))

// Mock S3 client
const operations: any[] = []
jest.mock('@aws-sdk/client-s3', () => {
  class S3Client {
    async send(cmd: any) { operations.push(cmd); return {} }
  }
  class PutObjectCommand { constructor(public params: any) {} }
  class DeleteObjectCommand { constructor(public params: any) {} }
  class CopyObjectCommand { constructor(public params: any) {} }
  return { S3Client, PutObjectCommand, DeleteObjectCommand, CopyObjectCommand }
})

describe('Integration: Profile photo upload', () => {
  beforeEach(() => {
    jest.resetModules()
    jest.doMock('sharp', () => { throw new Error('no sharp in tests') }, { virtual: true })
    operations.length = 0
    cacheDeleteCalls = []
    process.env.AWS_S3_PUBLIC_URL = 'https://cdn.test'
    storeUser = { id: 'u1', username: 'user1', fullName: 'User One', email: 'u1@example.com', joinedAt: '2022-01-01', followers: [], following: [] }
  })

  test('POST stores image, updates user, and invalidates cache', async () => {
    const { POST } = await import('@/app/api/users/[userId]/profile-photo/route')
    // Create a small JPEG file
    const data = new Uint8Array([0xff, 0xd8, 0xff, 0xd9])
    const blob = new Blob([data], { type: 'image/jpeg' })
    const file: any = new File([blob], 'photo.jpg', { type: 'image/jpeg' })
    ;(file as any).arrayBuffer = async () => data.buffer
    const fd = new FormData(); fd.append('photo', file)
    const req: any = { formData: async () => fd }

    const res: any = await POST(req, { params: { userId: 'u1' } })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.profilePhotoUrl).toContain('/users/u1/profile/')
    expect(body.profilePhotoUrl).toContain('_large.jpg?v=')
    expect(storeUser.avatar).toContain('https://cdn.test/users/u1/profile/')
    expect(cacheDeleteCalls).toContain('profile:u1')
  })
})
