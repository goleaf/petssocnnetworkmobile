/**
 * Integration tests for Queue Counts API Route
 * Tests GET /api/admin/moderation/queue-counts
 */

import { NextResponse } from 'next/server'
import { GET } from '@/app/api/admin/moderation/queue-counts/route'
import { getSession } from '@/lib/auth-server'
import { prisma } from '@/lib/prisma'

// Mock dependencies
jest.mock('@/lib/auth-server')
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    editRequest: {
      count: jest.fn(),
    },
  },
}))

const mockGetSession = getSession as jest.MockedFunction<typeof getSession>
const mockPrismaUserFindUnique = prisma.user.findUnique as jest.MockedFunction<typeof prisma.user.findUnique>
const mockPrismaEditRequestCount = prisma.editRequest.count as jest.MockedFunction<typeof prisma.editRequest.count>

describe('Queue Counts API Route', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Authentication and Authorization', () => {
    it('should return 401 when user is not authenticated', async () => {
      mockGetSession.mockResolvedValue(null)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should return 401 when session has no userId', async () => {
      mockGetSession.mockResolvedValue({ userId: null } as any)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should return 403 when user is not found', async () => {
      mockGetSession.mockResolvedValue({ userId: 'user123' } as any)
      mockPrismaUserFindUnique.mockResolvedValue(null)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Forbidden - Moderator access required')
    })

    it('should return 403 when user is not a moderator or admin', async () => {
      mockGetSession.mockResolvedValue({ userId: 'user123' } as any)
      mockPrismaUserFindUnique.mockResolvedValue({ role: 'user' } as any)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Forbidden - Moderator access required')
    })

    it('should allow access for moderator role', async () => {
      mockGetSession.mockResolvedValue({ userId: 'mod123' } as any)
      mockPrismaUserFindUnique.mockResolvedValue({ role: 'moderator' } as any)
      mockPrismaEditRequestCount.mockResolvedValue(0)

      const response = await GET()

      expect(response.status).toBe(200)
    })

    it('should allow access for admin role', async () => {
      mockGetSession.mockResolvedValue({ userId: 'admin123' } as any)
      mockPrismaUserFindUnique.mockResolvedValue({ role: 'admin' } as any)
      mockPrismaEditRequestCount.mockResolvedValue(0)

      const response = await GET()

      expect(response.status).toBe(200)
    })
  })

  describe('Queue Counts', () => {
    beforeEach(() => {
      mockGetSession.mockResolvedValue({ userId: 'mod123' } as any)
      mockPrismaUserFindUnique.mockResolvedValue({ role: 'moderator' } as any)
    })

    it('should return correct counts for all queues', async () => {
      // Mock counts for each queue type
      mockPrismaEditRequestCount
        .mockResolvedValueOnce(5)  // new-pages
        .mockResolvedValueOnce(3)  // flagged-health
        .mockResolvedValueOnce(2)  // coi-edits
        .mockResolvedValueOnce(4)  // image-reviews
        .mockResolvedValueOnce(1)  // urgent

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({
        queues: {
          'new-pages': 5,
          'flagged-health': 3,
          'coi-edits': 2,
          'image-reviews': 4,
        },
        totalPending: 14, // 5 + 3 + 2 + 4
        urgentCount: 1,
        hasUrgent: true,
      })
    })

    it('should return zero counts when no pending items', async () => {
      mockPrismaEditRequestCount.mockResolvedValue(0)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({
        queues: {
          'new-pages': 0,
          'flagged-health': 0,
          'coi-edits': 0,
          'image-reviews': 0,
        },
        totalPending: 0,
        urgentCount: 0,
        hasUrgent: false,
      })
    })

    it('should set hasUrgent to false when urgentCount is 0', async () => {
      mockPrismaEditRequestCount
        .mockResolvedValueOnce(2)  // new-pages
        .mockResolvedValueOnce(1)  // flagged-health
        .mockResolvedValueOnce(0)  // coi-edits
        .mockResolvedValueOnce(1)  // image-reviews
        .mockResolvedValueOnce(0)  // urgent

      const response = await GET()
      const data = await response.json()

      expect(data.hasUrgent).toBe(false)
      expect(data.urgentCount).toBe(0)
    })

    it('should set hasUrgent to true when urgentCount > 0', async () => {
      mockPrismaEditRequestCount
        .mockResolvedValueOnce(1)  // new-pages
        .mockResolvedValueOnce(0)  // flagged-health
        .mockResolvedValueOnce(0)  // coi-edits
        .mockResolvedValueOnce(0)  // image-reviews
        .mockResolvedValueOnce(3)  // urgent

      const response = await GET()
      const data = await response.json()

      expect(data.hasUrgent).toBe(true)
      expect(data.urgentCount).toBe(3)
    })

    it('should calculate totalPending correctly', async () => {
      mockPrismaEditRequestCount
        .mockResolvedValueOnce(10)  // new-pages
        .mockResolvedValueOnce(5)   // flagged-health
        .mockResolvedValueOnce(3)   // coi-edits
        .mockResolvedValueOnce(7)   // image-reviews
        .mockResolvedValueOnce(2)   // urgent

      const response = await GET()
      const data = await response.json()

      expect(data.totalPending).toBe(25) // 10 + 5 + 3 + 7
    })
  })

  describe('Database Query Filters', () => {
    beforeEach(() => {
      mockGetSession.mockResolvedValue({ userId: 'mod123' } as any)
      mockPrismaUserFindUnique.mockResolvedValue({ role: 'moderator' } as any)
      mockPrismaEditRequestCount.mockResolvedValue(0)
    })

    it('should query new-pages with correct filters', async () => {
      await GET()

      expect(mockPrismaEditRequestCount).toHaveBeenCalledWith({
        where: {
          status: 'pending',
          isNewPage: true,
        },
      })
    })

    it('should query flagged-health with correct filters', async () => {
      await GET()

      expect(mockPrismaEditRequestCount).toHaveBeenCalledWith({
        where: {
          status: 'pending',
          isFlaggedHealth: true,
        },
      })
    })

    it('should query coi-edits with correct filters', async () => {
      await GET()

      expect(mockPrismaEditRequestCount).toHaveBeenCalledWith({
        where: {
          status: 'pending',
          isCOI: true,
        },
      })
    })

    it('should query image-reviews with correct filters', async () => {
      await GET()

      expect(mockPrismaEditRequestCount).toHaveBeenCalledWith({
        where: {
          status: 'pending',
          hasImages: true,
        },
      })
    })

    it('should query urgent items with correct filters', async () => {
      await GET()

      expect(mockPrismaEditRequestCount).toHaveBeenCalledWith({
        where: {
          status: 'pending',
          priority: 'urgent',
        },
      })
    })

    it('should execute all queries in parallel', async () => {
      await GET()

      // Verify all 5 count queries were called
      expect(mockPrismaEditRequestCount).toHaveBeenCalledTimes(5)
    })
  })

  describe('Error Handling', () => {
    beforeEach(() => {
      mockGetSession.mockResolvedValue({ userId: 'mod123' } as any)
      mockPrismaUserFindUnique.mockResolvedValue({ role: 'moderator' } as any)
    })

    it('should return 500 when database query fails', async () => {
      mockPrismaEditRequestCount.mockRejectedValue(new Error('Database connection failed'))

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
    })

    it('should log error when database query fails', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
      const dbError = new Error('Database connection failed')
      mockPrismaEditRequestCount.mockRejectedValue(dbError)

      await GET()

      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to get queue counts:', dbError)
      consoleErrorSpy.mockRestore()
    })

    it('should return 500 when user lookup fails', async () => {
      mockPrismaUserFindUnique.mockRejectedValue(new Error('User lookup failed'))

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
    })

    it('should return 500 when session check fails', async () => {
      mockGetSession.mockRejectedValue(new Error('Session check failed'))

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
    })
  })

  describe('Response Format', () => {
    beforeEach(() => {
      mockGetSession.mockResolvedValue({ userId: 'mod123' } as any)
      mockPrismaUserFindUnique.mockResolvedValue({ role: 'moderator' } as any)
      mockPrismaEditRequestCount
        .mockResolvedValueOnce(1)
        .mockResolvedValueOnce(2)
        .mockResolvedValueOnce(3)
        .mockResolvedValueOnce(4)
        .mockResolvedValueOnce(5)
    })

    it('should return JSON response', async () => {
      const response = await GET()
      const data = await response.json()

      expect(typeof data).toBe('object')
      expect(data).not.toBeNull()
    })

    it('should include all required fields', async () => {
      const response = await GET()
      const data = await response.json()

      expect(data).toHaveProperty('queues')
      expect(data).toHaveProperty('totalPending')
      expect(data).toHaveProperty('urgentCount')
      expect(data).toHaveProperty('hasUrgent')
    })

    it('should have correct queue structure', async () => {
      const response = await GET()
      const data = await response.json()

      expect(data.queues).toHaveProperty('new-pages')
      expect(data.queues).toHaveProperty('flagged-health')
      expect(data.queues).toHaveProperty('coi-edits')
      expect(data.queues).toHaveProperty('image-reviews')
    })

    it('should return numbers for all count fields', async () => {
      const response = await GET()
      const data = await response.json()

      expect(typeof data.queues['new-pages']).toBe('number')
      expect(typeof data.queues['flagged-health']).toBe('number')
      expect(typeof data.queues['coi-edits']).toBe('number')
      expect(typeof data.queues['image-reviews']).toBe('number')
      expect(typeof data.totalPending).toBe('number')
      expect(typeof data.urgentCount).toBe('number')
    })

    it('should return boolean for hasUrgent', async () => {
      const response = await GET()
      const data = await response.json()

      expect(typeof data.hasUrgent).toBe('boolean')
    })
  })
})
