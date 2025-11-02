import { prisma } from "@/lib/prisma"
import type { SoftDeleteAudit, ModerationActionLog } from "@/lib/types"

/**
 * Soft delete content with audit trail
 */
export async function softDeleteContent(params: {
  contentType: string
  contentId: string
  deletedBy: string
  reason?: string
  metadata?: Record<string, unknown>
}): Promise<{ success: boolean; error?: string; auditId?: string }> {
  try {
    const { contentType, contentId, deletedBy, reason, metadata } = params

    // Determine which model to update based on contentType
    let updateResult
    switch (contentType) {
      case "article":
        updateResult = await prisma.article.update({
          where: { id: contentId },
          data: { deletedAt: new Date() },
        })
        break
      case "blog_post":
        updateResult = await prisma.blogPost.update({
          where: { id: contentId },
          data: { deletedAt: new Date() },
        })
        break
      case "place":
        updateResult = await prisma.place.update({
          where: { id: contentId },
          data: { deletedAt: new Date() },
        })
        break
      case "product":
        updateResult = await prisma.product.update({
          where: { id: contentId },
          data: { deletedAt: new Date() },
        })
        break
      default:
        return { success: false, error: `Unsupported content type: ${contentType}` }
    }

    // Create audit trail
    const audit = await prisma.softDeleteAudit.create({
      data: {
        contentType,
        contentId,
        deletedBy,
        reason,
        metadata: metadata || {},
      },
    })

    // Log moderation action
    await prisma.moderationActionLog.create({
      data: {
        action: "delete",
        contentType,
        contentId,
        performedBy: deletedBy,
        reason,
        metadata: metadata || {},
      },
    })

    return { success: true, auditId: audit.id }
  } catch (error) {
    console.error("Error soft deleting content:", error)
    return { success: false, error: `Failed to soft delete: ${error}` }
  }
}

/**
 * Restore soft-deleted content
 */
export async function restoreContent(params: {
  contentType: string
  contentId: string
  restoredBy: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    const { contentType, contentId, restoredBy } = params

    // Determine which model to update
    switch (contentType) {
      case "article":
        await prisma.article.update({
          where: { id: contentId },
          data: { deletedAt: null },
        })
        break
      case "blog_post":
        await prisma.blogPost.update({
          where: { id: contentId },
          data: { deletedAt: null },
        })
        break
      case "place":
        await prisma.place.update({
          where: { id: contentId },
          data: { deletedAt: null },
        })
        break
      case "product":
        await prisma.product.update({
          where: { id: contentId },
          data: { deletedAt: null },
        })
        break
      default:
        return { success: false, error: `Unsupported content type: ${contentType}` }
    }

    // Update audit trail
    await prisma.softDeleteAudit.updateMany({
      where: {
        contentType,
        contentId,
        restoredAt: null, // Only update if not already restored
      },
      data: {
        restoredAt: new Date(),
        restoredBy,
      },
    })

    // Log moderation action
    await prisma.moderationActionLog.create({
      data: {
        action: "restore",
        contentType,
        contentId,
        performedBy: restoredBy,
        reason: "Content restored",
      },
    })

    return { success: true }
  } catch (error) {
    console.error("Error restoring content:", error)
    return { success: false, error: `Failed to restore: ${error}` }
  }
}

/**
 * Get soft delete audit trail for content
 */
export async function getSoftDeleteAudit(params: {
  contentType: string
  contentId: string
}): Promise<SoftDeleteAudit[]> {
  const { contentType, contentId } = params

  const audits = await prisma.softDeleteAudit.findMany({
    where: {
      contentType,
      contentId,
    },
    orderBy: {
      deletedAt: "desc",
    },
  })

  return audits.map((audit) => ({
    id: audit.id,
    contentType: audit.contentType,
    contentId: audit.contentId,
    deletedBy: audit.deletedBy,
    reason: audit.reason || undefined,
    metadata: (audit.metadata as Record<string, unknown>) || undefined,
    deletedAt: audit.deletedAt.toISOString(),
    restoredAt: audit.restoredAt?.toISOString(),
    restoredBy: audit.restoredBy || undefined,
  }))
}

/**
 * Check if content is soft-deleted
 */
export async function isContentDeleted(params: {
  contentType: string
  contentId: string
}): Promise<boolean> {
  const { contentType, contentId } = params

  try {
    let content
    switch (contentType) {
      case "article":
        content = await prisma.article.findUnique({
          where: { id: contentId },
          select: { deletedAt: true },
        })
        break
      case "blog_post":
        content = await prisma.blogPost.findUnique({
          where: { id: contentId },
          select: { deletedAt: true },
        })
        break
      case "place":
        content = await prisma.place.findUnique({
          where: { id: contentId },
          select: { deletedAt: true },
        })
        break
      case "product":
        content = await prisma.product.findUnique({
          where: { id: contentId },
          select: { deletedAt: true },
        })
        break
      default:
        return false
    }

    return content ? content.deletedAt !== null : false
  } catch (error) {
    console.error("Error checking if content is deleted:", error)
    return false
  }
}

