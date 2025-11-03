/**
 * Tests for Admin Moderation Reports Bulk Action API
 */

// Mock dependencies first
jest.mock('@/lib/db', () => ({
  prisma: {
    moderationReport: {
      findUnique: jest.fn(),
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
import { POST } from '@/app/api/admin/moderation/reports/bulk-action/route'

const mockPrisma = prisma as jest.Mocked<typeof prisma>
const mockGetCurrentUser = getCurrentUser as jest.MockedFunction<typeof getCurrentUser>
const mockHasRole = hasRole as jest.MockedFunction<typeof hasRole>
const mockWriteAudit = writeAudit as jest.MockedFunction<typeof writeAudit>

describe('Admin Moderation Reports Bulk Action API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should process bulk action on multiple reports', async () => {
    mockGetCurrentUser.mockResolvedValue({
      id: 'admin-1',
      email: 'admin@test.com',
      name: 'Admin User',
      roles: ['Admin'],
    })
    mockHasRole.mockReturnValue(true)

    const reports = [
      {
        id: 'report-1',
        subjectType: 'post',
        subjectId: 'post-1',
        status: 'open',
        reporterId: 'user-1',
        reason: 'spam',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'report-2',
        subjectType: 'comment',
        subjectId: 'comment-1',
        status: 'open',
        reporterId: 'user-2',
        reason: 'abuse',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]

    mockPrisma.moderationReport.findUnique
      .mockResolvedValueOnce(reports[0] as any)
      .mockResolvedValueOnce(reports[1] as any)

    mockPrisma.moderationReport.update
      .mockResolvedValueOnce({ ...reports[0], status: 'triaged', assignedTo: 'admin-1' } as any)
      .mockResolvedValueOnce({ ...reports[1], status: 'triaged', assignedTo: 'admin-1' } as any)

    mockPrisma.moderationAction.create
      .mockResolvedValueOnce({
        id: 'action-1',
        reportId: 'report-1',
        actorId: 'admin-1',
        type: 'warn',
        reason: 'Bulk warning',
        metadata: null,
        createdAt: new Date(),
      } as any)
      .mockResolvedValueOnce({
        id: 'action-2',
        reportId: 'report-2',
        actorId: 'admin-1',
        type: 'warn',
        reason: 'Bulk warning',
        metadata: null,
        createdAt: new Date(),
      } as any)

    const request = new Request('http://localhost/api/admin/moderation/reports/bulk-action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reportIds: ['report-1', 'report-2'],
        action: 'warn',
        reason: 'Bulk warning',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.ok).toBe(true)
    expect(data.processed).toBe(2)
    expect(data.success).toBe(2)
    expect(data.failures).toBe(0)
    expect(mockPrisma.moderationReport.update).toHaveBeenCalledTimes(2)
    expect(mockPrisma.moderationAction.create).toHaveBeenCalledTimes(2)
    expect(mockWriteAudit).toHaveBeenCalledTimes(2)
  })

  it('should handle bulk mute action with muteDays', async () => {
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
      reporterId: 'user-1',
      reason: 'spam',
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    mockPrisma.moderationReport.findUnique.mockResolvedValue(report as any)
    mockPrisma.moderationReport.update.mockResolvedValue({
      ...report,
      status: 'triaged',
      assignedTo: 'admin-1',
    } as any)

    mockPrisma.moderationAction.create.mockResolvedValue({
      id: 'action-1',
      reportId: 'report-1',
      actorId: 'admin-1',
      type: 'mute',
      reason: 'Bulk mute',
      metadata: { muteDays: 7 },
      createdAt: new Date(),
    } as any)

    const request = new Request('http://localhost/api/admin/moderation/reports/bulk-action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reportIds: ['report-1'],
        action: 'mute',
        reason: 'Bulk mute',
        muteDays: 7,
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(mockPrisma.moderationAction.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: 'mute',
          metadata: { muteDays: 7 },
        }),
      })
    )
  })

  it('should handle escalation to senior moderator in bulk action', async () => {
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
      reporterId: 'user-1',
      reason: 'abuse',
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    mockPrisma.moderationReport.findUnique.mockResolvedValue(report as any)
    mockPrisma.moderationReport.update.mockResolvedValue({
      ...report,
      status: 'triaged',
      assignedTo: 'admin-1',
    } as any)

    mockPrisma.moderationAction.create.mockResolvedValue({
      id: 'action-1',
      reportId: 'report-1',
      actorId: 'admin-1',
      type: 'warn',
      reason: 'Escalated',
      metadata: { escalateToSenior: true },
      createdAt: new Date(),
    } as any)

    const request = new Request('http://localhost/api/admin/moderation/reports/bulk-action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reportIds: ['report-1'],
        action: 'warn',
        reason: 'Escalated',
        escalateToSenior: true,
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(mockPrisma.moderationAction.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          metadata: { escalateToSenior: true },
        }),
      })
    )
  })

  it('should return 400 for empty reportIds', async () => {
    mockGetCurrentUser.mockResolvedValue({
      id: 'admin-1',
      email: 'admin@test.com',
      name: 'Admin User',
      roles: ['Admin'],
    })
    mockHasRole.mockReturnValue(true)

    const request = new Request('http://localhost/api/admin/moderation/reports/bulk-action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reportIds: [],
        action: 'warn',
        reason: 'Test',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('reportIds')
  })

  it('should return 403 for non-admin users', async () => {
    mockGetCurrentUser.mockResolvedValue({
      id: 'user-1',
      email: 'user@test.com',
      name: 'Regular User',
      roles: [],
    })
    mockHasRole.mockReturnValue(false)

    const request = new Request('http://localhost/api/admin/moderation/reports/bulk-action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reportIds: ['report-1'],
        action: 'warn',
        reason: 'Test',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.error).toBe('Forbidden')
  })

  it('should handle partial failures in bulk action', async () => {
    mockGetCurrentUser.mockResolvedValue({
      id: 'admin-1',
      email: 'admin@test.com',
      name: 'Admin User',
      roles: ['Admin'],
    })
    mockHasRole.mockReturnValue(true)

    const report1 = {
      id: 'report-1',
      subjectType: 'post',
      subjectId: 'post-1',
      status: 'open',
      reporterId: 'user-1',
      reason: 'spam',
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    mockPrisma.moderationReport.findUnique
      .mockResolvedValueOnce(report1 as any)
      .mockResolvedValueOnce(null) // Report 2 not found

    mockPrisma.moderationReport.update.mockResolvedValue({
      ...report1,
      status: 'triaged',
      assignedTo: 'admin-1',
    } as any)

    mockPrisma.moderationAction.create.mockResolvedValue({
      id: 'action-1',
      reportId: 'report-1',
      actorId: 'admin-1',
      type: 'warn',
      reason: 'Bulk warning',
      metadata: null,
      createdAt: new Date(),
    } as any)

    const request = new Request('http://localhost/api/admin/moderation/reports/bulk-action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reportIds: ['report-1', 'report-2'],
        action: 'warn',
        reason: 'Bulk warning',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.processed).toBe(2)
    expect(data.success).toBe(1)
    expect(data.failures).toBe(1)
    expect(data.results).toHaveLength(2)
    expect(data.results[0].success).toBe(true)
    expect(data.results[1].success).toBe(false)
  })
})

