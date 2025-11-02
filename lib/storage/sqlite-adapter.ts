/**
 * SQLite adapter for storage system
 * Converts localStorage-based storage to SQLite database
 * 
 * NOTE: better-sqlite3 only works in Node.js/server environments.
 * For browser usage, consider using sql.js or IndexedDB.
 */

import type { StorageAdapter } from '../storage';

// Dynamic import for better-sqlite3 (Node.js only)
let Database: typeof import('better-sqlite3').default | null = null;

try {
  // Only import in Node.js environment
  if (typeof window === 'undefined') {
    Database = require('better-sqlite3');
  }
} catch (error) {
  console.warn('better-sqlite3 not available (this is expected in browser environments)');
}

export interface SQLiteAdapterOptions {
  dbPath: string;
  verbose?: boolean;
}

/**
 * Creates a SQLite adapter that implements the StorageAdapter interface
 * 
 * NOTE: This function only works in Node.js/server environments.
 * For browser usage, you need to use a different approach (e.g., sql.js with IndexedDB).
 */
export function createSQLiteAdapter(options: SQLiteAdapterOptions): StorageAdapter {
  if (!Database) {
    throw new Error('better-sqlite3 is not available. This function only works in Node.js/server environments.');
  }
  
  const db = new Database(options.dbPath);
  const verbose = options.verbose ?? false;

  // Enable WAL mode for better concurrency
  db.pragma('journal_mode = WAL');

  // Create storage table if it doesn't exist
  db.exec(`
    CREATE TABLE IF NOT EXISTS storage (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at INTEGER DEFAULT (strftime('%s', 'now'))
    );

    CREATE INDEX IF NOT EXISTS idx_storage_updated_at ON storage(updated_at);
  `);

  const stmt = {
    read: db.prepare('SELECT value FROM storage WHERE key = ?'),
    write: db.prepare('INSERT OR REPLACE INTO storage (key, value, updated_at) VALUES (?, ?, strftime("%s", "now"))'),
    remove: db.prepare('DELETE FROM storage WHERE key = ?'),
    exists: db.prepare('SELECT 1 FROM storage WHERE key = ?'),
  };

  return {
    read<T>(key: string, fallback: T): T {
      try {
        const row = stmt.read.get(key) as { value: string } | undefined;
        if (!row) {
          if (verbose) console.log(`[SQLite] Key "${key}" not found, returning fallback`);
          return fallback;
        }
        const parsed = JSON.parse(row.value) as T;
        if (verbose) console.log(`[SQLite] Read key "${key}"`);
        return parsed;
      } catch (error) {
        console.error(`[SQLite] Failed to read key ${key} from storage`, error);
        return fallback;
      }
    },

    write<T>(key: string, value: T): void {
      try {
        const jsonValue = JSON.stringify(value);
        stmt.write.run(key, jsonValue);
        if (verbose) console.log(`[SQLite] Wrote key "${key}"`);
      } catch (error) {
        console.error(`[SQLite] Failed to write key ${key} to storage`, error);
      }
    },

    remove(key: string): void {
      try {
        stmt.remove.run(key);
        if (verbose) console.log(`[SQLite] Removed key "${key}"`);
      } catch (error) {
        console.error(`[SQLite] Failed to remove key ${key} from storage`, error);
      }
    },
  };
}

/**
 * Gets the database instance (for advanced operations)
 * NOTE: Only works in Node.js/server environments
 */
export function getSQLiteDatabase(dbPath: string): any {
  if (!Database) {
    throw new Error('better-sqlite3 is not available. This function only works in Node.js/server environments.');
  }
  return new Database(dbPath);
}

/**
 * Closes the database connection
 */
export function closeSQLiteDatabase(db: any): void {
  db.close();
}

