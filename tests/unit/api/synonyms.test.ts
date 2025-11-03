/**
 * Tests for Admin Search Synonyms API
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
  NextRequest: class NextRequest {
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
  },
}))

// Mock dependencies first
jest.mock('@/lib/db', () => ({
  db: {
    synonym: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}))

import { db } from '@/lib/db'
import { GET, POST } from '@/app/api/admin/search/synonyms/route'
import { PUT, DELETE } from '@/app/api/admin/search/synonyms/[id]/route'

const mockDb = db as jest.Mocked<typeof db>

describe('Admin Search Synonyms API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /api/admin/search/synonyms', () => {
    it('should create and persist a synonym', async () => {
      const mockSynonym = {
        id: 'syn-1',
        term: 'dog',
        synonyms: ['canine', 'puppy'],
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      }

      mockDb.synonym.create.mockResolvedValue(mockSynonym)

      const request = new Request('http://localhost/api/admin/search/synonyms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          term: 'dog',
          synonyms: ['canine', 'puppy'],
        }),
      })

      const response = await POST(request as any)
      const data = await response.json()

      expect(mockDb.synonym.create).toHaveBeenCalledWith({
        data: {
          term: 'dog',
          synonyms: ['canine', 'puppy'],
        },
      })

      expect(data).toEqual({
        id: 'syn-1',
        term: 'dog',
        synonyms: ['canine', 'puppy'],
        createdAt: mockSynonym.createdAt.toISOString(),
        updatedAt: mockSynonym.updatedAt.toISOString(),
      })
    })

    it('should persist synonym with lowercase terms', async () => {
      const mockSynonym = {
        id: 'syn-2',
        term: 'cat',
        synonyms: ['feline', 'kitten'],
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      }

      mockDb.synonym.create.mockResolvedValue(mockSynonym)

      const request = new Request('http://localhost/api/admin/search/synonyms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          term: 'CAT',
          synonyms: ['FELINE', 'Kitten'],
        }),
      })

      const response = await POST(request as any)
      await response.json()

      expect(mockDb.synonym.create).toHaveBeenCalledWith({
        data: {
          term: 'cat',
          synonyms: ['feline', 'kitten'],
        },
      })
    })

    it('should validate input data', async () => {
      const request = new Request('http://localhost/api/admin/search/synonyms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          term: '',
          synonyms: [],
        }),
      })

      const response = await POST(request as any)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid input')
      expect(mockDb.synonym.create).not.toHaveBeenCalled()
    })
  })

  describe('PUT /api/admin/search/synonyms/[id]', () => {
    it('should update and persist a synonym', async () => {
      const mockSynonym = {
        id: 'syn-1',
        term: 'dog',
        synonyms: ['canine', 'puppy', 'hound'],
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
      }

      mockDb.synonym.update.mockResolvedValue(mockSynonym)

      const request = new Request('http://localhost/api/admin/search/synonyms/syn-1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          term: 'dog',
          synonyms: ['canine', 'puppy', 'hound'],
        }),
      })

      const response = await PUT(request as any, { params: { id: 'syn-1' } })
      const data = await response.json()

      expect(mockDb.synonym.update).toHaveBeenCalledWith({
        where: { id: 'syn-1' },
        data: {
          term: 'dog',
          synonyms: ['canine', 'puppy', 'hound'],
        },
      })

      expect(data.term).toBe('dog')
      expect(data.synonyms).toEqual(['canine', 'puppy', 'hound'])
    })
  })

  describe('GET /api/admin/search/synonyms', () => {
    it('should fetch all synonyms', async () => {
      const mockSynonyms = [
        {
          id: 'syn-1',
          term: 'dog',
          synonyms: ['canine', 'puppy'],
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
        {
          id: 'syn-2',
          term: 'cat',
          synonyms: ['feline', 'kitten'],
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
      ]

      mockDb.synonym.findMany.mockResolvedValue(mockSynonyms)

      const response = await GET()
      const data = await response.json()

      expect(mockDb.synonym.findMany).toHaveBeenCalledWith({
        orderBy: { term: 'asc' },
      })

      expect(data).toHaveLength(2)
      expect(data[0].term).toBe('dog')
      expect(data[1].term).toBe('cat')
    })
  })
})

