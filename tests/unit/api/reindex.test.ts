/**
 * Tests for Admin Search Reindex API
 */

// Polyfill Request/Response for Node.js test environment
if (typeof global.Request === 'undefined') {
  // @ts-ignore
  global.Request = class Request {
    url: string
    method: string
    headers: Headers
    body: any
    
    constructor(url: string, init?: RequestInit) {
      this.url = url
      this.method = init?.method || 'GET'
      this.headers = new Headers(init?.headers)
      this.body = init?.body
    }
    
    async json() {
      return this.body ? JSON.parse(this.body) : {}
    }
    
    async text() {
      return this.body || ''
    }
  }
}

// Mock Next.js server modules before importing routes
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data, init) => ({
      json: () => Promise.resolve(data),
      status: init?.status || 200,
      ok: (init?.status || 200) < 400,
    })),
  },
}))

// Mock dependencies first
jest.mock('@/lib/db', () => ({
  db: {
    blogPost: {
      findMany: jest.fn(),
    },
    blogPostSearchIndex: {
      upsert: jest.fn(),
    },
  },
}))

import { db } from '@/lib/db'
import { GET, POST, __resetReindexForTests__ } from '@/app/api/admin/search/reindex/route'

const mockDb = db as jest.Mocked<typeof db>

describe('Admin Search Reindex API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    __resetReindexForTests__()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('GET /api/admin/search/reindex', () => {
    it('should return current rebuild status', async () => {
      const response = await GET()
      const data = await response.json()

      expect(data).toHaveProperty('status')
      expect(data).toHaveProperty('progress')
      expect(['idle', 'building', 'completed', 'error']).toContain(data.status)
      expect(typeof data.progress).toBe('number')
    })
  })

  describe('POST /api/admin/search/reindex', () => {
    it('should be reachable and start rebuild process', async () => {
      const mockBlogPosts = [
        {
          id: 'post-1',
          title: 'Test Post 1',
          content: 'Content 1',
          tags: ['tag1'],
        },
        {
          id: 'post-2',
          title: 'Test Post 2',
          content: 'Content 2',
          tags: ['tag2'],
        },
      ]

      mockDb.blogPost.findMany.mockResolvedValue(mockBlogPosts as any)
      mockDb.blogPostSearchIndex.upsert.mockResolvedValue({} as any)

      const response = await POST()
      const data = await response.json()

      expect(response.ok).toBe(true)
      expect(data).toHaveProperty('success')
      expect(data.success).toBe(true)
      expect(data).toHaveProperty('status')
      expect(data.status.status).toBe('building')
    })

    it('should return 409 if rebuild already in progress', async () => {
      // First call starts rebuild
      mockDb.blogPost.findMany.mockResolvedValue([] as any)
      const firstResponse = await POST()
      const firstData = await firstResponse.json()
      expect(firstResponse.ok).toBe(true)
      expect(firstData.success).toBe(true)

      // Second call should return 409 (rebuild already in progress)
      const secondResponse = await POST()
      const secondData = await secondResponse.json()

      expect(secondResponse.status).toBe(409)
      expect(secondData.error).toBe('Rebuild already in progress')
    })

    it('should process blog posts and update search index', async () => {
      const mockBlogPosts = [
        {
          id: 'post-1',
          title: 'Dog Care',
          content: 'How to care for your dog',
          tags: ['dog', 'care'],
        },
      ]

      mockDb.blogPost.findMany.mockResolvedValue(mockBlogPosts as any)
      mockDb.blogPostSearchIndex.upsert.mockResolvedValue({} as any)

      await POST()
      // Fast-forward fake timers so any scheduled tasks proceed
      jest.advanceTimersByTime(100)

      expect(mockDb.blogPost.findMany).toHaveBeenCalledWith({
        where: { deletedAt: null },
        select: {
          id: true,
          title: true,
          content: true,
          tags: true,
        },
      })

      expect(mockDb.blogPostSearchIndex.upsert).toHaveBeenCalledWith({
        where: { postId: 'post-1' },
        create: {
          postId: 'post-1',
          content: 'dog care how to care for your dog dog care',
        },
        update: {
          content: 'dog care how to care for your dog dog care',
        },
      })
    })
  })
})
