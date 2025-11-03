import { test, expect } from './fixtures';
import { testAllButtons, testAllLinks, testAllFormFields, testAllInputFields, testAllTextareaFields, testAllSelectFields } from './test-helpers';

test.describe('Groups Pages', () => {
  test.describe('Groups List Page', () => {
    test('should load groups list page', async ({ authenticatedPage: page }) => {
      await page.goto('/groups');
      await expect(page).toHaveURL(/.*\/groups/);
    });

    test('should test all buttons on groups list page', async ({ authenticatedPage: page }) => {
      await page.goto('/groups');
      await page.waitForLoadState('networkidle');
      await testAllButtons(page, 50);
    });

    test('should test all links on groups list page', async ({ authenticatedPage: page }) => {
      await page.goto('/groups');
      await page.waitForLoadState('networkidle');
      await testAllLinks(page, 50);
    });

    test('should test all form fields on groups list page', async ({ authenticatedPage: page }) => {
      await page.goto('/groups');
      await page.waitForLoadState('networkidle');
      await testAllFormFields(page);
    });

    test('should navigate to create group page', async ({ authenticatedPage: page }) => {
      await page.goto('/groups');
      await page.waitForLoadState('networkidle');
      
      const createLink = page.locator('a[href*="/groups/create"]').or(
        page.locator('button').filter({ hasText: /create|new/i })
      ).first();
      
      if (await createLink.count() > 0) {
        await createLink.click();
        await expect(page).toHaveURL(/.*\/groups\/create/);
      }
    });
  });

  test.describe('Group Create Page', () => {
    test('should load group create page', async ({ authenticatedPage: page }) => {
      await page.goto('/groups/create');
      await expect(page).toHaveURL(/.*\/groups\/create/);
    });

    test('should test all form fields on create page', async ({ authenticatedPage: page }) => {
      await page.goto('/groups/create');
      await page.waitForLoadState('networkidle');
      await testAllFormFields(page);
    });

    test('should test all buttons on create page', async ({ authenticatedPage: page }) => {
      await page.goto('/groups/create');
      await page.waitForLoadState('networkidle');
      await testAllButtons(page, 50);
    });

    test('should test all input fields on create page', async ({ authenticatedPage: page }) => {
      await page.goto('/groups/create');
      await page.waitForLoadState('networkidle');
      await testAllInputFields(page);
    });

    test('should test all textarea fields on create page', async ({ authenticatedPage: page }) => {
      await page.goto('/groups/create');
      await page.waitForLoadState('networkidle');
      await testAllTextareaFields(page);
    });

    test('should test all select fields on create page', async ({ authenticatedPage: page }) => {
      await page.goto('/groups/create');
      await page.waitForLoadState('networkidle');
      await testAllSelectFields(page);
    });
  });

  test.describe('Group Detail Page', () => {
    test('should load group detail page', async ({ authenticatedPage: page }) => {
      await page.goto('/groups');
      await page.waitForLoadState('networkidle');
      
      const groupLink = page.locator('a[href*="/groups/"]').filter({ hasNot: page.locator('text=create') }).first();
      if (await groupLink.count() > 0) {
        const href = await groupLink.getAttribute('href');
        if (href && !href.includes('/create')) {
          await groupLink.click();
          await page.waitForLoadState('networkidle');
          await expect(page).toHaveURL(/.*\/groups\/.+/);
        }
      } else {
        test.skip();
      }
    });

    test('should test all buttons on group detail page', async ({ authenticatedPage: page }) => {
      await page.goto('/groups');
      await page.waitForLoadState('networkidle');
      
      const groupLink = page.locator('a[href*="/groups/"]').filter({ hasNot: page.locator('text=/create|Create/') }).first();
      if (await groupLink.count() > 0) {
        await groupLink.click();
        await page.waitForLoadState('networkidle');
        await testAllButtons(page, 50);
      }
    });

    test('should test all form fields on group detail page', async ({ authenticatedPage: page }) => {
      await page.goto('/groups');
      await page.waitForLoadState('networkidle');
      
      const groupLink = page.locator('a[href*="/groups/"]').filter({ hasNot: page.locator('text=/create|Create/') }).first();
      if (await groupLink.count() > 0) {
        await groupLink.click();
        await page.waitForLoadState('networkidle');
        await testAllFormFields(page);
      }
    });

    test('should test all links on group detail page', async ({ authenticatedPage: page }) => {
      await page.goto('/groups');
      await page.waitForLoadState('networkidle');
      
      const groupLink = page.locator('a[href*="/groups/"]').filter({ hasNot: page.locator('text=/create|Create/') }).first();
      if (await groupLink.count() > 0) {
        await groupLink.click();
        await page.waitForLoadState('networkidle');
        await testAllLinks(page, 50);
      }
    });
  });
});

