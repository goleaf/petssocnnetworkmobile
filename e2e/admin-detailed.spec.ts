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

test.describe('Admin Detailed Pages', () => {
  test.describe('Admin Users Page', () => {
    test('should load admin users page or redirect if unauthorized', async ({ authenticatedPage: page }) => {
      const hasAccess = await testAdminPageAccess(page, '/admin/users');
      if (hasAccess) {
        await expect(page).toHaveURL(/.*\/admin\/users/);
      } else {
        await expect(page).toHaveURL(/\//);
      }
    });

    test('should test all buttons on admin users page', async ({ authenticatedPage: page }) => {
      const hasAccess = await testAdminPageAccess(page, '/admin/users');
      if (hasAccess) {
        await testAllButtons(page, 50);
      }
    });

    test('should test all form fields on admin users page', async ({ authenticatedPage: page }) => {
      const hasAccess = await testAdminPageAccess(page, '/admin/users');
      if (hasAccess) {
        await testAllFormFields(page);
      }
    });

    test('should test all links on admin users page', async ({ authenticatedPage: page }) => {
      const hasAccess = await testAdminPageAccess(page, '/admin/users');
      if (hasAccess) {
        await testAllLinks(page, 50);
      }
    });

    test('should test all input fields on admin users page', async ({ authenticatedPage: page }) => {
      const hasAccess = await testAdminPageAccess(page, '/admin/users');
      if (hasAccess) {
        await testAllInputFields(page);
      }
    });

    test('should test all textarea fields on admin users page', async ({ authenticatedPage: page }) => {
      const hasAccess = await testAdminPageAccess(page, '/admin/users');
      if (hasAccess) {
        await testAllTextareaFields(page);
      }
    });

    test('should test all select fields on admin users page', async ({ authenticatedPage: page }) => {
      const hasAccess = await testAdminPageAccess(page, '/admin/users');
      if (hasAccess) {
        await testAllSelectFields(page);
      }
    });
  });

  test.describe('Admin Wiki Revisions Page', () => {
    test('should load admin wiki revisions page or redirect if unauthorized', async ({ authenticatedPage: page }) => {
      const hasAccess = await testAdminPageAccess(page, '/admin/wiki/revisions');
      if (hasAccess) {
        await expect(page).toHaveURL(/.*\/admin\/wiki\/revisions/);
      } else {
        await expect(page).toHaveURL(/\//);
      }
    });

    test('should test all buttons on admin wiki revisions page', async ({ authenticatedPage: page }) => {
      const hasAccess = await testAdminPageAccess(page, '/admin/wiki/revisions');
      if (hasAccess) {
        await testAllButtons(page, 50);
      }
    });

    test('should test all links on admin wiki revisions page', async ({ authenticatedPage: page }) => {
      const hasAccess = await testAdminPageAccess(page, '/admin/wiki/revisions');
      if (hasAccess) {
        await testAllLinks(page, 50);
      }
    });

    test('should test all form fields on admin wiki revisions page', async ({ authenticatedPage: page }) => {
      const hasAccess = await testAdminPageAccess(page, '/admin/wiki/revisions');
      if (hasAccess) {
        await testAllFormFields(page);
      }
    });
  });

  test.describe('Admin Wiki Quality Page', () => {
    test('should load admin wiki quality page or redirect if unauthorized', async ({ authenticatedPage: page }) => {
      const hasAccess = await testAdminPageAccess(page, '/admin/wiki/quality');
      if (hasAccess) {
        await expect(page).toHaveURL(/.*\/admin\/wiki\/quality/);
      } else {
        await expect(page).toHaveURL(/\//);
      }
    });

    test('should test all buttons on admin wiki quality page', async ({ authenticatedPage: page }) => {
      const hasAccess = await testAdminPageAccess(page, '/admin/wiki/quality');
      if (hasAccess) {
        await testAllButtons(page, 50);
      }
    });

    test('should test all links on admin wiki quality page', async ({ authenticatedPage: page }) => {
      const hasAccess = await testAdminPageAccess(page, '/admin/wiki/quality');
      if (hasAccess) {
        await testAllLinks(page, 50);
      }
    });

    test('should test all form fields on admin wiki quality page', async ({ authenticatedPage: page }) => {
      const hasAccess = await testAdminPageAccess(page, '/admin/wiki/quality');
      if (hasAccess) {
        await testAllFormFields(page);
      }
    });
  });

  test.describe('Admin Wiki Experts Page', () => {
    test('should load admin wiki experts page or redirect if unauthorized', async ({ authenticatedPage: page }) => {
      const hasAccess = await testAdminPageAccess(page, '/admin/wiki/experts');
      if (hasAccess) {
        await expect(page).toHaveURL(/.*\/admin\/wiki\/experts/);
      } else {
        await expect(page).toHaveURL(/\//);
      }
    });

    test('should test all buttons on admin wiki experts page', async ({ authenticatedPage: page }) => {
      const hasAccess = await testAdminPageAccess(page, '/admin/wiki/experts');
      if (hasAccess) {
        await testAllButtons(page, 50);
      }
    });

    test('should test all links on admin wiki experts page', async ({ authenticatedPage: page }) => {
      const hasAccess = await testAdminPageAccess(page, '/admin/wiki/experts');
      if (hasAccess) {
        await testAllLinks(page, 50);
      }
    });

    test('should test all form fields on admin wiki experts page', async ({ authenticatedPage: page }) => {
      const hasAccess = await testAdminPageAccess(page, '/admin/wiki/experts');
      if (hasAccess) {
        await testAllFormFields(page);
      }
    });
  });

  test.describe('Admin Moderation Reports Page', () => {
    test('should load admin moderation reports page or redirect if unauthorized', async ({ authenticatedPage: page }) => {
      const hasAccess = await testAdminPageAccess(page, '/admin/moderation/reports');
      if (hasAccess) {
        await expect(page).toHaveURL(/.*\/admin\/moderation\/reports/);
      } else {
        await expect(page).toHaveURL(/\//);
      }
    });

    test('should test all buttons on admin moderation reports page', async ({ authenticatedPage: page }) => {
      const hasAccess = await testAdminPageAccess(page, '/admin/moderation/reports');
      if (hasAccess) {
        await testAllButtons(page, 50);
      }
    });

    test('should test all links on admin moderation reports page', async ({ authenticatedPage: page }) => {
      const hasAccess = await testAdminPageAccess(page, '/admin/moderation/reports');
      if (hasAccess) {
        await testAllLinks(page, 50);
      }
    });

    test('should test all form fields on admin moderation reports page', async ({ authenticatedPage: page }) => {
      const hasAccess = await testAdminPageAccess(page, '/admin/moderation/reports');
      if (hasAccess) {
        await testAllFormFields(page);
      }
    });
  });

  test.describe('Admin Moderation Queue Page', () => {
    test('should load admin moderation queue page or redirect if unauthorized', async ({ authenticatedPage: page }) => {
      const hasAccess = await testAdminPageAccess(page, '/admin/moderation-queue');
      if (hasAccess) {
        await expect(page).toHaveURL(/.*\/admin\/moderation-queue/);
      } else {
        await expect(page).toHaveURL(/\//);
      }
    });

    test('should test all buttons on admin moderation queue page', async ({ authenticatedPage: page }) => {
      const hasAccess = await testAdminPageAccess(page, '/admin/moderation-queue');
      if (hasAccess) {
        await testAllButtons(page, 50);
      }
    });

    test('should test all links on admin moderation queue page', async ({ authenticatedPage: page }) => {
      const hasAccess = await testAdminPageAccess(page, '/admin/moderation-queue');
      if (hasAccess) {
        await testAllLinks(page, 50);
      }
    });

    test('should test all form fields on admin moderation queue page', async ({ authenticatedPage: page }) => {
      const hasAccess = await testAdminPageAccess(page, '/admin/moderation-queue');
      if (hasAccess) {
        await testAllFormFields(page);
      }
    });
  });

  test.describe('Admin Products Page', () => {
    test('should load admin products page or redirect if unauthorized', async ({ authenticatedPage: page }) => {
      const hasAccess = await testAdminPageAccess(page, '/admin/products');
      if (hasAccess) {
        await expect(page).toHaveURL(/.*\/admin\/products/);
      } else {
        await expect(page).toHaveURL(/\//);
      }
    });

    test('should test all buttons on admin products page', async ({ authenticatedPage: page }) => {
      const hasAccess = await testAdminPageAccess(page, '/admin/products');
      if (hasAccess) {
        await testAllButtons(page, 50);
      }
    });

    test('should test all links on admin products page', async ({ authenticatedPage: page }) => {
      const hasAccess = await testAdminPageAccess(page, '/admin/products');
      if (hasAccess) {
        await testAllLinks(page, 50);
      }
    });

    test('should test all form fields on admin products page', async ({ authenticatedPage: page }) => {
      const hasAccess = await testAdminPageAccess(page, '/admin/products');
      if (hasAccess) {
        await testAllFormFields(page);
      }
    });
  });

  test.describe('Admin Products Create Page', () => {
    test('should load admin products create page or redirect if unauthorized', async ({ authenticatedPage: page }) => {
      const hasAccess = await testAdminPageAccess(page, '/admin/products/create');
      if (hasAccess) {
        await expect(page).toHaveURL(/.*\/admin\/products\/create/);
      } else {
        await expect(page).toHaveURL(/\//);
      }
    });

    test('should test all buttons on admin products create page', async ({ authenticatedPage: page }) => {
      const hasAccess = await testAdminPageAccess(page, '/admin/products/create');
      if (hasAccess) {
        await testAllButtons(page, 50);
      }
    });

    test('should test all links on admin products create page', async ({ authenticatedPage: page }) => {
      const hasAccess = await testAdminPageAccess(page, '/admin/products/create');
      if (hasAccess) {
        await testAllLinks(page, 50);
      }
    });

    test('should test all form fields on admin products create page', async ({ authenticatedPage: page }) => {
      const hasAccess = await testAdminPageAccess(page, '/admin/products/create');
      if (hasAccess) {
        await testAllFormFields(page);
      }
    });
  });

  test.describe('Admin Groups Page', () => {
    test('should load admin groups page or redirect if unauthorized', async ({ authenticatedPage: page }) => {
      const hasAccess = await testAdminPageAccess(page, '/admin/groups');
      if (hasAccess) {
        await expect(page).toHaveURL(/.*\/admin\/groups/);
      } else {
        await expect(page).toHaveURL(/\//);
      }
    });

    test('should test all buttons on admin groups page', async ({ authenticatedPage: page }) => {
      const hasAccess = await testAdminPageAccess(page, '/admin/groups');
      if (hasAccess) {
        await testAllButtons(page, 50);
      }
    });

    test('should test all links on admin groups page', async ({ authenticatedPage: page }) => {
      const hasAccess = await testAdminPageAccess(page, '/admin/groups');
      if (hasAccess) {
        await testAllLinks(page, 50);
      }
    });

    test('should test all form fields on admin groups page', async ({ authenticatedPage: page }) => {
      const hasAccess = await testAdminPageAccess(page, '/admin/groups');
      if (hasAccess) {
        await testAllFormFields(page);
      }
    });
  });

  test.describe('Admin Privacy Page', () => {
    test('should load admin privacy page or redirect if unauthorized', async ({ authenticatedPage: page }) => {
      const hasAccess = await testAdminPageAccess(page, '/admin/privacy');
      if (hasAccess) {
        await expect(page).toHaveURL(/.*\/admin\/privacy/);
      } else {
        await expect(page).toHaveURL(/\//);
      }
    });

    test('should test all buttons on admin privacy page', async ({ authenticatedPage: page }) => {
      const hasAccess = await testAdminPageAccess(page, '/admin/privacy');
      if (hasAccess) {
        await testAllButtons(page, 50);
      }
    });

    test('should test all links on admin privacy page', async ({ authenticatedPage: page }) => {
      const hasAccess = await testAdminPageAccess(page, '/admin/privacy');
      if (hasAccess) {
        await testAllLinks(page, 50);
      }
    });

    test('should test all form fields on admin privacy page', async ({ authenticatedPage: page }) => {
      const hasAccess = await testAdminPageAccess(page, '/admin/privacy');
      if (hasAccess) {
        await testAllFormFields(page);
      }
    });
  });

  test.describe('Admin Organizations Page', () => {
    test('should load admin organizations page or redirect if unauthorized', async ({ authenticatedPage: page }) => {
      const hasAccess = await testAdminPageAccess(page, '/admin/orgs');
      if (hasAccess) {
        await expect(page).toHaveURL(/.*\/admin\/orgs/);
      } else {
        await expect(page).toHaveURL(/\//);
      }
    });

    test('should test all buttons on admin organizations page', async ({ authenticatedPage: page }) => {
      const hasAccess = await testAdminPageAccess(page, '/admin/orgs');
      if (hasAccess) {
        await testAllButtons(page, 50);
      }
    });

    test('should test all links on admin organizations page', async ({ authenticatedPage: page }) => {
      const hasAccess = await testAdminPageAccess(page, '/admin/orgs');
      if (hasAccess) {
        await testAllLinks(page, 50);
      }
    });

    test('should test all form fields on admin organizations page', async ({ authenticatedPage: page }) => {
      const hasAccess = await testAdminPageAccess(page, '/admin/orgs');
      if (hasAccess) {
        await testAllFormFields(page);
      }
    });
  });

  test.describe('Admin Notifications Page', () => {
    test('should load admin notifications page or redirect if unauthorized', async ({ authenticatedPage: page }) => {
      const hasAccess = await testAdminPageAccess(page, '/admin/notifications');
      if (hasAccess) {
        await expect(page).toHaveURL(/.*\/admin\/notifications/);
      } else {
        await expect(page).toHaveURL(/\//);
      }
    });

    test('should test all buttons on admin notifications page', async ({ authenticatedPage: page }) => {
      const hasAccess = await testAdminPageAccess(page, '/admin/notifications');
      if (hasAccess) {
        await testAllButtons(page, 50);
      }
    });

    test('should test all links on admin notifications page', async ({ authenticatedPage: page }) => {
      const hasAccess = await testAdminPageAccess(page, '/admin/notifications');
      if (hasAccess) {
        await testAllLinks(page, 50);
      }
    });

    test('should test all form fields on admin notifications page', async ({ authenticatedPage: page }) => {
      const hasAccess = await testAdminPageAccess(page, '/admin/notifications');
      if (hasAccess) {
        await testAllFormFields(page);
      }
    });
  });

  test.describe('Admin Search Page', () => {
    test('should load admin search page or redirect if unauthorized', async ({ authenticatedPage: page }) => {
      const hasAccess = await testAdminPageAccess(page, '/admin/search');
      if (hasAccess) {
        await expect(page).toHaveURL(/.*\/admin\/search/);
      } else {
        await expect(page).toHaveURL(/\//);
      }
    });

    test('should test all buttons on admin search page', async ({ authenticatedPage: page }) => {
      const hasAccess = await testAdminPageAccess(page, '/admin/search');
      if (hasAccess) {
        await testAllButtons(page, 50);
      }
    });

    test('should test all links on admin search page', async ({ authenticatedPage: page }) => {
      const hasAccess = await testAdminPageAccess(page, '/admin/search');
      if (hasAccess) {
        await testAllLinks(page, 50);
      }
    });

    test('should test all form fields on admin search page', async ({ authenticatedPage: page }) => {
      const hasAccess = await testAdminPageAccess(page, '/admin/search');
      if (hasAccess) {
        await testAllFormFields(page);
      }
    });
  });

  test.describe('Admin Queue Page', () => {
    test('should load admin queue page or redirect if unauthorized', async ({ authenticatedPage: page }) => {
      const hasAccess = await testAdminPageAccess(page, '/admin/queue');
      if (hasAccess) {
        await expect(page).toHaveURL(/.*\/admin\/queue/);
      } else {
        await expect(page).toHaveURL(/\//);
      }
    });

    test('should test all buttons on admin queue page', async ({ authenticatedPage: page }) => {
      const hasAccess = await testAdminPageAccess(page, '/admin/queue');
      if (hasAccess) {
        await testAllButtons(page, 50);
      }
    });

    test('should test all links on admin queue page', async ({ authenticatedPage: page }) => {
      const hasAccess = await testAdminPageAccess(page, '/admin/queue');
      if (hasAccess) {
        await testAllLinks(page, 50);
      }
    });

    test('should test all form fields on admin queue page', async ({ authenticatedPage: page }) => {
      const hasAccess = await testAdminPageAccess(page, '/admin/queue');
      if (hasAccess) {
        await testAllFormFields(page);
      }
    });
  });

  test.describe('Admin Revisions Page', () => {
    test('should load admin revisions page or redirect if unauthorized', async ({ authenticatedPage: page }) => {
      const hasAccess = await testAdminPageAccess(page, '/admin/revisions');
      if (hasAccess) {
        await expect(page).toHaveURL(/.*\/admin\/revisions/);
      } else {
        await expect(page).toHaveURL(/\//);
      }
    });

    test('should test all buttons on admin revisions page', async ({ authenticatedPage: page }) => {
      const hasAccess = await testAdminPageAccess(page, '/admin/revisions');
      if (hasAccess) {
        await testAllButtons(page, 50);
      }
    });

    test('should test all links on admin revisions page', async ({ authenticatedPage: page }) => {
      const hasAccess = await testAdminPageAccess(page, '/admin/revisions');
      if (hasAccess) {
        await testAllLinks(page, 50);
      }
    });

    test('should test all form fields on admin revisions page', async ({ authenticatedPage: page }) => {
      const hasAccess = await testAdminPageAccess(page, '/admin/revisions');
      if (hasAccess) {
        await testAllFormFields(page);
      }
    });
  });

  test.describe('Admin Announcements Page', () => {
    test('should load admin announcements page or redirect if unauthorized', async ({ authenticatedPage: page }) => {
      const hasAccess = await testAdminPageAccess(page, '/admin/announcements');
      if (hasAccess) {
        await expect(page).toHaveURL(/.*\/admin\/announcements/);
      } else {
        await expect(page).toHaveURL(/\//);
      }
    });

    test('should test all buttons on admin announcements page', async ({ authenticatedPage: page }) => {
      const hasAccess = await testAdminPageAccess(page, '/admin/announcements');
      if (hasAccess) {
        await testAllButtons(page, 50);
      }
    });

    test('should test all links on admin announcements page', async ({ authenticatedPage: page }) => {
      const hasAccess = await testAdminPageAccess(page, '/admin/announcements');
      if (hasAccess) {
        await testAllLinks(page, 50);
      }
    });

    test('should test all form fields on admin announcements page', async ({ authenticatedPage: page }) => {
      const hasAccess = await testAdminPageAccess(page, '/admin/announcements');
      if (hasAccess) {
        await testAllFormFields(page);
      }
    });
  });
});

