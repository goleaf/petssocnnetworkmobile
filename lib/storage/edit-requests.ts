/**
 * Edit Request Storage Layer
 * 
 * Provides CRUD operations and query functions for EditRequest model
 * Uses Prisma exclusively for all database operations
 */

import { prisma } from '@/lib/prisma';
import type { EditRequest, Prisma } from '@prisma/client';

/**
 * Input type for creating a new edit request
 */
export interface CreateEditRequestInput {
  contentType: 'blog' | 'wiki' | 'pet' | 'profile';
  contentId: string;
  userId: string;
  changes: Record<string, unknown>;
  reason?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  isCOI?: boolean;
  isFlaggedHealth?: boolean;
  isNewPage?: boolean;
  hasImages?: boolean;
  categories?: string[];
}

/**
 * Input type for updating an edit request
 */
export interface UpdateEditRequestInput {
  status?: 'pending' | 'approved' | 'rejected';
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  reason?: string;
  reviewedBy?: string;
  reviewedAt?: Date;
  isCOI?: boolean;
  isFlaggedHealth?: boolean;
  isNewPage?: boolean;
  hasImages?: boolean;
  categories?: string[];
}

/**
 * Creates a new edit request
 * 
 * @param data - Edit request creation data
 * @returns Created edit request
 * 
 * @example
 * ```typescript
 * const editRequest = await createEditRequest({
 *   contentType: 'blog',
 *   contentId: 'post_123',
 *   userId: 'user_456',
 *   changes: { title: { old: 'Old Title', new: 'New Title' } },
 *   reason: 'Fixed typo in title'
 * });
 * ```
 */
export async function createEditRequest(data: CreateEditRequestInput): Promise<EditRequest> {
  try {
    const editRequest = await prisma.editRequest.create({
      data: {
        contentType: data.contentType,
        contentId: data.contentId,
        userId: data.userId,
        changes: data.changes as Prisma.JsonObject,
        reason: data.reason,
        priority: data.priority ?? 'normal',
        status: 'pending',
        isCOI: data.isCOI ?? false,
        isFlaggedHealth: data.isFlaggedHealth ?? false,
        isNewPage: data.isNewPage ?? false,
        hasImages: data.hasImages ?? false,
        categories: data.categories ?? [],
      },
    });

    return editRequest;
  } catch (error) {
    console.error('Failed to create edit request:', error);
    throw new Error(`Failed to create edit request: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Retrieves an edit request by ID
 * 
 * @param id - Edit request ID
 * @returns Edit request or null if not found
 * 
 * @example
 * ```typescript
 * const editRequest = await getEditRequest('edit_123');
 * if (editRequest) {
 *   console.log('Found edit request:', editRequest.id);
 * }
 * ```
 */
export async function getEditRequest(id: string): Promise<EditRequest | null> {
  try {
    const editRequest = await prisma.editRequest.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        reviewer: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

    return editRequest;
  } catch (error) {
    console.error('Failed to get edit request:', error);
    throw new Error(`Failed to get edit request: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Updates an existing edit request
 * 
 * @param id - Edit request ID
 * @param data - Fields to update
 * @returns Updated edit request
 * 
 * @example
 * ```typescript
 * const updated = await updateEditRequest('edit_123', {
 *   status: 'approved',
 *   reviewedBy: 'moderator_456',
 *   reviewedAt: new Date()
 * });
 * ```
 */
export async function updateEditRequest(
  id: string,
  data: UpdateEditRequestInput
): Promise<EditRequest> {
  try {
    const editRequest = await prisma.editRequest.update({
      where: { id },
      data: {
        ...(data.status && { status: data.status }),
        ...(data.priority && { priority: data.priority }),
        ...(data.reason !== undefined && { reason: data.reason }),
        ...(data.reviewedBy !== undefined && { reviewedBy: data.reviewedBy }),
        ...(data.reviewedAt !== undefined && { reviewedAt: data.reviewedAt }),
        ...(data.isCOI !== undefined && { isCOI: data.isCOI }),
        ...(data.isFlaggedHealth !== undefined && { isFlaggedHealth: data.isFlaggedHealth }),
        ...(data.isNewPage !== undefined && { isNewPage: data.isNewPage }),
        ...(data.hasImages !== undefined && { hasImages: data.hasImages }),
        ...(data.categories !== undefined && { categories: data.categories }),
      },
    });

    return editRequest;
  } catch (error) {
    console.error('Failed to update edit request:', error);
    throw new Error(`Failed to update edit request: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Deletes an edit request
 * 
 * @param id - Edit request ID
 * 
 * @example
 * ```typescript
 * await deleteEditRequest('edit_123');
 * ```
 */
export async function deleteEditRequest(id: string): Promise<void> {
  try {
    await prisma.editRequest.delete({
      where: { id },
    });
  } catch (error) {
    console.error('Failed to delete edit request:', error);
    throw new Error(`Failed to delete edit request: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Pagination parameters
 */
export interface Pagination {
  page?: number;
  limit?: number;
}

/**
 * Filter parameters for querying edit requests
 */
export interface QueueFilters {
  contentType?: string[];
  status?: string[];
  priority?: string[];
  ageInDays?: number;
  categories?: string[];
  userId?: string;
  reviewedBy?: string;
}

/**
 * Paginated result wrapper
 */
export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Lists edit requests with filtering and pagination
 * 
 * @param filters - Filter criteria
 * @param pagination - Pagination parameters
 * @returns Paginated list of edit requests
 * 
 * @example
 * ```typescript
 * const result = await listEditRequests(
 *   { status: ['pending'], contentType: ['blog'] },
 *   { page: 1, limit: 20 }
 * );
 * console.log(`Found ${result.total} edit requests`);
 * ```
 */
export async function listEditRequests(
  filters: QueueFilters = {},
  pagination: Pagination = {}
): Promise<PaginatedResult<EditRequest>> {
  try {
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 50;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.EditRequestWhereInput = {};

    if (filters.contentType && filters.contentType.length > 0) {
      where.contentType = { in: filters.contentType };
    }

    if (filters.status && filters.status.length > 0) {
      where.status = { in: filters.status };
    }

    if (filters.priority && filters.priority.length > 0) {
      where.priority = { in: filters.priority };
    }

    if (filters.userId) {
      where.userId = filters.userId;
    }

    if (filters.reviewedBy) {
      where.reviewedBy = filters.reviewedBy;
    }

    if (filters.ageInDays !== undefined) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - filters.ageInDays);
      where.createdAt = { gte: cutoffDate };
    }

    if (filters.categories && filters.categories.length > 0) {
      where.categories = { hasSome: filters.categories };
    }

    // Execute query with pagination
    const [items, total] = await Promise.all([
      prisma.editRequest.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
            },
          },
          reviewer: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.editRequest.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  } catch (error) {
    console.error('Failed to list edit requests:', error);
    throw new Error(`Failed to list edit requests: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Gets edit requests for specialized queues
 * 
 * @param queueType - Type of queue (new-pages, flagged-health, coi-edits, image-reviews)
 * @param filters - Additional filter criteria
 * @param pagination - Pagination parameters
 * @returns Paginated list of edit requests for the specified queue
 * 
 * @example
 * ```typescript
 * const healthEdits = await getQueueItems('flagged-health', {}, { page: 1, limit: 20 });
 * ```
 */
export async function getQueueItems(
  queueType: 'new-pages' | 'flagged-health' | 'coi-edits' | 'image-reviews',
  filters: QueueFilters = {},
  pagination: Pagination = {}
): Promise<PaginatedResult<EditRequest>> {
  try {
    // Add queue-specific filters
    const queueFilters: QueueFilters = { ...filters };

    switch (queueType) {
      case 'new-pages':
        queueFilters.status = ['pending'];
        break;
      case 'flagged-health':
        queueFilters.status = ['pending'];
        break;
      case 'coi-edits':
        queueFilters.status = ['pending'];
        break;
      case 'image-reviews':
        queueFilters.status = ['pending'];
        break;
    }

    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 50;
    const skip = (page - 1) * limit;

    // Build where clause with queue-specific conditions
    const where: Prisma.EditRequestWhereInput = {};

    if (queueFilters.contentType && queueFilters.contentType.length > 0) {
      where.contentType = { in: queueFilters.contentType };
    }

    if (queueFilters.status && queueFilters.status.length > 0) {
      where.status = { in: queueFilters.status };
    }

    if (queueFilters.priority && queueFilters.priority.length > 0) {
      where.priority = { in: queueFilters.priority };
    }

    // Add queue-specific metadata filters
    switch (queueType) {
      case 'new-pages':
        where.isNewPage = true;
        break;
      case 'flagged-health':
        where.isFlaggedHealth = true;
        break;
      case 'coi-edits':
        where.isCOI = true;
        break;
      case 'image-reviews':
        where.hasImages = true;
        break;
    }

    if (queueFilters.ageInDays !== undefined) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - queueFilters.ageInDays);
      where.createdAt = { gte: cutoffDate };
    }

    if (queueFilters.categories && queueFilters.categories.length > 0) {
      where.categories = { hasSome: queueFilters.categories };
    }

    // Execute query
    const [items, total] = await Promise.all([
      prisma.editRequest.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
            },
          },
          reviewer: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'desc' },
        ],
        skip,
        take: limit,
      }),
      prisma.editRequest.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  } catch (error) {
    console.error('Failed to get queue items:', error);
    throw new Error(`Failed to get queue items: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Gets recent changes feed with filtering
 * 
 * @param filters - Filter criteria
 * @param pagination - Pagination parameters
 * @returns Paginated list of recent edit requests
 * 
 * @example
 * ```typescript
 * const recentChanges = await getRecentChanges(
 *   { ageInDays: 7, status: ['pending', 'approved'] },
 *   { page: 1, limit: 50 }
 * );
 * ```
 */
export async function getRecentChanges(
  filters: QueueFilters = {},
  pagination: Pagination = {}
): Promise<PaginatedResult<EditRequest>> {
  try {
    // Default to last 30 days if no age filter specified
    const filtersWithAge = {
      ...filters,
      ageInDays: filters.ageInDays ?? 30,
    };

    return await listEditRequests(filtersWithAge, pagination);
  } catch (error) {
    console.error('Failed to get recent changes:', error);
    throw new Error(`Failed to get recent changes: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Approves an edit request and applies changes to content
 * 
 * This function:
 * 1. Updates the edit request status to 'approved'
 * 2. Applies the changes to the actual content
 * 3. Logs the action to the audit trail
 * 4. Sends notification to the user
 * 
 * All operations are performed in a transaction to ensure consistency.
 * 
 * @param id - Edit request ID
 * @param reviewerId - ID of the moderator approving the request
 * @returns Approved edit request
 * 
 * @example
 * ```typescript
 * const approved = await approveEditRequest('edit_123', 'moderator_456');
 * console.log('Edit request approved:', approved.id);
 * ```
 */
export async function approveEditRequest(
  id: string,
  reviewerId: string
): Promise<EditRequest> {
  try {
    // Use transaction to ensure all operations succeed or fail together
    const result = await prisma.$transaction(async (tx) => {
      // 1. Get the edit request
      const editRequest = await tx.editRequest.findUnique({
        where: { id },
      });

      if (!editRequest) {
        throw new Error(`Edit request ${id} not found`);
      }

      if (editRequest.status !== 'pending') {
        throw new Error(`Edit request ${id} is not pending (status: ${editRequest.status})`);
      }

      // 2. Update edit request status
      const updatedRequest = await tx.editRequest.update({
        where: { id },
        data: {
          status: 'approved',
          reviewedBy: reviewerId,
          reviewedAt: new Date(),
        },
      });

      // 3. Apply changes to actual content based on content type
      await applyContentChanges(tx, editRequest);

      // 4. Log to audit trail
      await tx.auditLog.create({
        data: {
          actorId: reviewerId,
          action: 'approve_edit',
          targetType: 'edit_request',
          targetId: id,
          reason: 'Edit request approved',
          metadata: {
            contentType: editRequest.contentType,
            contentId: editRequest.contentId,
            userId: editRequest.userId,
            changes: editRequest.changes,
          },
        },
      });

      return updatedRequest;
    });

    // 5. Send notification to user (outside transaction to avoid blocking)
    try {
      await sendApprovalNotification(result);
    } catch (notificationError) {
      console.error('Failed to send approval notification:', notificationError);
      // Don't fail the entire operation if notification fails
    }

    return result;
  } catch (error) {
    console.error('Failed to approve edit request:', error);
    throw new Error(`Failed to approve edit request: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Rejects an edit request
 * 
 * This function:
 * 1. Updates the edit request status to 'rejected'
 * 2. Logs the action to the audit trail
 * 3. Sends notification to the user with rejection reason
 * 
 * All operations are performed in a transaction to ensure consistency.
 * 
 * @param id - Edit request ID
 * @param reviewerId - ID of the moderator rejecting the request
 * @param reason - Reason for rejection
 * @returns Rejected edit request
 * 
 * @example
 * ```typescript
 * const rejected = await rejectEditRequest(
 *   'edit_123',
 *   'moderator_456',
 *   'Content does not meet quality guidelines'
 * );
 * ```
 */
export async function rejectEditRequest(
  id: string,
  reviewerId: string,
  reason: string
): Promise<EditRequest> {
  try {
    // Use transaction to ensure all operations succeed or fail together
    const result = await prisma.$transaction(async (tx) => {
      // 1. Get the edit request
      const editRequest = await tx.editRequest.findUnique({
        where: { id },
      });

      if (!editRequest) {
        throw new Error(`Edit request ${id} not found`);
      }

      if (editRequest.status !== 'pending') {
        throw new Error(`Edit request ${id} is not pending (status: ${editRequest.status})`);
      }

      // 2. Update edit request status
      const updatedRequest = await tx.editRequest.update({
        where: { id },
        data: {
          status: 'rejected',
          reviewedBy: reviewerId,
          reviewedAt: new Date(),
          reason,
        },
      });

      // 3. Log to audit trail
      await tx.auditLog.create({
        data: {
          actorId: reviewerId,
          action: 'reject_edit',
          targetType: 'edit_request',
          targetId: id,
          reason,
          metadata: {
            contentType: editRequest.contentType,
            contentId: editRequest.contentId,
            userId: editRequest.userId,
          },
        },
      });

      return updatedRequest;
    });

    // 4. Send notification to user (outside transaction to avoid blocking)
    try {
      await sendRejectionNotification(result, reason);
    } catch (notificationError) {
      console.error('Failed to send rejection notification:', notificationError);
      // Don't fail the entire operation if notification fails
    }

    return result;
  } catch (error) {
    console.error('Failed to reject edit request:', error);
    throw new Error(`Failed to reject edit request: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Applies content changes based on edit request
 * 
 * @param tx - Prisma transaction client
 * @param editRequest - Edit request containing changes to apply
 */
async function applyContentChanges(
  tx: Prisma.TransactionClient,
  editRequest: EditRequest
): Promise<void> {
  const changes = editRequest.changes as Record<string, unknown>;

  switch (editRequest.contentType) {
    case 'blog':
      await applyBlogChanges(tx, editRequest.contentId, changes);
      break;
    case 'wiki':
      await applyWikiChanges(tx, editRequest.contentId, changes);
      break;
    case 'pet':
      await applyPetChanges(tx, editRequest.contentId, changes);
      break;
    case 'profile':
      await applyProfileChanges(tx, editRequest.contentId, changes);
      break;
    default:
      throw new Error(`Unknown content type: ${editRequest.contentType}`);
  }
}

/**
 * Applies changes to blog post
 */
async function applyBlogChanges(
  tx: Prisma.TransactionClient,
  contentId: string,
  changes: Record<string, unknown>
): Promise<void> {
  const updateData: Prisma.BlogPostUpdateInput = {};

  if (changes.title) {
    updateData.title = String(changes.title);
  }
  if (changes.content) {
    updateData.content = String(changes.content);
  }
  if (changes.coverImage !== undefined) {
    updateData.coverImage = changes.coverImage ? String(changes.coverImage) : null;
  }
  if (changes.tags && Array.isArray(changes.tags)) {
    updateData.tags = changes.tags.map(String);
  }
  if (changes.categories && Array.isArray(changes.categories)) {
    updateData.categories = changes.categories.map(String);
  }

  await tx.blogPost.update({
    where: { id: contentId },
    data: updateData,
  });
}

/**
 * Applies changes to wiki article
 */
async function applyWikiChanges(
  tx: Prisma.TransactionClient,
  contentId: string,
  changes: Record<string, unknown>
): Promise<void> {
  const updateData: Prisma.ArticleUpdateInput = {};

  if (changes.title) {
    updateData.title = String(changes.title);
  }
  if (changes.status) {
    updateData.status = String(changes.status);
  }

  await tx.article.update({
    where: { id: contentId },
    data: updateData,
  });
}

/**
 * Applies changes to pet profile
 */
async function applyPetChanges(
  tx: Prisma.TransactionClient,
  contentId: string,
  changes: Record<string, unknown>
): Promise<void> {
  const updateData: Prisma.PetUpdateInput = {};

  if (changes.name) {
    updateData.name = String(changes.name);
  }
  if (changes.bio !== undefined) {
    updateData.bio = changes.bio ? String(changes.bio) : null;
  }
  if (changes.breed !== undefined) {
    updateData.breed = changes.breed ? String(changes.breed) : null;
  }
  if (changes.birthday !== undefined) {
    updateData.birthday = changes.birthday ? String(changes.birthday) : null;
  }
  if (changes.weight !== undefined) {
    updateData.weight = changes.weight ? String(changes.weight) : null;
  }

  await tx.pet.update({
    where: { id: contentId },
    data: updateData,
  });
}

/**
 * Applies changes to user profile
 */
async function applyProfileChanges(
  tx: Prisma.TransactionClient,
  contentId: string,
  changes: Record<string, unknown>
): Promise<void> {
  const updateData: Prisma.UserUpdateInput = {};

  if (changes.displayName !== undefined) {
    updateData.displayName = changes.displayName ? String(changes.displayName) : null;
  }
  if (changes.bio !== undefined) {
    updateData.bio = changes.bio ? String(changes.bio) : null;
  }
  if (changes.avatarUrl !== undefined) {
    updateData.avatarUrl = changes.avatarUrl ? String(changes.avatarUrl) : null;
  }

  await tx.user.update({
    where: { id: contentId },
    data: updateData,
  });
}

/**
 * Sends approval notification to user
 */
async function sendApprovalNotification(editRequest: EditRequest): Promise<void> {
  // Import notification function dynamically to avoid circular dependencies
  const { createNotification } = await import('@/lib/notifications');

  createNotification({
    userId: editRequest.userId,
    type: 'post',
    message: `Your edit to ${editRequest.contentType} has been approved`,
    priority: 'normal',
    category: 'system',
    metadata: {
      editRequestId: editRequest.id,
      contentType: editRequest.contentType,
      contentId: editRequest.contentId,
    },
  });
}

/**
 * Sends rejection notification to user
 */
async function sendRejectionNotification(
  editRequest: EditRequest,
  reason: string
): Promise<void> {
  // Import notification function dynamically to avoid circular dependencies
  const { createNotification } = await import('@/lib/notifications');

  createNotification({
    userId: editRequest.userId,
    type: 'post',
    message: `Your edit to ${editRequest.contentType} was not approved: ${reason}`,
    priority: 'normal',
    category: 'system',
    metadata: {
      editRequestId: editRequest.id,
      contentType: editRequest.contentType,
      contentId: editRequest.contentId,
      rejectionReason: reason,
    },
  });
}
