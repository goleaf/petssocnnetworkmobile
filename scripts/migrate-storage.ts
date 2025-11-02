#!/usr/bin/env tsx
/**
 * CLI script to migrate localStorage to SQLite
 * Usage: tsx scripts/migrate-storage.ts [db-path]
 */

import { migrateToSQLite, verifyMigration } from '../lib/storage/migrate-to-sqlite';
import { validateStorage } from '../lib/storage/validate';

async function main() {
  const dbPath = process.argv[2] || './data/pet-social.db';
  
  console.log('🚀 Starting storage migration to SQLite...');
  console.log(`📁 Database path: ${dbPath}`);
  console.log('');

  // Note: This script needs to run in browser environment
  // For Node.js environment, use a different approach
  if (typeof window === 'undefined') {
    console.error('❌ This migration script must run in a browser environment.');
    console.error('   Please use the browser-based migration component instead.');
    process.exit(1);
  }

  try {
    // Validate storage first
    console.log('🔍 Validating storage...');
    const validation = validateStorage();
    
    if (!validation.isValid) {
      console.warn('⚠️  Storage validation found errors:');
      validation.errors.forEach(error => {
        console.warn(`   - ${error.key}: ${error.message}`);
      });
      console.log('');
      
      const shouldContinue = confirm('Continue with migration despite errors?');
      if (!shouldContinue) {
        console.log('❌ Migration cancelled by user');
        process.exit(1);
      }
    } else {
      console.log('✅ Storage validation passed');
      console.log(`   - Total keys: ${validation.stats.totalKeys}`);
      console.log(`   - Valid keys: ${validation.stats.validKeys}`);
      console.log(`   - Missing keys: ${validation.stats.missingKeys.length}`);
      console.log('');
    }

    // Run migration
    console.log('📦 Migrating data to SQLite...');
    const result = await migrateToSQLite({
      dbPath,
      validateBeforeMigration: false, // Already validated
      backupLocalStorage: true,
      verbose: true,
    });

    if (result.success) {
      console.log('');
      console.log('✅ Migration completed successfully!');
      console.log(`   - Migrated keys: ${result.stats.migratedCount}`);
      console.log(`   - Skipped keys: ${result.stats.skippedCount}`);
      console.log(`   - Errors: ${result.stats.errorCount}`);
      console.log('');

      // Verify migration
      console.log('🔍 Verifying migration...');
      const verification = verifyMigration(dbPath);
      
      if (verification.verified) {
        console.log('✅ Migration verification passed');
      } else {
        console.warn('⚠️  Migration verification found differences:');
        verification.differences.forEach(diff => {
          console.warn(`   - ${diff.key}: Data differs between localStorage and SQLite`);
        });
      }
    } else {
      console.error('');
      console.error('❌ Migration completed with errors:');
      result.errors.forEach(error => {
        console.error(`   - ${error.key}: ${error.error}`);
      });
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

main();

