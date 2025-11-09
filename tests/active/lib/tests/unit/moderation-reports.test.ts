/**
 * Tests for Admin Moderation Reports API
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
    })),
  },
}))

// Mock dependencies first
jest.mock('@/lib/db', () => ({
  prisma: {
    moderationReport: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    moderationAction: {
      create: jest.fn(),
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

// Import route handlers after mocks are set up
import { GET, POST } from '@/app/api/admin/moderation/reports/route'
import { POST as POSTAction } from '@/app/api/admin/moderation/reports/[id]/action/route'

const mockPrisma = prisma as jest.Mocked<typeof prisma>
const mockGetCurrentUser = getCurrentUser as jest.MockedFunction<typeof getCurrentUser>
const mockHasRole = hasRole as jest.MockedFunction<typeof hasRole>
const mockWriteAudit = writeAudit as jest.MockedFunction<typeof writeAudit>

describe('Admin Moderation Reports API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/admin/moderation/reports', () => {
    it('should return reports for admin users', async () => {
      mockGetCurrentUser.mockResolvedValue({
        id: 'admin-1',
        email: 'admin@test.com',
        name: 'Admin User',
        roles: ['Admin'],
      })
      mockHasRole.mockReturnValue(true)
      mockPrisma.moderationReport.findMany.mockResolvedValue([
        {
          id: 'report-1',
          reporterId: 'user-1',
          subjectType: 'post',
          subjectId: 'post-1',
          reason: 'Spam',
          status: 'open',
          assignedTo: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          actions: [],
        },
      ])

      const request = new Request('http://localhost/api/admin/moderation/reports')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.items).toHaveLength(1)
      expect(mockHasRole).toHaveBeenCalledWith(
        expect.objectContaining({ roles: ['Admin'] }),
        ['Admin', 'Moderator']
      )
    })

    it('should filter by status when provided', async () => {
      mockGetCurrentUser.mockResolvedValue({
        id: 'admin-1',
        email: 'admin@test.com',
        name: 'Admin User',
        roles: ['Admin'],
      })
      mockHasRole.mockReturnValue(true)
      mockPrisma.moderationReport.findMany.mockResolvedValue([])

      const request = new Request('http://localhost/api/admin/moderation/reports?status=closed')
      await GET(request)

      expect(mockPrisma.moderationReport.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'closed' },
        })
      )
    })

    it('should filter by type when provided', async () => {
      mockGetCurrentUser.mockResolvedValue({
        id: 'admin-1',
        email: 'admin@test.com',
        name: 'Admin User',
        roles: ['Admin'],
      })
      mockHasRole.mockReturnValue(true)
      mockPrisma.moderationReport.findMany.mockResolvedValue([])

      const request = new Request('http://localhost/api/admin/moderation/reports?type=spam')
      await GET(request)

      expect(mockPrisma.moderationReport.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ reason: 'spam' }),
        })
      )
    })

    it('should filter by age when provided', async () => {
      mockGetCurrentUser.mockResolvedValue({
        id: 'admin-1',
        email: 'admin@test.com',
        name: 'Admin User',
        roles: ['Admin'],
      })
      mockHasRole.mockReturnValue(true)
      mockPrisma.moderationReport.findMany.mockResolvedValue([])

      const request = new Request('http://localhost/api/admin/moderation/reports?age=last-day')
      await GET(request)

      expect(mockPrisma.moderationReport.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: expect.objectContaining({ gte: expect.any(Date) }),
          }),
        })
      )
    })

    it('should return 403 for non-admin users', async () => {
      mockGetCurrentUser.mockResolvedValue({
        id: 'user-1',
        email: 'user@test.com',
        name: 'Regular User',
        roles: [],
      })
      mockHasRole.mockReturnValue(false)

      const request = new Request('http://localhost/api/admin/moderation/reports')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Forbidden')
    })

    it('should return empty array if database fails', async () => {
      mockGetCurrentUser.mockResolvedValue({
        id: 'admin-1',
        email: 'admin@test.com',
        name: 'Admin User',
        roles: ['Admin'],
      })
      mockHasRole.mockReturnValue(true)
      mockPrisma.moderationReport.findMany.mockRejectedValue(new Error('DB error'))

      const request = new Request('http://localhost/api/admin/moderation/reports')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.items).toEqual([])
    })
  })

  describe('POST /api/admin/moderation/reports', () => {
    it('should create a new report', async () => {
      const reportData = {
        reporterId: 'user-1',
        subjectType: 'post',
        subjectId: 'post-1',
        reason: 'Spam content',
      }

      mockPrisma.moderationReport.create.mockResolvedValue({
        id: 'report-1',
        ...reportData,
        status: 'open',
        assignedTo: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const request = new Request('http://localhost/api/admin/moderation/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reportData),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.item).toMatchObject(reportData)
      expect(mockPrisma.moderationReport.create).toHaveBeenCalledWith({
        data: {
          ...reportData,
          status: 'open',
        },
      })
    })

    it('should return 400 for missing required fields', async () => {
      const request = new Request('http://localhost/api/admin/moderation/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reporterId: 'user-1' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Missing required fields')
    })
  })

  describe('POST /api/admin/moderation/reports/[id]/action', () => {
    it('should process approve action', async () => {
      mockGetCurrentUser.mockResolvedValue({
        id: 'admin-1',
        email: 'admin@test.com',
        name: 'Admin User',
        roles: ['Admin'],
      })
      mockHasRole.mockReturnValue(true)

      const report = {
        id: 'report-1',
        subjectType: 'post',
        subjectId: 'post-1',
        status: 'open',
      }

      mockPrisma.moderationReport.update.mockResolvedValue({
        ...report,
        status: 'closed',
        assignedTo: 'admin-1',
        reporterId: 'user-1',
        reason: 'Spam',
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      mockPrisma.moderationAction.create.mockResolvedValue({
        id: 'action-1',
        reportId: 'report-1',
        actorId: 'admin-1',
        type: 'approve',
        reason: 'Approved',
        metadata: null,
        createdAt: new Date(),
      })

      const request = new Request('http://localhost/api/admin/moderation/reports/report-1/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve', reason: 'Approved' }),
      })

      const response = await POSTAction(request, { params: Promise.resolve({ id: 'report-1' }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.ok).toBe(true)
      expect(mockPrisma.moderationReport.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'report-1' },
          data: {
            status: 'closed',
            assignedTo: 'admin-1',
          },
        })
      )
      expect(mockWriteAudit).toHaveBeenCalled()
    })

    it('should validate action type', async () => {
      mockGetCurrentUser.mockResolvedValue({
        id: 'admin-1',
        email: 'admin@test.com',
        name: 'Admin User',
        roles: ['Admin'],
      })
      mockHasRole.mockReturnValue(true)

      const request = new Request('http://localhost/api/admin/moderation/reports/report-1/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'invalid-action' }),
      })

      const response = await POSTAction(request, { params: Promise.resolve({ id: 'report-1' }) })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Invalid action')
    })

    it('should return 403 for non-admin users', async () => {
      mockGetCurrentUser.mockResolvedValue({
        id: 'user-1',
        email: 'user@test.com',
        name: 'Regular User',
        roles: [],
      })
      mockHasRole.mockReturnValue(false)

      const request = new Request('http://localhost/api/admin/moderation/reports/report-1/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' }),
      })

      const response = await POSTAction(request, { params: Promise.resolve({ id: 'report-1' }) })
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Forbidden')
    })

    it('should handle mute action with muteDays', async () => {
      mockGetCurrentUser.mockResolvedValue({
        id: 'admin-1',
        email: 'admin@test.com',
        name: 'Admin User',
        roles: ['Admin'],
      })
      mockHasRole.mockReturnValue(true)

      const report = {
        id: 'report-1',
        subjectType: 'post',
        subjectId: 'post-1',
        status: 'open',
      }

      mockPrisma.moderationReport.update.mockResolvedValue({
        ...report,
        status: 'triaged',
        assignedTo: 'admin-1',
        reporterId: 'user-1',
        reason: 'spam',
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      mockPrisma.moderationAction.create.mockResolvedValue({
        id: 'action-1',
        reportId: 'report-1',
        actorId: 'admin-1',
        type: 'mute',
        reason: 'Spam content',
        metadata: { muteDays: 7 },
        createdAt: new Date(),
      })

      const request = new Request('http://localhost/api/admin/moderation/reports/report-1/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mute', reason: 'Spam content', muteDays: 7 }),
      })

      const response = await POSTAction(request, { params: Promise.resolve({ id: 'report-1' }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.ok).toBe(true)
      expect(mockPrisma.moderationAction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: 'mute',
            metadata: { muteDays: 7 },
          }),
        })
      )
    })

    it('should handle shadowban action', async () => {
      mockGetCurrentUser.mockResolvedValue({
        id: 'admin-1',
        email: 'admin@test.com',
        name: 'Admin User',
        roles: ['Admin'],
      })
      mockHasRole.mockReturnValue(true)

      const report = {
        id: 'report-1',
        subjectType: 'post',
        subjectId: 'post-1',
        status: 'open',
      }

      mockPrisma.moderationReport.update.mockResolvedValue({
        ...report,
        status: 'triaged',
        assignedTo: 'admin-1',
        reporterId: 'user-1',
        reason: 'abuse',
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      mockPrisma.moderationAction.create.mockResolvedValue({
        id: 'action-1',
        reportId: 'report-1',
        actorId: 'admin-1',
        type: 'shadowban',
        reason: 'Abusive behavior',
        metadata: null,
        createdAt: new Date(),
      })

      const request = new Request('http://localhost/api/admin/moderation/reports/report-1/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'shadowban', reason: 'Abusive behavior' }),
      })

      const response = await POSTAction(request, { params: Promise.resolve({ id: 'report-1' }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.ok).toBe(true)
      expect(mockPrisma.moderationAction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: 'shadowban',
          }),
        })
      )
    })

    it('should handle escalation to senior moderator', async () => {
      mockGetCurrentUser.mockResolvedValue({
        id: 'admin-1',
        email: 'admin@test.com',
        name: 'Admin User',
        roles: ['Admin'],
      })
      mockHasRole.mockReturnValue(true)

      const report = {
        id: 'report-1',
        subjectType: 'post',
        subjectId: 'post-1',
        status: 'open',
      }

      mockPrisma.moderationReport.update.mockResolvedValue({
        ...report,
        status: 'triaged',
        assignedTo: 'admin-1',
        reporterId: 'user-1',
        reason: 'abuse',
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      mockPrisma.moderationAction.create.mockResolvedValue({
        id: 'action-1',
        reportId: 'report-1',
        actorId: 'admin-1',
        type: 'warn',
        reason: 'Escalated case',
        metadata: { escalateToSenior: true },
        createdAt: new Date(),
      })

      const request = new Request('http://localhost/api/admin/moderation/reports/report-1/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'warn', reason: 'Escalated case', escalateToSenior: true }),
      })

      const response = await POSTAction(request, { params: Promise.resolve({ id: 'report-1' }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.ok).toBe(true)
      expect(mockPrisma.moderationAction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            metadata: { escalateToSenior: true },
          }),
        })
      )
    })

    it('should validate muteDays for mute action', async () => {
      mockGetCurrentUser.mockResolvedValue({
        id: 'admin-1',
        email: 'admin@test.com',
        name: 'Admin User',
        roles: ['Admin'],
      })
      mockHasRole.mockReturnValue(true)

      const request = new Request('http://localhost/api/admin/moderation/reports/report-1/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mute', reason: 'Test' }),
      })

      const response = await POSTAction(request, { params: Promise.resolve({ id: 'report-1' }) })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('muteDays')
    })

    it('should transition status correctly for different actions', async () => {
      mockGetCurrentUser.mockResolvedValue({
        id: 'admin-1',
        email: 'admin@test.com',
        name: 'Admin User',
        roles: ['Admin'],
      })
      mockHasRole.mockReturnValue(true)

      const report = {
        id: 'report-1',
        subjectType: 'post',
        subjectId: 'post-1',
        status: 'open',
      }

      // Test warn action -> triaged
      mockPrisma.moderationReport.update.mockResolvedValue({
        ...report,
        status: 'triaged',
        assignedTo: 'admin-1',
        reporterId: 'user-1',
        reason: 'spam',
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      mockPrisma.moderationAction.create.mockResolvedValue({
        id: 'action-1',
        reportId: 'report-1',
        actorId: 'admin-1',
        type: 'warn',
        reason: 'Warning',
        metadata: null,
        createdAt: new Date(),
      })

      const request = new Request('http://localhost/api/admin/moderation/reports/report-1/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'warn', reason: 'Warning' }),
      })

      const response = await POSTAction(request, { params: Promise.resolve({ id: 'report-1' }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.ok).toBe(true)
      expect(mockPrisma.moderationReport.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'triaged',
          }),
        })
      )
    })
  })
})

