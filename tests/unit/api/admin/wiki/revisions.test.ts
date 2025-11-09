/**
 * Tests for Admin Wiki Revision APIs
 * 
 * Tests:
 * - Only Experts/Moderators can approve stable
 * - Rollback is audited
 * - Request changes works
 * - Assign to expert works
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals'

// Mock Prisma
const mockPrisma = {
  flaggedRevision: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
  },
  article: {
    findUnique: jest.fn(),
  },
  revision: {
    create: jest.fn(),
    count: jest.fn(),
  },
}

// Mock auth
const mockGetCurrentUser = jest.fn()
const mockHasRole = jest.fn()

jest.mock('@/lib/db', () => ({
  prisma: mockPrisma,
}))

jest.mock('@/lib/auth/session', () => ({
  getCurrentUser: () => mockGetCurrentUser(),
  hasRole: (user: any, roles: string[]) => mockHasRole(user, roles),
}))

jest.mock('@/lib/audit', () => ({
  writeAudit: jest.fn(),
}))

jest.mock('@/lib/actions/wiki', () => ({
  getWikiRevisionByIdAction: jest.fn(),
  getWikiArticleByIdAction: jest.fn(),
  getWikiRevisionsByArticleIdAction: jest.fn(),
}))

describe('Admin Wiki Revision APIs', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /api/admin/wiki/revisions/[id]/approve', () => {
    it('should allow Experts to approve stable revisions', async () => {
      const { writeAudit } = await import('@/lib/audit')
      const { getWikiRevisionByIdAction, getWikiRevisionsByArticleIdAction } = await import('@/lib/actions/wiki')

      mockGetCurrentUser.mockResolvedValue({
        id: 'expert-1',
        email: 'expert@example.com',
        roles: ['Expert'],
      })
      mockHasRole.mockReturnValue(true)

      mockPrisma.flaggedRevision.findUnique.mockResolvedValue({
        id: 'fr-1',
        articleId: 'article-1',
        revisionId: 'rev-1',
        type: 'Health',
        status: 'pending',
        flaggedAt: new Date(),
      })

      mockPrisma.flaggedRevision.update.mockResolvedValue({
        id: 'fr-1',
        status: 'approved',
        approvedBy: 'expert-1',
        approvedAt: new Date(),
      })

      getWikiRevisionByIdAction.mockResolvedValue({
        id: 'rev-1',
        content: 'Test content',
        createdAt: new Date().toISOString(),
        authorId: 'author-1',
      })

      const { POST } = await import('@/app/api/admin/wiki/revisions/[id]/approve/route')
      const response = await POST(
        new Request('http://localhost/api/admin/wiki/revisions/fr-1/approve', { method: 'POST' }),
        { params: Promise.resolve({ id: 'fr-1' }) }
      )

      expect(response.status).toBe(200)
      expect(mockPrisma.flaggedRevision.update).toHaveBeenCalled()
      expect(writeAudit).toHaveBeenCalledWith(
        'expert-1',
        'wiki:approve-stable',
        'revision',
        'rev-1',
        expect.stringContaining('Approved flagged revision')
      )
    })

    it('should allow Moderators to approve stable revisions', async () => {
      mockGetCurrentUser.mockResolvedValue({
        id: 'mod-1',
        email: 'mod@example.com',
        roles: ['Moderator'],
      })
      mockHasRole.mockReturnValue(true)

      mockPrisma.flaggedRevision.findUnique.mockResolvedValue({
        id: 'fr-1',
        articleId: 'article-1',
        revisionId: 'rev-1',
        type: 'Health',
        status: 'pending',
        flaggedAt: new Date(),
      })

      mockPrisma.flaggedRevision.update.mockResolvedValue({
        id: 'fr-1',
        status: 'approved',
        approvedBy: 'mod-1',
        approvedAt: new Date(),
      })

      const { getWikiRevisionByIdAction } = await import('@/lib/actions/wiki')
      getWikiRevisionByIdAction.mockResolvedValue({
        id: 'rev-1',
        content: 'Test content',
        createdAt: new Date().toISOString(),
        authorId: 'author-1',
      })

      const { POST } = await import('@/app/api/admin/wiki/revisions/[id]/approve/route')
      const response = await POST(
        new Request('http://localhost/api/admin/wiki/revisions/fr-1/approve', { method: 'POST' }),
        { params: Promise.resolve({ id: 'fr-1' }) }
      )

      expect(response.status).toBe(200)
      expect(mockHasRole).toHaveBeenCalled()
    })

    it('should reject regular admins from approving stable revisions', async () => {
      mockGetCurrentUser.mockResolvedValue({
        id: 'admin-1',
        email: 'admin@example.com',
        roles: ['Admin'],
      })
      mockHasRole.mockReturnValue(false) // Admin is not Expert or Moderator

      const { POST } = await import('@/app/api/admin/wiki/revisions/[id]/approve/route')
      const response = await POST(
        new Request('http://localhost/api/admin/wiki/revisions/fr-1/approve', { method: 'POST' }),
        { params: Promise.resolve({ id: 'fr-1' }) }
      )

      expect(response.status).toBe(403)
      const data = await response.json()
      expect(data.error).toContain('Only Experts and Moderators')
      expect(mockPrisma.flaggedRevision.update).not.toHaveBeenCalled()
    })

    it('should reject unauthenticated users', async () => {
      mockGetCurrentUser.mockResolvedValue(null)

      const { POST } = await import('@/app/api/admin/wiki/revisions/[id]/approve/route')
      const response = await POST(
        new Request('http://localhost/api/admin/wiki/revisions/fr-1/approve', { method: 'POST' }),
        { params: Promise.resolve({ id: 'fr-1' }) }
      )

      expect(response.status).toBe(403)
    })
  })

  describe('POST /api/admin/wiki/revisions/[id]/rollback', () => {
    it('should rollback revision and audit the action', async () => {
      const { writeAudit } = await import('@/lib/audit')
      const { getWikiRevisionsByArticleIdAction } = await import('@/lib/actions/wiki')

      mockGetCurrentUser.mockResolvedValue({
        id: 'admin-1',
        email: 'admin@example.com',
        roles: ['Admin'],
      })
      mockHasRole.mockReturnValue(true)

      mockPrisma.flaggedRevision.findUnique.mockResolvedValue({
        id: 'fr-1',
        articleId: 'article-1',
        revisionId: 'rev-2',
        type: 'Health',
        status: 'pending',
        flaggedAt: new Date(),
      })

      mockPrisma.article.findUnique.mockResolvedValue({
        id: 'article-1',
        title: 'Test Article',
        slug: 'test-article',
      })

      getWikiRevisionsByArticleIdAction.mockResolvedValue([
        {
          id: 'rev-1',
          content: 'Stable content',
          status: 'stable',
          createdAt: new Date().toISOString(),
          authorId: 'author-1',
        },
        {
          id: 'rev-2',
          content: 'New content',
          status: 'draft',
          createdAt: new Date().toISOString(),
          authorId: 'author-2',
        },
      ])

      mockPrisma.flaggedRevision.update.mockResolvedValue({
        id: 'fr-1',
        status: 'rolled-back',
      })

      const { POST } = await import('@/app/api/admin/wiki/revisions/[id]/rollback/route')
      const response = await POST(
        new Request('http://localhost/api/admin/wiki/revisions/fr-1/rollback', { method: 'POST' }),
        { params: Promise.resolve({ id: 'fr-1' }) }
      )

      expect(response.status).toBe(200)
      expect(mockPrisma.flaggedRevision.update).toHaveBeenCalledWith({
        where: { id: 'fr-1' },
        data: { status: 'rolled-back' },
      })
      expect(writeAudit).toHaveBeenCalledWith(
        'admin-1',
        'wiki:rollback',
        'revision',
        'rev-2',
        expect.stringContaining('Rolled back to stable revision')
      )
    })

    it('should reject rollback if no stable revision exists', async () => {
      const { getWikiRevisionsByArticleIdAction } = await import('@/lib/actions/wiki')

      mockGetCurrentUser.mockResolvedValue({
        id: 'admin-1',
        email: 'admin@example.com',
        roles: ['Admin'],
      })
      mockHasRole.mockReturnValue(true)

      mockPrisma.flaggedRevision.findUnique.mockResolvedValue({
        id: 'fr-1',
        articleId: 'article-1',
        revisionId: 'rev-1',
        type: 'Health',
        status: 'pending',
        flaggedAt: new Date(),
      })

      mockPrisma.article.findUnique.mockResolvedValue({
        id: 'article-1',
        title: 'Test Article',
        slug: 'test-article',
      })

      getWikiRevisionsByArticleIdAction.mockResolvedValue([
        {
          id: 'rev-1',
          content: 'Only revision',
          status: 'draft',
          createdAt: new Date().toISOString(),
          authorId: 'author-1',
        },
      ])

      const { POST } = await import('@/app/api/admin/wiki/revisions/[id]/rollback/route')
      const response = await POST(
        new Request('http://localhost/api/admin/wiki/revisions/fr-1/rollback', { method: 'POST' }),
        { params: Promise.resolve({ id: 'fr-1' }) }
      )

      expect(response.status).toBe(404)
      const data = await response.json()
      expect(data.error).toContain('No stable revision found')
      expect(mockPrisma.flaggedRevision.update).not.toHaveBeenCalled()
    })
  })

  describe('POST /api/admin/wiki/revisions/[id]/request-changes', () => {
    it('should request changes with comment', async () => {
      const { writeAudit } = await import('@/lib/audit')

      mockGetCurrentUser.mockResolvedValue({
        id: 'mod-1',
        email: 'mod@example.com',
        roles: ['Moderator'],
      })
      mockHasRole.mockReturnValue(true)

      mockPrisma.flaggedRevision.update.mockResolvedValue({
        id: 'fr-1',
        status: 'changes-requested',
      })

      const { POST } = await import('@/app/api/admin/wiki/revisions/[id]/request-changes/route')
      const request = new Request('http://localhost/api/admin/wiki/revisions/fr-1/request-changes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment: 'Please fix formatting' }),
      })

      const response = await POST(request, { params: Promise.resolve({ id: 'fr-1' }) })

      expect(response.status).toBe(200)
      expect(mockPrisma.flaggedRevision.update).toHaveBeenCalledWith({
        where: { id: 'fr-1' },
        data: { status: 'changes-requested' },
      })
      expect(writeAudit).toHaveBeenCalledWith(
        'mod-1',
        'wiki:request-changes',
        'revision',
        'fr-1',
        'Please fix formatting'
      )
    })
  })

  describe('POST /api/admin/wiki/revisions/[id]/assign', () => {
    it('should assign revision to expert', async () => {
      const { writeAudit } = await import('@/lib/audit')

      mockGetCurrentUser.mockResolvedValue({
        id: 'admin-1',
        email: 'admin@example.com',
        roles: ['Admin'],
      })
      mockHasRole.mockReturnValue(true)

      mockPrisma.flaggedRevision.update.mockResolvedValue({
        id: 'fr-1',
        assignedTo: 'expert-1',
      })

      const { POST } = await import('@/app/api/admin/wiki/revisions/[id]/assign/route')
      const request = new Request('http://localhost/api/admin/wiki/revisions/fr-1/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expertId: 'expert-1' }),
      })

      const response = await POST(request, { params: Promise.resolve({ id: 'fr-1' }) })

      expect(response.status).toBe(200)
      expect(mockPrisma.flaggedRevision.update).toHaveBeenCalledWith({
        where: { id: 'fr-1' },
        data: { assignedTo: 'expert-1' },
      })
      expect(writeAudit).toHaveBeenCalledWith(
        'admin-1',
        'wiki:assign-expert',
        'revision',
        'fr-1',
        expect.stringContaining('Assigned flagged revision to expert')
      )
    })
  })
})
