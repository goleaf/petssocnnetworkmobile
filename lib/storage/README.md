# Storage Migration to SQLite

This directory contains utilities for validating localStorage data and migrating it to SQLite.

## Overview

The storage system currently uses browser localStorage for data persistence. This migration system allows you to:

1. **Validate** localStorage data integrity
2. **Migrate** data from localStorage to SQLite
3. **Verify** migration success

## Files

- `validate.ts` - Storage validation utility
- `sqlite-adapter.ts` - SQLite adapter implementation (Node.js only)
- `migrate-to-sqlite.ts` - Migration script and utilities

## Usage

### Browser-Based Migration (Recommended)

Use the React component in `components/admin/migrate-storage.tsx`:

```tsx
import { MigrateStorageComponent } from '@/components/admin/migrate-storage';

// In your admin page
<MigrateStorageComponent />
```

### Programmatic Usage

```typescript
import { validateStorage } from '@/lib/storage/validate';
import { migrateToSQLite, verifyMigration } from '@/lib/storage/migrate-to-sqlite';

// 1. Validate storage
const validation = validateStorage();
if (!validation.isValid) {
  console.error('Validation errors:', validation.errors);
}

// 2. Migrate to SQLite
const result = await migrateToSQLite({
  dbPath: './data/pet-social.db',
  validateBeforeMigration: true,
  backupLocalStorage: true,
  verbose: true,
});

// 3. Verify migration
const verification = verifyMigration('./data/pet-social.db');
if (!verification.verified) {
  console.warn('Differences found:', verification.differences);
}
```

## Important Notes

### Browser vs Node.js

- **better-sqlite3**: Works only in Node.js/server environments
- **sql.js**: Browser-compatible SQLite (loaded via WASM)

For browser-based migrations, the migration component will use IndexedDB or download the database file. For server-side migrations, use better-sqlite3.

### Database Path

The database path is relative to where the script runs:
- Browser: May need to use IndexedDB or download file
- Node.js: File system path (e.g., `./data/pet-social.db`)

### Backup

Always enable `backupLocalStorage: true` to create a backup before migration. The backup is downloaded as a JSON file.

## Validation

The validation utility checks:
- Data structure integrity
- Required fields
- Duplicate IDs
- Referential integrity (where applicable)

## Migration Process

1. **Validate** - Check data integrity
2. **Backup** - Create localStorage backup (optional)
3. **Migrate** - Copy data to SQLite
4. **Verify** - Compare localStorage and SQLite data
5. **Switch** - Update storage adapter to use SQLite

## Troubleshooting

### Migration Errors

If migration fails:
1. Check validation errors
2. Review the backup file
3. Fix data issues
4. Retry migration

### Verification Differences

If verification finds differences:
- Check console logs for details
- Review individual key differences
- Consider re-running migration

