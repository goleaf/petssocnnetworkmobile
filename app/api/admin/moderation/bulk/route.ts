import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getCurrentUser, isModerator } from "@/lib/auth-server"
import { prisma } from "@/lib/prisma"
import { writeAudit } from "@/lib/audit"

/**
 * Validation schema for bulk revert operation
 */
const bulkRevertSchema = z.object({
  operation: z.literal("revert"),
  editRequestIds: z.array(z.string()).min(1, "At least one edit request ID is required").max(1000, "Maximum 1000 items per bulk operation"),
  reason: z.string().min(1, "Reason is required for bulk operations"),
})

/**
 * Validation schema for range block operation
 */
const rangeBlockSchema = z.object({
  operation: z.literal("range-block"),
  userIds: z.array(z.string()).min(1, "At least one user ID is required").max(1000, "Maximum 1000 items per bulk operation"),
  reason: z.string().min(1, "Reason is required for bulk operations"),
  duration: z.number().min(1).max(365).optional(), // Duration in days, optional (permanent if not specified)
})

/**
 * Union schema for all bulk operations
 */
const bulkOperationSchema = z.discriminatedUnion("operation", [
  bulkRevertSchema,
  rangeBlockSchema,
])

/**
 * Result for a single item in bulk operation
 */
interface BulkOperationItemResult {
  id: string
  success: boolean
  error?: string
}

/**
 * Overall result for bulk operation
 */
interface BulkOperationResult {
  operation: string
  totalItems: number
  successCount: number
  failureCount: number
  results: BulkOperationItemResult[]
  duration: number // milliseconds
}

/**
 * Batch size for processing bulk operations
 */
const BATCH_SIZE = 100

/**
 * POST /api/admin/moderation/bulk
 * Performs bulk operations on edit requests or users
 * 
 * Requires moderator role
 * 
 * Supported operations:
 * - revert: Reject multiple edit requests at once
 * - range-block: Block multiple users during abuse waves
 * 
 * Operations are processed in batches of 100 items
 * All operations are logged to audit trail
 * 
 * @param request - Next.js request object
 * @returns Operation results with success/failure counts
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    // 1. Check authentication and moderator permission
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json(
        { error: "Unauthorized. Authentication required.", code: "UNAUTHORIZED" },
        { status: 401 }
      )
    }

    const hasModeratorRole = await isModerator()
    if (!hasModeratorRole) {
      return NextResponse.json(
        { error: "Forbidden. Moderator access required.", code: "FORBIDDEN" },
        { status: 403 }
      )
    }

    // 2. Validate request body
    const body = await request.json()
    const validation = bulkOperationSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { 
          error: "Invalid request data", 
          code: "VALIDATION_ERROR",
          details: validation.error.errors 
        },
        { status: 400 }
      )
    }

    const data = validation.data

    // 3. Execute appropriate bulk operation
    let result: BulkOperationResult

    if (data.operation === "revert") {
      result = await executeBulkRevert(
        data.editRequestIds,
        data.reason,
        currentUser.id
      )
    } else if (data.operation === "range-block") {
      result = await executeBulkRangeBlock(
        data.userIds,
        data.reason,
        currentUser.id,
        data.duration
      )
    } else {
      return NextResponse.json(
        { error: "Unknown operation type", code: "VALIDATION_ERROR" },
        { status: 400 }
      )
    }

    // 4. Calculate duration
    result.duration = Date.now() - startTime

    // 5. Log bulk operation to audit trail
    await writeAudit({
      actorId: currentUser.id,
      action: `bulk_${data.operation}`,
      targetType: "bulk_operation",
      targetId: `bulk_${Date.now()}`,
      reason: data.reason,
      metadata: {
        operation: data.operation,
        totalItems: result.totalItems,
        successCount: result.successCount,
        failureCount: result.failureCount,
        duration: result.duration,
      },
    })

    // 6. Return success response
    return NextResponse.json(
      {
        success: true,
        message: `Bulk ${data.operation} completed`,
        result,
      },
      { 
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        }
      }
    )
  } catch (error) {
    console.error("Error executing bulk operation:", error)
    
    return NextResponse.json(
      { 
        error: "Internal server error", 
        code: "INTERNAL_ERROR",
        message: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    )
  }
}

/**
 * Executes bulk revert operation
 * Rejects multiple edit requests at once
 * 
 * @param editRequestIds - Array of edit request IDs to revert
 * @param reason - Reason for bulk revert
 * @param moderatorId - ID of moderator performing the operation
 * @returns Operation result with success/failure counts
 */
async function executeBulkRevert(
  editRequestIds: string[],
  reason: string,
  moderatorId: string
): Promise<BulkOperationResult> {
  const results: BulkOperationItemResult[] = []
  let successCount = 0
  let failureCount = 0

  // Process in batches to avoid overwhelming the database
  for (let i = 0; i < editRequestIds.length; i += BATCH_SIZE) {
    const batch = editRequestIds.slice(i, i + BATCH_SIZE)

    // Process each item in the batch
    for (const editRequestId of batch) {
      try {
        // Use transaction to ensure consistency
        await prisma.$transaction(async (tx) => {
          // 1. Get the edit request
          const editRequest = await tx.editRequest.findUnique({
            where: { id: editRequestId },
          })

          if (!editRequest) {
            throw new Error(`Edit request ${editRequestId} not found`)
          }

          if (editRequest.status !== "pending") {
            throw new Error(`Edit request ${editRequestId} is not pending (status: ${editRequest.status})`)
          }

          // 2. Update edit request status to rejected
          await tx.editRequest.update({
            where: { id: editRequestId },
            data: {
              status: "rejected",
              reviewedBy: moderatorId,
              reviewedAt: new Date(),
              reason,
            },
          })

          // 3. Log to audit trail
          await tx.auditLog.create({
            data: {
              actorId: moderatorId,
              action: "bulk_revert_edit",
              targetType: "edit_request",
              targetId: editRequestId,
              reason,
              metadata: {
                contentType: editRequest.contentType,
                contentId: editRequest.contentId,
                userId: editRequest.userId,
              },
            },
          })
        })

        results.push({
          id: editRequestId,
          success: true,
        })
        successCount++
      } catch (error) {
        results.push({
          id: editRequestId,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        })
        failureCount++
        console.error(`Failed to revert edit request ${editRequestId}:`, error)
      }
    }
  }

  return {
    operation: "revert",
    totalItems: editRequestIds.length,
    successCount,
    failureCount,
    results,
    duration: 0, // Will be set by caller
  }
}

/**
 * Executes bulk range block operation
 * Blocks multiple users during abuse waves by invalidating their sessions
 * and scheduling account deletion
 * 
 * @param userIds - Array of user IDs to block
 * @param reason - Reason for bulk block
 * @param moderatorId - ID of moderator performing the operation
 * @param duration - Optional duration in days (if specified, schedules deletion; otherwise immediate suspension)
 * @returns Operation result with success/failure counts
 */
async function executeBulkRangeBlock(
  userIds: string[],
  reason: string,
  moderatorId: string,
  duration?: number
): Promise<BulkOperationResult> {
  const results: BulkOperationItemResult[] = []
  let successCount = 0
  let failureCount = 0

  // Calculate deletion scheduled date if duration is specified
  const deletionScheduledAt = duration 
    ? new Date(Date.now() + duration * 24 * 60 * 60 * 1000)
    : new Date() // Immediate suspension

  // Process in batches to avoid overwhelming the database
  for (let i = 0; i < userIds.length; i += BATCH_SIZE) {
    const batch = userIds.slice(i, i + BATCH_SIZE)

    // Process each item in the batch
    for (const userId of batch) {
      try {
        // Use transaction to ensure consistency
        await prisma.$transaction(async (tx) => {
          // 1. Verify user exists
          const user = await tx.user.findUnique({
            where: { id: userId },
          })

          if (!user) {
            throw new Error(`User ${userId} not found`)
          }

          // 2. Suspend user by invalidating sessions and scheduling deletion
          await tx.user.update({
            where: { id: userId },
            data: {
              sessionInvalidatedAt: new Date(),
              deletionScheduledAt,
              deletionReason: reason,
            },
          })

          // 3. Revoke all active sessions
          await tx.session.updateMany({
            where: { 
              userId,
              revoked: false,
            },
            data: {
              revoked: true,
            },
          })

          // 4. Log to audit trail
          await tx.auditLog.create({
            data: {
              actorId: moderatorId,
              action: "bulk_range_block",
              targetType: "user",
              targetId: userId,
              reason,
              metadata: {
                duration: duration || "immediate",
                deletionScheduledAt: deletionScheduledAt.toISOString(),
                sessionsRevoked: true,
              },
            },
          })
        })

        results.push({
          id: userId,
          success: true,
        })
        successCount++
      } catch (error) {
        results.push({
          id: userId,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        })
        failureCount++
        console.error(`Failed to block user ${userId}:`, error)
      }
    }
  }

  return {
    operation: "range-block",
    totalItems: userIds.length,
    successCount,
    failureCount,
    results,
    duration: 0, // Will be set by caller
  }
}
