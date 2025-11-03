import {
  writeAudit,
  processAuditQueue,
  getAuditLogsByActor,
  getAuditLogsByTarget,
  getAuditLogsByAction,
  getAuditQueueEntries,
  searchAuditLogs,
} from '../audit';
import { prisma } from '../prisma';

// Mock Prisma client
jest.mock('../prisma', () => ({
  prisma: {
    auditLog: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    auditQueue: {
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
  },
}));

const mockedPrisma = prisma as jest.Mocked<typeof prisma>;

describe('Audit Log System', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('writeAudit', () => {
    it('should successfully write audit log when database is available', async () => {
      const mockLog = {
        id: 'log_123',
        actorId: 'user_1',
        action: 'approve',
        targetType: 'blog_post',
        targetId: 'post_1',
        reason: 'Content verified',
        metadata: { verified: true },
        createdAt: new Date(),
      };

      mockedPrisma.auditLog.create.mockResolvedValue(mockLog);

      const result = await writeAudit({
        actorId: 'user_1',
        action: 'approve',
        targetType: 'blog_post',
        targetId: 'post_1',
        reason: 'Content verified',
        metadata: { verified: true },
      });

      expect(result.success).toBe(true);
      expect(result.logId).toBe('log_123');
      expect(result.queued).toBe(false);
      expect(mockedPrisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          actorId: 'user_1',
          action: 'approve',
          targetType: 'blog_post',
          targetId: 'post_1',
          reason: 'Content verified',
          metadata: { verified: true },
        },
      });
    });

    it('should queue audit log when direct write fails but queue succeeds', async () => {
      const mockQueueEntry = {
        id: 'queue_123',
        actorId: 'user_1',
        action: 'delete',
        targetType: 'blog_post',
        targetId: 'post_1',
        reason: 'Violates guidelines',
        metadata: { automated: false },
        createdAt: new Date(),
        attempts: 0,
        lastAttempt: null,
      };

      mockedPrisma.auditLog.create.mockRejectedValue(new Error('Database connection failed'));
      mockedPrisma.auditQueue.create.mockResolvedValue(mockQueueEntry);

      const result = await writeAudit({
        actorId: 'user_1',
        action: 'delete',
        targetType: 'blog_post',
        targetId: 'post_1',
        reason: 'Violates guidelines',
        metadata: { automated: false },
      });

      expect(result.success).toBe(true);
      expect(result.logId).toBe('queue_123');
      expect(result.queued).toBe(true);
      expect(mockedPrisma.auditLog.create).toHaveBeenCalled();
      expect(mockedPrisma.auditQueue.create).toHaveBeenCalled();
    });

    it('should return error when both write and queue fail', async () => {
      mockedPrisma.auditLog.create.mockRejectedValue(new Error('Database connection failed'));
      mockedPrisma.auditQueue.create.mockRejectedValue(new Error('Queue service unavailable'));

      const result = await writeAudit({
        actorId: 'user_1',
        action: 'create',
        targetType: 'article',
        targetId: 'article_1',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Both audit log and queue failed');
    });

    it('should handle optional parameters correctly', async () => {
      const mockLog = {
        id: 'log_456',
        actorId: 'user_2',
        action: 'update',
        targetType: 'place',
        targetId: 'place_1',
        reason: null,
        metadata: null,
        createdAt: new Date(),
      };

      mockedPrisma.auditLog.create.mockResolvedValue(mockLog);

      const result = await writeAudit({
        actorId: 'user_2',
        action: 'update',
        targetType: 'place',
        targetId: 'place_1',
      });

      expect(result.success).toBe(true);
      expect(mockedPrisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          actorId: 'user_2',
          action: 'update',
          targetType: 'place',
          targetId: 'place_1',
          reason: null,
          metadata: null,
        },
      });
    });
  });

  describe('processAuditQueue', () => {
    it('should successfully process queued entries', async () => {
      const mockQueuedEntries = [
        {
          id: 'queue_1',
          actorId: 'user_1',
          action: 'approve',
          targetType: 'blog_post',
          targetId: 'post_1',
          reason: 'Verified',
          metadata: { test: true },
          createdAt: new Date('2024-01-01'),
          attempts: 0,
          lastAttempt: null,
        },
        {
          id: 'queue_2',
          actorId: 'user_2',
          action: 'reject',
          targetType: 'article',
          targetId: 'article_1',
          reason: 'Invalid content',
          metadata: { flagged: true },
          createdAt: new Date('2024-01-02'),
          attempts: 0,
          lastAttempt: null,
        },
      ];

      mockedPrisma.auditQueue.findMany.mockResolvedValue(mockQueuedEntries);
      mockedPrisma.auditLog.create.mockResolvedValue({ id: 'log_123' } as any);
      mockedPrisma.auditQueue.delete.mockResolvedValue({} as any);
      mockedPrisma.auditQueue.deleteMany.mockResolvedValue({ count: 0 });

      const processedCount = await processAuditQueue();

      expect(processedCount).toBe(2);
      expect(mockedPrisma.auditLog.create).toHaveBeenCalledTimes(2);
      expect(mockedPrisma.auditQueue.delete).toHaveBeenCalledTimes(2);
    });

    it('should increment attempts on failed processing', async () => {
      const mockQueuedEntry = {
        id: 'queue_1',
        actorId: 'user_1',
        action: 'delete',
        targetType: 'blog_post',
        targetId: 'post_1',
        reason: 'Spam',
        metadata: null,
        createdAt: new Date('2024-01-01'),
        attempts: 0,
        lastAttempt: null,
      };

      mockedPrisma.auditQueue.findMany.mockResolvedValue([mockQueuedEntry]);
      mockedPrisma.auditLog.create.mockRejectedValue(new Error('Still failed'));
      mockedPrisma.auditQueue.update.mockResolvedValue({} as any);

      const processedCount = await processAuditQueue();

      expect(processedCount).toBe(0);
      expect(mockedPrisma.auditQueue.update).toHaveBeenCalledWith({
        where: { id: 'queue_1' },
        data: {
          attempts: 1,
          lastAttempt: expect.any(Date),
        },
      });
    });

    it('should delete entries that exceeded max attempts', async () => {
      mockedPrisma.auditQueue.findMany.mockResolvedValue([]);
      mockedPrisma.auditQueue.deleteMany.mockResolvedValue({ count: 5 });

      await processAuditQueue();

      expect(mockedPrisma.auditQueue.deleteMany).toHaveBeenCalledWith({
        where: {
          attempts: {
            gte: 5,
          },
        },
      });
    });
  });

  describe('getAuditLogsByActor', () => {
    it('should retrieve audit logs for a specific actor', async () => {
      const mockLogs = [
        { id: 'log_1', actorId: 'user_1', action: 'approve', createdAt: new Date() },
        { id: 'log_2', actorId: 'user_1', action: 'delete', createdAt: new Date() },
      ];

      mockedPrisma.auditLog.findMany.mockResolvedValue(mockLogs);

      const result = await getAuditLogsByActor('user_1', 100);

      expect(result).toHaveLength(2);
      expect(mockedPrisma.auditLog.findMany).toHaveBeenCalledWith({
        where: { actorId: 'user_1' },
        orderBy: { createdAt: 'desc' },
        take: 100,
      });
    });

    it('should return empty array on error', async () => {
      mockedPrisma.auditLog.findMany.mockRejectedValue(new Error('Database error'));

      const result = await getAuditLogsByActor('user_1');

      expect(result).toEqual([]);
    });
  });

  describe('getAuditLogsByTarget', () => {
    it('should retrieve audit logs for a specific target', async () => {
      const mockLogs = [
        { id: 'log_1', targetType: 'blog_post', targetId: 'post_1', createdAt: new Date() },
      ];

      mockedPrisma.auditLog.findMany.mockResolvedValue(mockLogs);

      const result = await getAuditLogsByTarget('blog_post', 'post_1');

      expect(result).toHaveLength(1);
      expect(mockedPrisma.auditLog.findMany).toHaveBeenCalledWith({
        where: { targetType: 'blog_post', targetId: 'post_1' },
        orderBy: { createdAt: 'desc' },
        take: 100,
      });
    });
  });

  describe('getAuditLogsByAction', () => {
    it('should retrieve audit logs for a specific action', async () => {
      const mockLogs = [
        { id: 'log_1', action: 'approve', createdAt: new Date() },
        { id: 'log_2', action: 'approve', createdAt: new Date() },
      ];

      mockedPrisma.auditLog.findMany.mockResolvedValue(mockLogs);

      const result = await getAuditLogsByAction('approve');

      expect(result).toHaveLength(2);
      expect(mockedPrisma.auditLog.findMany).toHaveBeenCalledWith({
        where: { action: 'approve' },
        orderBy: { createdAt: 'desc' },
        take: 100,
      });
    });
  });

  describe('getAuditQueueEntries', () => {
    it('should retrieve all queued entries', async () => {
      const mockQueueEntries = [
        { id: 'queue_1', createdAt: new Date() },
        { id: 'queue_2', createdAt: new Date() },
      ];

      mockedPrisma.auditQueue.findMany.mockResolvedValue(mockQueueEntries);

      const result = await getAuditQueueEntries();

      expect(result).toHaveLength(2);
      expect(mockedPrisma.auditQueue.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'asc' },
      });
    });
  });

  describe('searchAuditLogs', () => {
    it('should search with all filters', async () => {
      const mockLogs = [{ id: 'log_1', createdAt: new Date() }];

      mockedPrisma.auditLog.findMany.mockResolvedValue(mockLogs);

      const filters = {
        actorId: 'user_1',
        action: 'delete',
        targetType: 'blog_post',
        targetId: 'post_1',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
      };

      await searchAuditLogs(filters);

      expect(mockedPrisma.auditLog.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          actorId: 'user_1',
          action: 'delete',
          targetType: 'blog_post',
          targetId: 'post_1',
          createdAt: {
            gte: filters.startDate,
            lte: filters.endDate,
          },
        }),
        orderBy: { createdAt: 'desc' },
        take: 100,
      });
    });

    it('should search with partial filters', async () => {
      mockedPrisma.auditLog.findMany.mockResolvedValue([]);

      await searchAuditLogs({ actorId: 'user_1' });

      expect(mockedPrisma.auditLog.findMany).toHaveBeenCalledWith({
        where: { actorId: 'user_1' },
        orderBy: { createdAt: 'desc' },
        take: 100,
      });
    });
  });
});

