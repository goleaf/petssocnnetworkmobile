import { test, expect } from './fixtures';
import { testAllButtons, testAllLinks, testAllFormFields, testAllInputFields, testAllTextareaFields, testAllSelectFields } from './test-helpers';

test.describe('Wiki Pages', () => {
  test.describe('Wiki List Page', () => {
    test('should load wiki list page', async ({ authenticatedPage: page }) => {
      await page.goto('/wiki');
      await expect(page).toHaveURL(/.*\/wiki/);
    });

    test('should test all buttons on wiki list page', async ({ authenticatedPage: page }) => {
      await page.goto('/wiki');
      await page.waitForLoadState('networkidle');
      await testAllButtons(page, 50);
    });

    test('should test all links on wiki list page', async ({ authenticatedPage: page }) => {
      await page.goto('/wiki');
      await page.waitForLoadState('networkidle');
      await testAllLinks(page, 50);
    });

    test('should test all form fields on wiki list page', async ({ authenticatedPage: page }) => {
      await page.goto('/wiki');
      await page.waitForLoadState('networkidle');
      await testAllFormFields(page);
    });

    test('should navigate to create wiki page', async ({ authenticatedPage: page }) => {
      await page.goto('/wiki');
      await page.waitForLoadState('networkidle');
      
      const createLink = page.locator('a[href*="/wiki/create"]').or(
        page.locator('button').filter({ hasText: /create|new/i })
      ).first();
      
      if (await createLink.count() > 0) {
        await createLink.click();
        await expect(page).toHaveURL(/.*\/wiki\/create/);
      }
    });
  });

  test.describe('Wiki Create Page', () => {
    test('should load wiki create page', async ({ authenticatedPage: page }) => {
      await page.goto('/wiki/create');
      await expect(page).toHaveURL(/.*\/wiki\/create/);
    });

    test('should test all form fields on create page', async ({ authenticatedPage: page }) => {
      await page.goto('/wiki/create');
      await page.waitForLoadState('networkidle');
      await testAllFormFields(page);
    });

    test('should test all buttons on create page', async ({ authenticatedPage: page }) => {
      await page.goto('/wiki/create');
      await page.waitForLoadState('networkidle');
      await testAllButtons(page, 50);
    });

    test('should test all input fields on create page', async ({ authenticatedPage: page }) => {
      await page.goto('/wiki/create');
      await page.waitForLoadState('networkidle');
      await testAllInputFields(page);
    });

    test('should test all textarea fields on create page', async ({ authenticatedPage: page }) => {
      await page.goto('/wiki/create');
      await page.waitForLoadState('networkidle');
      await testAllTextareaFields(page);
    });

    test('should test all select fields on create page', async ({ authenticatedPage: page }) => {
      await page.goto('/wiki/create');
      await page.waitForLoadState('networkidle');
      await testAllSelectFields(page);
    });
  });

  test.describe('Wiki Detail Page', () => {
    test('should load wiki detail page', async ({ authenticatedPage: page }) => {
      // First go to wiki list to get a slug
      await page.goto('/wiki');
      await page.waitForLoadState('networkidle');
      
      const wikiLink = page.locator('a[href*="/wiki/"]').filter({ hasNot: page.locator('text=create') }).first();
      if (await wikiLink.count() > 0) {
        const href = await wikiLink.getAttribute('href');
        if (href && !href.includes('/create')) {
          await wikiLink.click();
          await page.waitForLoadState('networkidle');
          await expect(page).toHaveURL(/.*\/wiki\/.+/);
        }
      } else {
        test.skip();
      }
    });

    test('should test all buttons on wiki detail page', async ({ authenticatedPage: page }) => {
      await page.goto('/wiki');
      await page.waitForLoadState('networkidle');
      
      const wikiLink = page.locator('a[href*="/wiki/"]').filter({ hasNot: page.locator('text=/create|Create/') }).first();
      if (await wikiLink.count() > 0) {
        await wikiLink.click();
        await page.waitForLoadState('networkidle');
        await testAllButtons(page, 50);
      }
    });

    test('should test all form fields on wiki detail page', async ({ authenticatedPage: page }) => {
      await page.goto('/wiki');
      await page.waitForLoadState('networkidle');
      
      const wikiLink = page.locator('a[href*="/wiki/"]').filter({ hasNot: page.locator('text=/create|Create/') }).first();
      if (await wikiLink.count() > 0) {
        await wikiLink.click();
        await page.waitForLoadState('networkidle');
        await testAllFormFields(page);
      }
    });

    test('should test all links on wiki detail page', async ({ authenticatedPage: page }) => {
      await page.goto('/wiki');
      await page.waitForLoadState('networkidle');
      
      const wikiLink = page.locator('a[href*="/wiki/"]').filter({ hasNot: page.locator('text=/create|Create/') }).first();
      if (await wikiLink.count() > 0) {
        await wikiLink.click();
        await page.waitForLoadState('networkidle');
        await testAllLinks(page, 50);
      }
    });
  });
});

