/**
 * Automated backup system
 * Daily backups with retention policy
 */

import { prisma } from '../prisma';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';

const execAsync = promisify(exec);

/**
 * Backup configuration
 */
export interface BackupConfig {
  /** Directory to store backups */
  backupDir: string;
  /** Retention days (default: 30) */
  retentionDays: number;
  /** Whether to backup media files */
  backupMedia: boolean;
  /** Media directory path */
  mediaDir?: string;
}

/**
 * Get backup configuration from environment
 */
export function getBackupConfig(): BackupConfig {
  return {
    backupDir: process.env.BACKUP_DIR || './backups',
    retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS || '30', 10),
    backupMedia: process.env.BACKUP_MEDIA === 'true',
    mediaDir: process.env.MEDIA_DIR,
  };
}

/**
 * Create a database backup
 */
export async function createDatabaseBackup(): Promise<string> {
  const config = getBackupConfig();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFileName = `db-backup-${timestamp}.sql`;
  const backupPath = path.join(config.backupDir, backupFileName);

  try {
    // Ensure backup directory exists
    await fs.mkdir(config.backupDir, { recursive: true });

    // Get database URL from Prisma
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL not configured');
    }

    // Parse database URL to extract connection details
    const url = new URL(databaseUrl);
    const dbName = url.pathname.slice(1);
    const dbHost = url.hostname;
    const dbPort = url.port || '5432';
    const dbUser = url.username;
    const dbPassword = url.password;

    // Create backup command based on database type
    if (databaseUrl.startsWith('postgresql://') || databaseUrl.startsWith('postgres://')) {
      // PostgreSQL backup using pg_dump
      const env = { ...process.env, PGPASSWORD: dbPassword };
      const command = `pg_dump -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} -F c -f ${backupPath}`;
      await execAsync(command, { env });
    } else if (databaseUrl.startsWith('mysql://')) {
      // MySQL backup using mysqldump
      const command = `mysqldump -h ${dbHost} -P ${dbPort} -u ${dbUser} -p${dbPassword} ${dbName} > ${backupPath}`;
      await execAsync(command);
    } else {
      throw new Error(`Unsupported database type: ${databaseUrl.split('://')[0]}`);
    }

    // Compress backup
    const compressedPath = `${backupPath}.gz`;
    await execAsync(`gzip ${backupPath}`);

    return compressedPath;
  } catch (error) {
    console.error('Failed to create database backup:', error);
    throw error;
  }
}

/**
 * Create a media backup (if configured)
 */
export async function createMediaBackup(): Promise<string | null> {
  const config = getBackupConfig();
  
  if (!config.backupMedia || !config.mediaDir) {
    return null;
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFileName = `media-backup-${timestamp}.tar.gz`;
  const backupPath = path.join(config.backupDir, backupFileName);

  try {
    // Ensure backup directory exists
    await fs.mkdir(config.backupDir, { recursive: true });

    // Create tar.gz archive of media directory
    await execAsync(`tar -czf ${backupPath} -C ${path.dirname(config.mediaDir)} ${path.basename(config.mediaDir)}`);

    return backupPath;
  } catch (error) {
    console.error('Failed to create media backup:', error);
    return null;
  }
}

/**
 * Create a full backup (database + media)
 */
export async function createFullBackup(): Promise<{
  databaseBackup: string;
  mediaBackup: string | null;
}> {
  const [databaseBackup, mediaBackup] = await Promise.all([
    createDatabaseBackup(),
    createMediaBackup(),
  ]);

  return {
    databaseBackup,
    mediaBackup,
  };
}

/**
 * Clean up old backups based on retention policy
 */
export async function cleanupOldBackups(): Promise<number> {
  const config = getBackupConfig();
  const retentionMs = config.retentionDays * 24 * 60 * 60 * 1000;
  const cutoffDate = Date.now() - retentionMs;

  try {
    const files = await fs.readdir(config.backupDir);
    let deletedCount = 0;

    for (const file of files) {
      const filePath = path.join(config.backupDir, file);
      const stats = await fs.stat(filePath);

      if (stats.mtimeMs < cutoffDate) {
        await fs.unlink(filePath);
        deletedCount++;
      }
    }

    return deletedCount;
  } catch (error) {
    console.error('Failed to cleanup old backups:', error);
    return 0;
  }
}

/**
 * List all available backups
 */
export async function listBackups(): Promise<Array<{
  name: string;
  path: string;
  size: number;
  createdAt: Date;
}>> {
  const config = getBackupConfig();

  try {
    const files = await fs.readdir(config.backupDir);
    const backups = await Promise.all(
      files.map(async (file) => {
        const filePath = path.join(config.backupDir, file);
        const stats = await fs.stat(filePath);
        return {
          name: file,
          path: filePath,
          size: stats.size,
          createdAt: stats.birthtime,
        };
      })
    );

    return backups.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  } catch (error) {
    console.error('Failed to list backups:', error);
    return [];
  }
}

/**
 * Restore database from backup
 * WARNING: This will overwrite current database
 */
export async function restoreDatabaseBackup(backupPath: string): Promise<boolean> {
  try {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL not configured');
    }

    const url = new URL(databaseUrl);
    const dbName = url.pathname.slice(1);
    const dbHost = url.hostname;
    const dbPort = url.port || '5432';
    const dbUser = url.username;
    const dbPassword = url.password;

    // Decompress if needed
    let restorePath = backupPath;
    if (backupPath.endsWith('.gz')) {
      restorePath = backupPath.replace('.gz', '');
      await execAsync(`gunzip -c ${backupPath} > ${restorePath}`);
    }

    // Restore based on database type
    if (databaseUrl.startsWith('postgresql://') || databaseUrl.startsWith('postgres://')) {
      const env = { ...process.env, PGPASSWORD: dbPassword };
      const command = `pg_restore -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} -c ${restorePath}`;
      await execAsync(command, { env });
    } else if (databaseUrl.startsWith('mysql://')) {
      const command = `mysql -h ${dbHost} -P ${dbPort} -u ${dbUser} -p${dbPassword} ${dbName} < ${restorePath}`;
      await execAsync(command);
    } else {
      throw new Error(`Unsupported database type: ${databaseUrl.split('://')[0]}`);
    }

    // Clean up decompressed file if it was created
    if (restorePath !== backupPath && restorePath.endsWith('.sql')) {
      await fs.unlink(restorePath);
    }

    return true;
  } catch (error) {
    console.error('Failed to restore database backup:', error);
    return false;
  }
}

