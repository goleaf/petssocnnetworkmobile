/**
 * Version history system for content
 * Ensures version history is never lost
 */

import { prisma } from '../prisma';

/**
 * Create a version snapshot of content
 */
export interface CreateVersionParams {
  /** Type of content (e.g., 'wiki_article', 'blog_post') */
  contentType: string;
  /** ID of the content */
  contentId: string;
  /** Version number (incremented automatically if not provided) */
  version?: number;
  /** Content data to store */
  content: Record<string, unknown>;
  /** User ID who created this version */
  createdBy?: string;
  /** Optional comment about this version */
  comment?: string;
}

/**
 * Get version history for content
 */
export interface VersionHistory {
  id: string;
  contentType: string;
  contentId: string;
  version: number;
  content: Record<string, unknown>;
  createdAt: Date;
  createdBy?: string;
  comment?: string;
}

/**
 * Create a new version snapshot
 */
export async function createVersion(params: CreateVersionParams): Promise<string> {
  const { contentType, contentId, version, content, createdBy, comment } = params;

  try {
    // Get current max version for this content
    const existingVersions = await prisma.contentVersion.findMany({
      where: {
        contentType,
        contentId,
      },
      orderBy: {
        version: 'desc',
      },
      take: 1,
    });

    const nextVersion = version ?? (existingVersions[0]?.version ?? 0) + 1;

    // Create version snapshot
    const versionRecord = await prisma.contentVersion.create({
      data: {
        contentType,
        contentId,
        version: nextVersion,
        content: content as Record<string, unknown>,
        createdBy: createdBy || null,
        comment: comment || null,
      },
    });

    return versionRecord.id;
  } catch (error) {
    console.error('Failed to create version:', error);
    throw new Error(`Failed to create version: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get version history for content
 */
export async function getVersionHistory(
  contentType: string,
  contentId: string,
  limit: number = 50
): Promise<VersionHistory[]> {
  try {
    const versions = await prisma.contentVersion.findMany({
      where: {
        contentType,
        contentId,
      },
      orderBy: {
        version: 'desc',
      },
      take: limit,
    });

    return versions.map((v) => ({
      id: v.id,
      contentType: v.contentType,
      contentId: v.contentId,
      version: v.version,
      content: v.content as Record<string, unknown>,
      createdAt: v.createdAt,
      createdBy: v.createdBy || undefined,
      comment: v.comment || undefined,
    }));
  } catch (error) {
    console.error('Failed to get version history:', error);
    return [];
  }
}

/**
 * Get a specific version by version number
 */
export async function getVersion(
  contentType: string,
  contentId: string,
  version: number
): Promise<VersionHistory | null> {
  try {
    const versionRecord = await prisma.contentVersion.findFirst({
      where: {
        contentType,
        contentId,
        version,
      },
    });

    if (!versionRecord) return null;

    return {
      id: versionRecord.id,
      contentType: versionRecord.contentType,
      contentId: versionRecord.contentId,
      version: versionRecord.version,
      content: versionRecord.content as Record<string, unknown>,
      createdAt: versionRecord.createdAt,
      createdBy: versionRecord.createdBy || undefined,
      comment: versionRecord.comment || undefined,
    };
  } catch (error) {
    console.error('Failed to get version:', error);
    return null;
  }
}

/**
 * Restore content to a specific version
 */
export async function restoreVersion(
  contentType: string,
  contentId: string,
  version: number,
  restoredBy?: string
): Promise<boolean> {
  try {
    const versionRecord = await getVersion(contentType, contentId, version);
    if (!versionRecord) {
      throw new Error(`Version ${version} not found`);
    }

    // Create a new version with restored content (this preserves history)
    await createVersion({
      contentType,
      contentId,
      content: versionRecord.content,
      createdBy: restoredBy,
      comment: `Restored from version ${version}`,
    });

    return true;
  } catch (error) {
    console.error('Failed to restore version:', error);
    return false;
  }
}

/**
 * Delete version history (use with caution - violates "never lost" principle)
 * Only use for cleanup of test data or GDPR compliance
 */
export async function deleteVersionHistory(
  contentType: string,
  contentId: string
): Promise<number> {
  try {
    const result = await prisma.contentVersion.deleteMany({
      where: {
        contentType,
        contentId,
      },
    });

    return result.count;
  } catch (error) {
    console.error('Failed to delete version history:', error);
    return 0;
  }
}

