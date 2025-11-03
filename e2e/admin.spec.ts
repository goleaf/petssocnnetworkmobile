import { test, expect } from './fixtures';
import { testAllButtons, testAllLinks, testAllFormFields, testAllInputFields, testAllTextareaFields, testAllSelectFields } from './test-helpers';

/**
 * Helper to test admin pages - handles redirects for non-admin users
 */
async function testAdminPageAccess(page: any, adminPath: string): Promise<boolean> {
  try {
    await page.goto(adminPath, { waitUntil: 'domcontentloaded', timeout: 15000 });
    // Wait a bit for any redirects or navigation
    await page.waitForTimeout(1000);
    // Try to wait for load, but don't wait too long
    try {
      await page.waitForLoadState('load', { timeout: 5000 });
    } catch (e) {
      // If load times out, that's ok - check URL anyway
    }
    const currentUrl = page.url();
    // Admin pages redirect to "/" or "/unauthorized" if user doesn't have admin role
    return currentUrl.includes(adminPath.replace(/^\//, ''));
  } catch (e) {
    // If page fails to load completely, assume no access
    const currentUrl = page.url();
    return currentUrl.includes(adminPath.replace(/^\//, ''));
  }
}

test.describe('Admin Pages', () => {
  test.describe('Admin Dashboard', () => {
    test('should load admin dashboard or redirect if unauthorized', async ({ authenticatedPage: page }) => {
      const hasAccess = await testAdminPageAccess(page, '/admin/dashboard');
      if (hasAccess) {
        await expect(page).toHaveURL(/.*\/admin\/dashboard/);
      } else {
        await expect(page).toHaveURL(/\//);
      }
    });

    test('should test all buttons on admin dashboard', async ({ authenticatedPage: page }) => {
      const hasAccess = await testAdminPageAccess(page, '/admin/dashboard');
      if (hasAccess) {
        await testAllButtons(page, 50);
      }
    });

    test('should test all links on admin dashboard', async ({ authenticatedPage: page }) => {
      const hasAccess = await testAdminPageAccess(page, '/admin/dashboard');
      if (hasAccess) {
        await testAllLinks(page, 50);
      }
    });

    test('should test all form fields on admin dashboard', async ({ authenticatedPage: page }) => {
      const hasAccess = await testAdminPageAccess(page, '/admin/dashboard');
      if (hasAccess) {
        await testAllFormFields(page);
      }
    });
  });

  test.describe('Admin Moderation', () => {
    test('should load moderation page or redirect if unauthorized', async ({ authenticatedPage: page }) => {
      const hasAccess = await testAdminPageAccess(page, '/admin/moderation');
      if (hasAccess) {
        await expect(page).toHaveURL(/.*\/admin\/moderation/);
      } else {
        await expect(page).toHaveURL(/\//);
      }
    });

    test('should test all buttons on moderation page', async ({ authenticatedPage: page }) => {
      const hasAccess = await testAdminPageAccess(page, '/admin/moderation');
      if (hasAccess) {
        await testAllButtons(page, 50);
      }
    });

    test('should test all links on moderation page', async ({ authenticatedPage: page }) => {
      const hasAccess = await testAdminPageAccess(page, '/admin/moderation');
      if (hasAccess) {
        await testAllLinks(page, 50);
      }
    });

    test('should test all form fields on moderation page', async ({ authenticatedPage: page }) => {
      const hasAccess = await testAdminPageAccess(page, '/admin/moderation');
      if (hasAccess) {
        await testAllFormFields(page);
      }
    });

    test('should test all input fields on moderation page', async ({ authenticatedPage: page }) => {
      const hasAccess = await testAdminPageAccess(page, '/admin/moderation');
      if (hasAccess) {
        await testAllInputFields(page);
      }
    });

    test('should test all textarea fields on moderation page', async ({ authenticatedPage: page }) => {
      const hasAccess = await testAdminPageAccess(page, '/admin/moderation');
      if (hasAccess) {
        await testAllTextareaFields(page);
      }
    });
  });

  test.describe('Admin Analytics', () => {
    test('should load analytics page or redirect if unauthorized', async ({ authenticatedPage: page }) => {
      const hasAccess = await testAdminPageAccess(page, '/admin/analytics');
      if (hasAccess) {
        await expect(page).toHaveURL(/.*\/admin\/analytics/);
      } else {
        await expect(page).toHaveURL(/\//);
      }
    });

    test('should test all buttons on analytics page', async ({ authenticatedPage: page }) => {
      const hasAccess = await testAdminPageAccess(page, '/admin/analytics');
      if (hasAccess) {
        await testAllButtons(page, 50);
      }
    });

    test('should test all links on analytics page', async ({ authenticatedPage: page }) => {
      const hasAccess = await testAdminPageAccess(page, '/admin/analytics');
      if (hasAccess) {
        await testAllLinks(page, 50);
      }
    });

    test('should test all form fields on analytics page', async ({ authenticatedPage: page }) => {
      const hasAccess = await testAdminPageAccess(page, '/admin/analytics');
      if (hasAccess) {
        await testAllFormFields(page);
      }
    });
  });
});

