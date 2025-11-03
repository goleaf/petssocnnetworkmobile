/**
 * Tests for Admin Wiki Revisions API
 */

import { POST as POSTApprove } from '@/app/api/admin/wiki/revisions/[id]/approve/route'
import { POST as POSTRequestChanges } from '@/app/api/admin/wiki/revisions/[id]/request-changes/route'

// Mock dependencies
jest.mock('@/lib/db', () => ({
  prisma: {
    flaggedRevision: {
      update: jest.fn(),
    },
  },
}))

jest.mock('@/lib/auth/session', () => ({
  getCurrentUser: jest.fn(),
  hasRole: jest.fn(),
}))

jest.mock('@/lib/audit', () => ({
  writeAudit: jest.fn(),
}))

import { prisma } from '@/lib/db'
import { getCurrentUser, hasRole } from '@/lib/auth/session'
import { writeAudit } from '@/lib/audit'

const mockPrisma = prisma as jest.Mocked<typeof prisma>
const mockGetCurrentUser = getCurrentUser as jest.MockedFunction<typeof getCurrentUser>
const mockHasRole = hasRole as jest.MockedFunction<typeof hasRole>
const mockWriteAudit = writeAudit as jest.MockedFunction<typeof writeAudit>

describe('Admin Wiki Revisions API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /api/admin/wiki/revisions/[id]/approve', () => {
    it('should approve a flagged revision for admin', async () => {
      mockGetCurrentUser.mockResolvedValue({
        id: 'admin-1',
        email: 'admin@test.com',
        name: 'Admin User',
        roles: ['Admin'],
      })
      mockHasRole.mockReturnValue(true)

      const revision = {
        id: 'revision-1',
        articleId: 'article-1',
        revisionId: 'rev-1',
        type: 'Health',
        status: 'pending',
        flaggedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockPrisma.flaggedRevision.update.mockResolvedValue({
        ...revision,
        status: 'approved',
        approvedAt: new Date(),
        approvedBy: 'admin-1',
        assignedTo: null,
      })

      const request = new Request('http://localhost/api/admin/wiki/revisions/revision-1/approve', {
        method: 'POST',
      })

      const response = await POSTApprove(request, {
        params: Promise.resolve({ id: 'revision-1' }),
      })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.ok).toBe(true)
      expect(mockPrisma.flaggedRevision.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'revision-1' },
          data: {
            status: 'approved',
            approvedAt: expect.any(Date),
            approvedBy: 'admin-1',
          },
        })
      )
      expect(mockWriteAudit).toHaveBeenCalledWith(
        'admin-1',
        'wiki:approve-stable',
        'revision',
        'rev-1',
        expect.any(String)
      )
    })

    it('should allow expert role to approve', async () => {
      mockGetCurrentUser.mockResolvedValue({
        id: 'expert-1',
        email: 'expert@test.com',
        name: 'Expert User',
        roles: ['Expert'],
      })
      mockHasRole.mockReturnValue(true)

      mockPrisma.flaggedRevision.update.mockResolvedValue({
        id: 'revision-1',
        articleId: 'article-1',
        revisionId: 'rev-1',
        type: 'Health',
        status: 'approved',
        flaggedAt: new Date(),
        approvedAt: new Date(),
        approvedBy: 'expert-1',
        assignedTo: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const request = new Request('http://localhost/api/admin/wiki/revisions/revision-1/approve', {
        method: 'POST',
      })

      const response = await POSTApprove(request, {
        params: Promise.resolve({ id: 'revision-1' }),
      })

      expect(response.status).toBe(200)
      expect(mockHasRole).toHaveBeenCalledWith(
        expect.objectContaining({ roles: ['Expert'] }),
        ['Admin', 'Moderator', 'Expert']
      )
    })

    it('should return 403 for unauthorized users', async () => {
      mockGetCurrentUser.mockResolvedValue({
        id: 'user-1',
        email: 'user@test.com',
        name: 'Regular User',
        roles: [],
      })
      mockHasRole.mockReturnValue(false)

      const request = new Request('http://localhost/api/admin/wiki/revisions/revision-1/approve', {
        method: 'POST',
      })

      const response = await POSTApprove(request, {
        params: Promise.resolve({ id: 'revision-1' }),
      })
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Forbidden')
    })
  })

  describe('POST /api/admin/wiki/revisions/[id]/request-changes', () => {
    it('should request changes on a flagged revision', async () => {
      mockGetCurrentUser.mockResolvedValue({
        id: 'admin-1',
        email: 'admin@test.com',
        name: 'Admin User',
        roles: ['Admin'],
      })
      mockHasRole.mockReturnValue(true)

      const revision = {
        id: 'revision-1',
        articleId: 'article-1',
        revisionId: 'rev-1',
        type: 'Health',
        status: 'pending',
        flaggedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockPrisma.flaggedRevision.update.mockResolvedValue({
        ...revision,
        status: 'changes-requested',
        assignedTo: null,
        approvedBy: null,
        approvedAt: null,
      })

      const request = new Request(
        'http://localhost/api/admin/wiki/revisions/revision-1/request-changes',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ comment: 'Please add citations' }),
        }
      )

      const response = await POSTRequestChanges(request, {
        params: Promise.resolve({ id: 'revision-1' }),
      })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.ok).toBe(true)
      expect(mockPrisma.flaggedRevision.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'revision-1' },
          data: {
            status: 'changes-requested',
          },
        })
      )
      expect(mockWriteAudit).toHaveBeenCalledWith(
        'admin-1',
        'wiki:request-changes',
        'revision',
        'revision-1',
        'Please add citations'
      )
    })

    it('should use default comment if none provided', async () => {
      mockGetCurrentUser.mockResolvedValue({
        id: 'admin-1',
        email: 'admin@test.com',
        name: 'Admin User',
        roles: ['Admin'],
      })
      mockHasRole.mockReturnValue(true)

      mockPrisma.flaggedRevision.update.mockResolvedValue({
        id: 'revision-1',
        articleId: 'article-1',
        revisionId: 'rev-1',
        type: 'Health',
        status: 'changes-requested',
        flaggedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        assignedTo: null,
        approvedBy: null,
        approvedAt: null,
      })

      const request = new Request(
        'http://localhost/api/admin/wiki/revisions/revision-1/request-changes',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        }
      )

      await POSTRequestChanges(request, {
        params: Promise.resolve({ id: 'revision-1' }),
      })

      expect(mockWriteAudit).toHaveBeenCalledWith(
        'admin-1',
        'wiki:request-changes',
        'revision',
        'revision-1',
        'Changes requested'
      )
    })
  })
})

