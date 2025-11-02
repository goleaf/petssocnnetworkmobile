# Storage Migration to SQLite

## Overview

This project now includes utilities to validate localStorage data and migrate it to SQLite. The migration system provides data validation, backup, migration, and verification capabilities.

## What Was Created

### 1. Storage Validation (`lib/storage/validate.ts`)
- Validates data integrity of all localStorage keys
- Checks for missing required fields, duplicate IDs, and data structure issues
- Provides detailed error and warning reports

### 2. SQLite Adapter (`lib/storage/sqlite-adapter.ts`)
- Implements the StorageAdapter interface for SQLite
- Works in Node.js/server environments (uses better-sqlite3)
- Creates and manages SQLite database with proper indexing

### 3. Migration Script (`lib/storage/migrate-to-sqlite.ts`)
- Migrates all localStorage data to SQLite
- Creates backups before migration
- Verifies migration success
- Handles errors gracefully

### 4. Migration Component (`components/admin/migrate-storage.tsx`)
- React component for browser-based migration
- Step-by-step UI for validation and migration
- Shows progress and results

### 5. CLI Script (`scripts/migrate-storage.ts`)
- Command-line migration tool (for Node.js)

## Installation

Install required dependencies:

```bash
pnpm install better-sqlite3 sql.js
pnpm install -D @types/better-sqlite3
```

## Usage

### Browser-Based Migration (Recommended)

1. Add the migration component to an admin page:

```tsx
import { MigrateStorageComponent } from '@/components/admin/migrate-storage';

export default function AdminMigrationPage() {
  return <MigrateStorageComponent />;
}
```

2. Navigate to the page and follow the steps:
   - Validate storage data
   - Start migration
   - Verify results

### Programmatic Usage

```typescript
import { validateStorage } from '@/lib/storage/validate';
import { migrateToSQLite, verifyMigration } from '@/lib/storage/migrate-to-sqlite';

// Validate
const validation = validateStorage();
console.log('Validation:', validation);

// Migrate
const result = await migrateToSQLite({
  dbPath: './data/pet-social.db',
  validateBeforeMigration: true,
  backupLocalStorage: true,
  verbose: true,
});

// Verify
const verification = verifyMigration('./data/pet-social.db');
console.log('Verification:', verification);
```

### CLI Usage (Node.js)

```bash
tsx scripts/migrate-storage.ts ./data/pet-social.db
```

## Important Notes

### Environment Compatibility

- **better-sqlite3**: Only works in Node.js/server environments
- **Browser migration**: The migration component runs in the browser but the SQLite adapter needs to run server-side
- For production, consider using API routes to handle SQLite operations server-side

### Database Path

- **Server-side**: Use file system paths (e.g., `./data/pet-social.db`)
- **Browser**: Database operations should be handled via API routes

### Backup

Always enable `backupLocalStorage: true` to create a backup JSON file before migration. The backup is automatically downloaded in the browser.

## Validation Checks

The validation utility checks:

- ✅ Data structure integrity
- ✅ Required fields (id, username, email, etc.)
- ✅ Duplicate IDs
- ✅ Array/object type consistency
- ✅ Referential integrity (where applicable)

## Migration Process

1. **Validate** - Check data integrity
2. **Backup** - Create localStorage backup (optional but recommended)
3. **Migrate** - Copy data to SQLite
4. **Verify** - Compare localStorage and SQLite data
5. **Switch** - Update storage adapter to use SQLite

## Troubleshooting

### Migration Errors

If migration fails:
1. Check validation errors first
2. Review the backup file
3. Fix data issues manually
4. Retry migration

### Browser Limitations

The SQLite adapter uses `better-sqlite3` which only works in Node.js. For browser-based migrations:
- Use API routes to handle SQLite operations
- Or use IndexedDB for browser storage
- Or use sql.js (WASM-based SQLite for browsers)

### Verification Differences

If verification finds differences:
- Check console logs for details
- Review individual key differences
- Consider re-running migration
- Manually compare backup and database

## Next Steps

1. **Test migration** in development environment
2. **Create API routes** for server-side SQLite operations (if needed)
3. **Update storage initialization** to use SQLite by default
4. **Monitor** migration success in production

## Files Structure

```
lib/storage/
├── validate.ts          # Validation utility
├── sqlite-adapter.ts    # SQLite adapter (Node.js)
├── migrate-to-sqlite.ts # Migration script
└── README.md            # Detailed documentation

components/admin/
└── migrate-storage.tsx  # React migration component

scripts/
└── migrate-storage.ts   # CLI migration script
```

