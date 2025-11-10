/**
 * Tests for Audit Logging
 */

import { writeAudit } from '@/lib/audit'

// Mock prisma
jest.mock('@/lib/db', () => ({
  prisma: {
    auditLog: {
      create: jest.fn(),
    },
  },
}))

import { prisma } from '@/lib/db'

const mockPrisma = prisma as jest.Mocked<typeof prisma>

describe('Audit Logging', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Suppress console.error in tests
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should write audit log successfully', async () => {
    mockPrisma.auditLog.create.mockResolvedValue({
      id: 'audit-1',
      actorId: 'user-1',
      action: 'create',
      targetType: 'post',
      targetId: 'post-1',
      reason: 'Test reason',
      metadata: null,
      createdAt: new Date(),
    })

    await writeAudit('user-1', 'create', 'post', 'post-1', 'Test reason')

    expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
      data: {
        actorId: 'user-1',
        action: 'create',
        targetType: 'post',
        targetId: 'post-1',
        reason: 'Test reason',
        metadata: undefined,
      },
    })
  })

  it('should write audit log with metadata', async () => {
    const metadata = { key: 'value', count: 5 }

    await writeAudit('user-1', 'update', 'user', 'user-2', 'Updated profile', metadata)

    expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
      data: {
        actorId: 'user-1',
        action: 'update',
        targetType: 'user',
        targetId: 'user-2',
        reason: 'Updated profile',
        metadata: metadata as any,
      },
    })
  })

  it('should handle database errors gracefully', async () => {
    mockPrisma.auditLog.create.mockRejectedValue(new Error('DB error'))

    // Should not throw
    await expect(
      writeAudit('user-1', 'delete', 'post', 'post-1', 'Deleted post')
    ).resolves.not.toThrow()

    expect(console.error).toHaveBeenCalledWith(
      'Audit log failed:',
      expect.any(Error)
    )
  })

  it('should handle missing optional parameters', async () => {
    await writeAudit('user-1', 'view', 'page', 'page-1')

    expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
      data: {
        actorId: 'user-1',
        action: 'view',
        targetType: 'page',
        targetId: 'page-1',
        reason: undefined,
        metadata: undefined,
      },
    })
  })
})

