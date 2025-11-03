import * as fs from 'fs';
import * as path from 'path';

/**
 * Delete duplicate test files in __tests__ folders that already exist in tests/unit/
 */

const duplicates = [
  'app/api/admin/notifications/__tests__/send.test.ts',
  'app/api/admin/orgs/__tests__/route.test.ts',
  'app/api/admin/users/__tests__/[id].test.ts',
  'app/api/articles/autocomplete/__tests__/route.test.node.ts',
  'app/api/articles/search/__tests__/route.test.node.ts',
  'app/api/posts/__tests__/create.test.ts',
  'app/api/posts/__tests__/feed.test.ts',
  'app/api/search/__tests__/route-faceted.test.ts',
  'app/api/search/__tests__/route.test.node.ts',
  'app/api/social/__tests__/get-follow-suggestions.test.ts',
  'app/api/upload/__tests__/signed-url.test.ts',
  'lib/__tests__/audit.test.ts',
  'lib/__tests__/auth.test.ts',
  'lib/__tests__/citations.test.ts',
  'lib/__tests__/content-filter.test.ts',
  'lib/__tests__/csrf.test.ts',
  'lib/__tests__/dashboard.test.ts',
  'lib/__tests__/diff.test.ts',
  'lib/__tests__/direct-messages.test.ts',
  'lib/__tests__/drafts.test.ts',
  'lib/__tests__/expert-verification.test.ts',
  'lib/__tests__/health-wiki.test.ts',
  'lib/__tests__/location-grid.test.ts',
  'lib/__tests__/location-obfuscation.test.ts',
  'lib/__tests__/mentions.test.ts',
  'lib/__tests__/message-archive.test.ts',
  'lib/__tests__/messaging.test.ts',
  'lib/__tests__/moderation-dashboard.test.ts',
  'lib/__tests__/moderation.test.ts',
  'lib/__tests__/notifications.test.ts',
  'lib/__tests__/policy.test.ts',
  'lib/__tests__/privacy-circle.test.ts',
  'lib/__tests__/rate-limit.test.ts',
  'lib/__tests__/search-analytics.test.ts',
  'lib/__tests__/sources.test.ts',
  'lib/__tests__/spam-detection.test.ts',
  'lib/__tests__/storage-upload.test.ts',
  'lib/__tests__/storage.test.ts',
  'lib/__tests__/tiers.test.ts',
  'lib/__tests__/translations-rtl.test.ts',
  'lib/__tests__/translations.test.ts',
  'lib/__tests__/utils.test.ts',
  'lib/__tests__/watch-notifications.test.ts',
  'lib/__tests__/watch.test.ts',
  'lib/__tests__/wiki-models.test.ts',
  'lib/__tests__/wiki-pet-helpers.test.ts',
  'lib/__tests__/wiki-revisions.test.ts',
  'lib/__tests__/wiki-server.test.ts',
  'lib/__tests__/wiki.test.ts',
  'lib/auth/__tests__/roles.test.ts',
  'lib/schemas/__tests__/breed-infobox.test.ts',
  'lib/utils/__tests__/analytics-data.test.ts',
  'lib/utils/__tests__/linkify-entities.test.ts',
  'lib/utils/__tests__/post-ranking.test.ts',
  'lib/utils/__tests__/quality-analytics.test.ts',
];

const rootDir = process.cwd();
let deleted = 0;
let errors = 0;

for (const relPath of duplicates) {
  const fullPath = path.join(rootDir, relPath);
  
  if (fs.existsSync(fullPath)) {
    try {
      fs.unlinkSync(fullPath);
      console.log(`Deleted: ${relPath}`);
      deleted++;
      
      // Try to remove empty parent directory
      const parentDir = path.dirname(fullPath);
      if (parentDir.endsWith('__tests__')) {
        try {
          const remainingFiles = fs.readdirSync(parentDir);
          if (remainingFiles.length === 0) {
            fs.rmdirSync(parentDir);
            console.log(`  Removed empty directory: ${path.relative(rootDir, parentDir)}`);
          }
        } catch (e) {
          // Ignore errors removing directory
        }
      }
    } catch (error) {
      console.error(`Error deleting ${relPath}:`, error);
      errors++;
    }
  }
}

console.log(`\nCleanup complete:`);
console.log(`  Deleted: ${deleted}`);
console.log(`  Errors: ${errors}`);




