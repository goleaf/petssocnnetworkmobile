import { prisma } from './prisma';

/**
 * Interface for audit log entry parameters
 */
export interface AuditLogParams {
  /** User/admin ID who performed the action */
  actorId: string;
  /** Action type (e.g., "create", "update", "delete", "approve", "reject", etc.) */
  action: string;
  /** Type of entity affected (e.g., "blog_post", "article", "user", "place", etc.) */
  targetType: string;
  /** ID of the affected entity */
  targetId: string;
  /** Optional reason for the action */
  reason?: string;
  /** Additional context and details as JSON */
  metadata?: Record<string, unknown>;
}

/**
 * Type for audit log result
 */
export interface AuditLogResult {
  success: boolean;
  logId?: string;
  error?: string;
  queued?: boolean;
}

/**
 * Maximum number of retry attempts before giving up on queued entries
 */
const MAX_QUEUE_ATTEMPTS = 5;

/**
 * Writes an audit log entry with automatic fallback to queue on failure
 * 
 * This function provides a resilient audit logging mechanism that:
 * 1. Attempts to write directly to the audit_logs table
 * 2. Falls back to audit_queue if database write fails
 * 3. Automatically retries queued entries when database is available
 * 
 * @param params - Audit log parameters
 * @returns Result indicating success, queued status, or error
 * 
 * @example
 * ```typescript
 * await writeAudit({
 *   actorId: 'user_123',
 *   action: 'approve',
 *   targetType: 'blog_post',
 *   targetId: 'post_456',
 *   reason: 'Verified content meets guidelines',
 *   metadata: { autoApproved: false }
 * });
 * ```
 */
export async function writeAudit(params: AuditLogParams): Promise<AuditLogResult> {
  const { actorId, action, targetType, targetId, reason, metadata } = params;

  // Try to write directly to audit_logs
  try {
    const auditLog = await prisma.auditLog.create({
      data: {
        actorId,
        action,
        targetType,
        targetId,
        reason: reason || null,
        metadata: metadata || null,
      },
    });

    // Successfully written to audit log
    return {
      success: true,
      logId: auditLog.id,
      queued: false,
    };
  } catch (error) {
    // Database write failed, attempt to queue
    console.error('Failed to write audit log directly:', error);
    
    try {
      const queuedEntry = await prisma.auditQueue.create({
        data: {
          actorId,
          action,
          targetType,
          targetId,
          reason: reason || null,
          metadata: metadata || null,
        },
      });

      // Successfully queued for later processing
      console.warn(`Audit log queued: ${queuedEntry.id}`);
      return {
        success: true,
        logId: queuedEntry.id,
        queued: true,
      };
    } catch (queueError) {
      // Even queuing failed - complete outage
      console.error('Failed to queue audit log:', queueError);
      return {
        success: false,
        error: `Both audit log and queue failed: ${queueError instanceof Error ? queueError.message : 'Unknown error'}`,
      };
    }
  }
}

/**
 * Processes queued audit entries
 * 
 * Attempts to flush queued audit entries to the main audit log.
 * Should be called periodically (e.g., via cron job or background worker).
 * 
 * @returns Number of entries successfully processed
 */
export async function processAuditQueue(): Promise<number> {
  try {
    // Get all queued entries that haven't exceeded max attempts
    const queuedEntries = await prisma.auditQueue.findMany({
      where: {
        attempts: {
          lt: MAX_QUEUE_ATTEMPTS,
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    let processedCount = 0;

    for (const entry of queuedEntries) {
      try {
        // Attempt to write to main audit log
        await prisma.auditLog.create({
          data: {
            actorId: entry.actorId,
            action: entry.action,
            targetType: entry.targetType,
            targetId: entry.targetId,
            reason: entry.reason,
            metadata: entry.metadata,
            createdAt: entry.createdAt, // Preserve original timestamp
          },
        });

        // Success - delete from queue
        await prisma.auditQueue.delete({
          where: { id: entry.id },
        });

        processedCount++;
      } catch (error) {
        // Failed to write - increment attempts
        await prisma.auditQueue.update({
          where: { id: entry.id },
          data: {
            attempts: entry.attempts + 1,
            lastAttempt: new Date(),
          },
        });

        console.error(`Failed to process queued audit entry ${entry.id}:`, error);
      }
    }

    // Clean up entries that have exceeded max attempts
    const deletedEntries = await prisma.auditQueue.deleteMany({
      where: {
        attempts: {
          gte: MAX_QUEUE_ATTEMPTS,
        },
      },
    });

    if (deletedEntries.count > 0) {
      console.warn(`Deleted ${deletedEntries.count} queued audit entries that exceeded max attempts`);
    }

    return processedCount;
  } catch (error) {
    console.error('Failed to process audit queue:', error);
    return 0;
  }
}

/**
 * Gets audit logs for a specific actor (user/admin)
 * 
 * @param actorId - ID of the actor
 * @param limit - Maximum number of entries to return (default: 100)
 * @returns Array of audit log entries
 */
export async function getAuditLogsByActor(
  actorId: string,
  limit: number = 100
): Promise<unknown[]> {
  try {
    return await prisma.auditLog.findMany({
      where: { actorId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  } catch (error) {
    console.error('Failed to get audit logs by actor:', error);
    return [];
  }
}

/**
 * Gets audit logs for a specific target (entity)
 * 
 * @param targetType - Type of entity
 * @param targetId - ID of the entity
 * @param limit - Maximum number of entries to return (default: 100)
 * @returns Array of audit log entries
 */
export async function getAuditLogsByTarget(
  targetType: string,
  targetId: string,
  limit: number = 100
): Promise<unknown[]> {
  try {
    return await prisma.auditLog.findMany({
      where: { targetType, targetId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  } catch (error) {
    console.error('Failed to get audit logs by target:', error);
    return [];
  }
}

/**
 * Gets audit logs by action type
 * 
 * @param action - Action type
 * @param limit - Maximum number of entries to return (default: 100)
 * @returns Array of audit log entries
 */
export async function getAuditLogsByAction(
  action: string,
  limit: number = 100
): Promise<unknown[]> {
  try {
    return await prisma.auditLog.findMany({
      where: { action },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  } catch (error) {
    console.error('Failed to get audit logs by action:', error);
    return [];
  }
}

/**
 * Gets all pending queue entries
 * 
 * @returns Array of queued audit entries
 */
export async function getAuditQueueEntries(): Promise<unknown[]> {
  try {
    return await prisma.auditQueue.findMany({
      orderBy: { createdAt: 'asc' },
    });
  } catch (error) {
    console.error('Failed to get audit queue entries:', error);
    return [];
  }
}

/**
 * Searches audit logs with multiple filters
 * 
 * @param filters - Filter criteria
 * @param limit - Maximum number of entries to return (default: 100)
 * @returns Array of audit log entries
 */
export interface AuditLogFilters {
  actorId?: string;
  action?: string;
  targetType?: string;
  targetId?: string;
  startDate?: Date;
  endDate?: Date;
}

export async function searchAuditLogs(
  filters: AuditLogFilters,
  limit: number = 100
): Promise<unknown[]> {
  try {
    const where: Record<string, unknown> = {};

    if (filters.actorId) where.actorId = filters.actorId;
    if (filters.action) where.action = filters.action;
    if (filters.targetType) where.targetType = filters.targetType;
    if (filters.targetId) where.targetId = filters.targetId;
    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = filters.startDate;
      if (filters.endDate) where.createdAt.lte = filters.endDate;
    }

    return await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  } catch (error) {
    console.error('Failed to search audit logs:', error);
    return [];
  }
}
