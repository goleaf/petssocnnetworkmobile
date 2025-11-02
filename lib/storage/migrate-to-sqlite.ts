/**
 * Migration script to convert localStorage data to SQLite
 * Run this script in the browser to migrate data
 */

import { createSQLiteAdapter, getSQLiteDatabase, closeSQLiteDatabase } from './sqlite-adapter';
import { setStorageAdapter, readData } from '../storage';
import { validateStorage } from './validate';

export interface MigrationOptions {
  dbPath: string;
  validateBeforeMigration?: boolean;
  backupLocalStorage?: boolean;
  verbose?: boolean;
}

export interface MigrationResult {
  success: boolean;
  migratedKeys: string[];
  skippedKeys: string[];
  errors: Array<{ key: string; error: string }>;
  stats: {
    totalKeys: number;
    migratedCount: number;
    skippedCount: number;
    errorCount: number;
  };
}

/**
 * Migrates all localStorage data to SQLite
 */
export async function migrateToSQLite(options: MigrationOptions): Promise<MigrationResult> {
  const {
    dbPath,
    validateBeforeMigration = true,
    backupLocalStorage = true,
    verbose = false,
  } = options;

  const result: MigrationResult = {
    success: false,
    migratedKeys: [],
    skippedKeys: [],
    errors: [],
    stats: {
      totalKeys: 0,
      migratedCount: 0,
      skippedCount: 0,
      errorCount: 0,
    },
  };

  if (typeof window === 'undefined') {
    result.errors.push({
      key: 'window',
      error: 'Migration can only run in browser environment',
    });
    return result;
  }

  try {
    // Step 1: Validate storage before migration
    if (validateBeforeMigration) {
      if (verbose) console.log('[Migration] Validating storage before migration...');
      const validation = validateStorage();
      
      if (!validation.isValid) {
        console.warn('[Migration] Storage validation found errors:', validation.errors);
        if (verbose) {
          console.warn('[Migration] Validation errors:', validation.errors);
          console.warn('[Migration] Validation warnings:', validation.warnings);
        }
      } else {
        if (verbose) console.log('[Migration] Storage validation passed');
      }
    }

    // Step 2: Backup localStorage if requested
    if (backupLocalStorage) {
      if (verbose) console.log('[Migration] Creating localStorage backup...');
      await backupLocalStorageData();
    }

    // Step 3: Create SQLite adapter
    if (verbose) console.log(`[Migration] Creating SQLite adapter for path: ${dbPath}`);
    const sqliteAdapter = createSQLiteAdapter({ dbPath, verbose });

    // Step 4: Get all localStorage keys
    const storageKeys = Object.keys(localStorage).filter(key => 
      key.startsWith('pet_social_')
    );

    result.stats.totalKeys = storageKeys.length;
    if (verbose) console.log(`[Migration] Found ${storageKeys.length} keys to migrate`);

    // Step 5: Migrate each key
    for (const key of storageKeys) {
      try {
        const value = localStorage.getItem(key);
        if (!value) {
          result.skippedKeys.push(key);
          result.stats.skippedCount++;
          if (verbose) console.log(`[Migration] Skipped empty key: ${key}`);
          continue;
        }

        // Parse and validate JSON
        let parsed: unknown;
        try {
          parsed = JSON.parse(value);
        } catch (parseError) {
          result.errors.push({
            key,
            error: `Failed to parse JSON: ${parseError instanceof Error ? parseError.message : String(parseError)}`,
          });
          result.stats.errorCount++;
          continue;
        }

        // Write to SQLite
        sqliteAdapter.write(key, parsed);
        result.migratedKeys.push(key);
        result.stats.migratedCount++;
        
        if (verbose) console.log(`[Migration] Migrated key: ${key}`);
      } catch (error) {
        result.errors.push({
          key,
          error: error instanceof Error ? error.message : String(error),
        });
        result.stats.errorCount++;
        if (verbose) console.error(`[Migration] Error migrating key ${key}:`, error);
      }
    }

    // Step 6: Switch to SQLite adapter
    setStorageAdapter(sqliteAdapter);
    if (verbose) console.log('[Migration] Switched storage adapter to SQLite');

    result.success = result.errors.length === 0;
    
    if (verbose) {
      console.log('[Migration] Migration completed:', {
        success: result.success,
        migrated: result.stats.migratedCount,
        skipped: result.stats.skippedCount,
        errors: result.stats.errorCount,
      });
    }

    return result;
  } catch (error) {
    result.errors.push({
      key: 'migration',
      error: error instanceof Error ? error.message : String(error),
    });
    result.success = false;
    console.error('[Migration] Migration failed:', error);
    return result;
  }
}

/**
 * Backs up localStorage data to a downloadable JSON file
 */
async function backupLocalStorageData(): Promise<void> {
  const backup: Record<string, string> = {};
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('pet_social_')) {
      backup[key] = localStorage.getItem(key) || '';
    }
  }

  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `localStorage-backup-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Verifies migration by comparing localStorage and SQLite data
 */
export function verifyMigration(dbPath: string): {
  verified: boolean;
  differences: Array<{ key: string; localStorage: unknown; sqlite: unknown }>;
} {
  const differences: Array<{ key: string; localStorage: unknown; sqlite: unknown }> = [];
  
  if (typeof window === 'undefined') {
    return { verified: false, differences: [] };
  }

  const sqliteAdapter = createSQLiteAdapter({ dbPath, verbose: false });
  const storageKeys = Object.keys(localStorage).filter(key => 
    key.startsWith('pet_social_')
  );

  for (const key of storageKeys) {
    const localStorageValue = localStorage.getItem(key);
    const sqliteValue = sqliteAdapter.read(key, null);

    if (localStorageValue) {
      try {
        const parsedLocalStorage = JSON.parse(localStorageValue);
        const parsedSQLite = sqliteValue;

        // Deep comparison would be better, but this is a simple check
        if (JSON.stringify(parsedLocalStorage) !== JSON.stringify(parsedSQLite)) {
          differences.push({
            key,
            localStorage: parsedLocalStorage,
            sqlite: parsedSQLite,
          });
        }
      } catch (error) {
        differences.push({
          key,
          localStorage: localStorageValue,
          sqlite: sqliteValue,
        });
      }
    }
  }

  return {
    verified: differences.length === 0,
    differences,
  };
}

