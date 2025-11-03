import { test, expect } from './fixtures';
import { testAllButtons, testAllLinks, testAllFormFields } from './test-helpers';

/**
 * Comprehensive E2E tests for all admin pages
 * Tests all buttons, fields, and links on each admin page
 */

test.describe('Admin Pages - Complete Coverage', () => {
  test.describe('Admin Dashboard Pages', () => {
    test('should test admin dashboard main page', async ({ authenticatedPage: page }) => {
      await page.goto('/admin/dashboard');
      await page.waitForLoadState('networkidle');
      await testAllButtons(page, 50);
      await testAllFormFields(page);
      await testAllLinks(page, 50);
    });

    test('should test admin dashboard reports page', async ({ authenticatedPage: page }) => {
      await page.goto('/admin/dashboard/reports');
      await page.waitForLoadState('networkidle');
      await testAllButtons(page, 50);
      await testAllFormFields(page);
    });

    test('should test admin dashboard queue-backlog page', async ({ authenticatedPage: page }) => {
      await page.goto('/admin/dashboard/queue-backlog');
      await page.waitForLoadState('networkidle');
      await testAllButtons(page, 50);
      await testAllFormFields(page);
    });

    test('should test admin dashboard moderation-cases page', async ({ authenticatedPage: page }) => {
      await page.goto('/admin/dashboard/moderation-cases');
      await page.waitForLoadState('networkidle');
      await testAllButtons(page, 50);
      await testAllFormFields(page);
    });

    test('should test admin dashboard flagged-edits page', async ({ authenticatedPage: page }) => {
      await page.goto('/admin/dashboard/flagged-edits');
      await page.waitForLoadState('networkidle');
      await testAllButtons(page, 50);
      await testAllFormFields(page);
    });

    test('should test admin dashboard zero-results page', async ({ authenticatedPage: page }) => {
      await page.goto('/admin/dashboard/zero-results');
      await page.waitForLoadState('networkidle');
      await testAllButtons(page, 50);
      await testAllFormFields(page);
    });

    test('should test admin dashboard stale-health page', async ({ authenticatedPage: page }) => {
      await page.goto('/admin/dashboard/stale-health');
      await page.waitForLoadState('networkidle');
      await testAllButtons(page, 50);
      await testAllFormFields(page);
    });
  });

  test.describe('Admin Analytics Pages', () => {
    test('should test admin analytics main page', async ({ authenticatedPage: page }) => {
      await page.goto('/admin/analytics');
      await page.waitForLoadState('networkidle');
      await testAllButtons(page, 50);
      await testAllFormFields(page);
      await testAllLinks(page, 50);
    });

    test('should test admin analytics search page', async ({ authenticatedPage: page }) => {
      await page.goto('/admin/analytics/search');
      await page.waitForLoadState('networkidle');
      await testAllButtons(page, 50);
      await testAllFormFields(page);
    });

    test('should test admin analytics relationships page', async ({ authenticatedPage: page }) => {
      await page.goto('/admin/analytics/relationships');
      await page.waitForLoadState('networkidle');
      await testAllButtons(page, 50);
      await testAllFormFields(page);
    });
  });

  test.describe('Admin Wiki Pages', () => {
    test('should test admin wiki revisions page', async ({ authenticatedPage: page }) => {
      await page.goto('/admin/wiki/revisions');
      await page.waitForLoadState('networkidle');
      await testAllButtons(page, 50);
      await testAllFormFields(page);
    });

    test('should test admin wiki revisions detail page', async ({ authenticatedPage: page }) => {
      await page.goto('/admin/wiki/revisions');
      await page.waitForLoadState('networkidle');
      
      const revisionLink = page.locator('a[href*="/admin/wiki/revisions/"]').first();
      if (await revisionLink.count() > 0) {
        await revisionLink.click();
        await page.waitForLoadState('networkidle');
        await testAllButtons(page, 50);
        await testAllFormFields(page);
      }
    });

    test('should test admin wiki quality page', async ({ authenticatedPage: page }) => {
      await page.goto('/admin/wiki/quality');
      await page.waitForLoadState('networkidle');
      await testAllButtons(page, 50);
      await testAllFormFields(page);
    });

    test('should test admin wiki experts page', async ({ authenticatedPage: page }) => {
      await page.goto('/admin/wiki/experts');
      await page.waitForLoadState('networkidle');
      await testAllButtons(page, 50);
      await testAllFormFields(page);
    });
  });

  test.describe('Admin Groups Pages', () => {
    test('should test admin groups main page', async ({ authenticatedPage: page }) => {
      await page.goto('/admin/groups');
      await page.waitForLoadState('networkidle');
      await testAllButtons(page, 50);
      await testAllFormFields(page);
    });

    test('should test admin groups generate page', async ({ authenticatedPage: page }) => {
      await page.goto('/admin/groups/generate');
      await page.waitForLoadState('networkidle');
      await testAllButtons(page, 50);
      await testAllFormFields(page);
    });

    test('should test admin groups approvals page', async ({ authenticatedPage: page }) => {
      await page.goto('/admin/groups/approvals');
      await page.waitForLoadState('networkidle');
      await testAllButtons(page, 50);
      await testAllFormFields(page);
    });

    test('should test admin groups edit page', async ({ authenticatedPage: page }) => {
      await page.goto('/admin/groups');
      await page.waitForLoadState('networkidle');
      
      const groupLink = page.locator('a[href*="/admin/groups/"]').filter({ hasNot: page.locator('text=/generate|approvals/') }).first();
      if (await groupLink.count() > 0) {
        await groupLink.click();
        await page.waitForLoadState('networkidle');
        await testAllButtons(page, 50);
        await testAllFormFields(page);
      }
    });
  });

  test.describe('Admin Products Pages', () => {
    test('should test admin products main page', async ({ authenticatedPage: page }) => {
      await page.goto('/admin/products');
      await page.waitForLoadState('networkidle');
      await testAllButtons(page, 50);
      await testAllFormFields(page);
    });

    test('should test admin products create page', async ({ authenticatedPage: page }) => {
      await page.goto('/admin/products/create');
      await page.waitForLoadState('networkidle');
      await testAllButtons(page, 50);
      await testAllFormFields(page);
    });

    test('should test admin products edit page', async ({ authenticatedPage: page }) => {
      await page.goto('/admin/products');
      await page.waitForLoadState('networkidle');
      
      const productLink = page.locator('a[href*="/admin/products/"]').filter({ hasNot: page.locator('text=/create/') }).first();
      if (await productLink.count() > 0) {
        await productLink.click();
        await page.waitForLoadState('networkidle');
        await testAllButtons(page, 50);
        await testAllFormFields(page);
      }
    });
  });

  test.describe('Admin Other Pages', () => {
    test('should test admin moderation page', async ({ authenticatedPage: page }) => {
      await page.goto('/admin/moderation');
      await page.waitForLoadState('networkidle');
      await testAllButtons(page, 50);
      await testAllFormFields(page);
    });

    test('should test admin moderation queue page', async ({ authenticatedPage: page }) => {
      await page.goto('/admin/moderation-queue');
      await page.waitForLoadState('networkidle');
      await testAllButtons(page, 50);
      await testAllFormFields(page);
    });

    test('should test admin moderation reports page', async ({ authenticatedPage: page }) => {
      await page.goto('/admin/moderation/reports');
      await page.waitForLoadState('networkidle');
      await testAllButtons(page, 50);
      await testAllFormFields(page);
    });

    test('should test admin users page', async ({ authenticatedPage: page }) => {
      await page.goto('/admin/users');
      await page.waitForLoadState('networkidle');
      await testAllButtons(page, 50);
      await testAllFormFields(page);
    });

    test('should test admin orgs page', async ({ authenticatedPage: page }) => {
      await page.goto('/admin/orgs');
      await page.waitForLoadState('networkidle');
      await testAllButtons(page, 50);
      await testAllFormFields(page);
    });

    test('should test admin privacy page', async ({ authenticatedPage: page }) => {
      await page.goto('/admin/privacy');
      await page.waitForLoadState('networkidle');
      await testAllButtons(page, 50);
      await testAllFormFields(page);
    });

    test('should test admin announcements page', async ({ authenticatedPage: page }) => {
      await page.goto('/admin/announcements');
      await page.waitForLoadState('networkidle');
      await testAllButtons(page, 50);
      await testAllFormFields(page);
    });

    test('should test admin notifications page', async ({ authenticatedPage: page }) => {
      await page.goto('/admin/notifications');
      await page.waitForLoadState('networkidle');
      await testAllButtons(page, 50);
      await testAllFormFields(page);
    });

    test('should test admin search page', async ({ authenticatedPage: page }) => {
      await page.goto('/admin/search');
      await page.waitForLoadState('networkidle');
      await testAllButtons(page, 50);
      await testAllFormFields(page);
    });

    test('should test admin revisions page', async ({ authenticatedPage: page }) => {
      await page.goto('/admin/revisions');
      await page.waitForLoadState('networkidle');
      await testAllButtons(page, 50);
      await testAllFormFields(page);
    });

    test('should test admin queue page', async ({ authenticatedPage: page }) => {
      await page.goto('/admin/queue');
      await page.waitForLoadState('networkidle');
      await testAllButtons(page, 50);
      await testAllFormFields(page);
    });

    test('should test admin recalls page', async ({ authenticatedPage: page }) => {
      await page.goto('/admin/recalls');
      await page.waitForLoadState('networkidle');
      await testAllButtons(page, 50);
      await testAllFormFields(page);
    });

    test('should test admin ops page', async ({ authenticatedPage: page }) => {
      await page.goto('/admin/ops');
      await page.waitForLoadState('networkidle');
      await testAllButtons(page, 50);
      await testAllFormFields(page);
    });

    test('should test admin expert verification page', async ({ authenticatedPage: page }) => {
      await page.goto('/admin/expert-verification');
      await page.waitForLoadState('networkidle');
      await testAllButtons(page, 50);
      await testAllFormFields(page);
    });

    test('should test admin flagged revisions page', async ({ authenticatedPage: page }) => {
      await page.goto('/admin/flagged-revisions');
      await page.waitForLoadState('networkidle');
      await testAllButtons(page, 50);
      await testAllFormFields(page);
    });

    test('should test admin blog queue page', async ({ authenticatedPage: page }) => {
      await page.goto('/admin/blog/queue');
      await page.waitForLoadState('networkidle');
      await testAllButtons(page, 50);
      await testAllFormFields(page);
    });

    test('should test admin places moderation page', async ({ authenticatedPage: page }) => {
      await page.goto('/admin/places/moderation');
      await page.waitForLoadState('networkidle');
      await testAllButtons(page, 50);
      await testAllFormFields(page);
    });

    test('should test admin settings flags page', async ({ authenticatedPage: page }) => {
      await page.goto('/admin/settings/flags');
      await page.waitForLoadState('networkidle');
      await testAllButtons(page, 50);
      await testAllFormFields(page);
    });

    test('should test admin settings ops page', async ({ authenticatedPage: page }) => {
      await page.goto('/admin/settings/ops');
      await page.waitForLoadState('networkidle');
      await testAllButtons(page, 50);
      await testAllFormFields(page);
    });
  });
});




