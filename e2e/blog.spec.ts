import { test, expect } from './fixtures';
import { testAllButtons, testAllLinks, testAllFormFields, testAllInputFields, testAllTextareaFields, testAllSelectFields } from './test-helpers';

test.describe('Blog Pages', () => {

  test.describe('Blog List Page', () => {
    test('should load blog list page', async ({ authenticatedPage: page }) => {
      await page.goto('/blog');
      await expect(page).toHaveURL(/.*\/blog/);
    });

    test('should test all buttons on blog list page', async ({ authenticatedPage: page }) => {
      await page.goto('/blog');
      await page.waitForLoadState('networkidle');
      await testAllButtons(page, 50);
    });

    test('should test all links on blog list page', async ({ authenticatedPage: page }) => {
      await page.goto('/blog');
      await page.waitForLoadState('networkidle');
      await testAllLinks(page, 50);
    });

    test('should test all input fields on blog list page', async ({ authenticatedPage: page }) => {
      await page.goto('/blog');
      await page.waitForLoadState('networkidle');
      await testAllInputFields(page);
    });

    test('should navigate to create blog page', async ({ authenticatedPage: page }) => {
      await page.goto('/blog');
      await page.waitForLoadState('networkidle');
      
      const createLink = page.locator('a[href*="/blog/create"]').or(
        page.locator('button').filter({ hasText: /create|new|write/i })
      ).first();
      
      if (await createLink.count() > 0) {
        await createLink.click();
        await expect(page).toHaveURL(/.*\/blog\/create/);
      }
    });
  });

  test.describe('Blog Create Page', () => {
    test('should load blog create page', async ({ authenticatedPage: page }) => {
      await page.goto('/blog/create');
      await expect(page).toHaveURL(/.*\/blog\/create/);
    });

    test('should test all form fields on create page', async ({ authenticatedPage: page }) => {
      await page.goto('/blog/create');
      await page.waitForLoadState('networkidle');
      await testAllFormFields(page);
    });

    test('should test all buttons on create page', async ({ authenticatedPage: page }) => {
      await page.goto('/blog/create');
      await page.waitForLoadState('networkidle');
      await testAllButtons(page, 50);
    });

    test('should test all input fields on create page', async ({ authenticatedPage: page }) => {
      await page.goto('/blog/create');
      await page.waitForLoadState('networkidle');
      await testAllInputFields(page);
    });

    test('should test all textarea fields on create page', async ({ authenticatedPage: page }) => {
      await page.goto('/blog/create');
      await page.waitForLoadState('networkidle');
      await testAllTextareaFields(page);
    });

    test('should test all select fields on create page', async ({ authenticatedPage: page }) => {
      await page.goto('/blog/create');
      await page.waitForLoadState('networkidle');
      await testAllSelectFields(page);
    });
  });

  test.describe('Blog Detail Page', () => {
    test('should load blog detail page', async ({ authenticatedPage: page }) => {
      await page.goto('/blog');
      await page.waitForLoadState('networkidle');
      
      const blogLink = page.locator('a[href*="/blog/"]').filter({ hasNot: page.locator('text=/create|Create|tag|Tag/') }).first();
      if (await blogLink.count() > 0) {
        await blogLink.click();
        await page.waitForURL(/.*\/blog\/[^/]+/, { timeout: 5000 });
        await expect(page).toHaveURL(/.*\/blog\/[^/]+/);
      }
    });

    test('should test all buttons on blog detail page', async ({ authenticatedPage: page }) => {
      await page.goto('/blog');
      await page.waitForLoadState('networkidle');
      
      const blogLink = page.locator('a[href*="/blog/"]').filter({ hasNot: page.locator('text=/create|Create|tag|Tag/') }).first();
      if (await blogLink.count() > 0) {
        await blogLink.click();
        await page.waitForLoadState('networkidle');
        await testAllButtons(page, 50);
      }
    });

    test('should test all links on blog detail page', async ({ authenticatedPage: page }) => {
      await page.goto('/blog');
      await page.waitForLoadState('networkidle');
      
      const blogLink = page.locator('a[href*="/blog/"]').filter({ hasNot: page.locator('text=/create|Create|tag|Tag/') }).first();
      if (await blogLink.count() > 0) {
        await blogLink.click();
        await page.waitForLoadState('networkidle');
        await testAllLinks(page, 50);
      }
    });

    test('should test all input fields on blog detail page', async ({ authenticatedPage: page }) => {
      await page.goto('/blog');
      await page.waitForLoadState('networkidle');
      
      const blogLink = page.locator('a[href*="/blog/"]').filter({ hasNot: page.locator('text=/create|Create|tag|Tag/') }).first();
      if (await blogLink.count() > 0) {
        await blogLink.click();
        await page.waitForLoadState('networkidle');
        await testAllInputFields(page);
      }
    });

    test('should test all textarea fields on blog detail page', async ({ authenticatedPage: page }) => {
      await page.goto('/blog');
      await page.waitForLoadState('networkidle');
      
      const blogLink = page.locator('a[href*="/blog/"]').filter({ hasNot: page.locator('text=/create|Create|tag|Tag/') }).first();
      if (await blogLink.count() > 0) {
        await blogLink.click();
        await page.waitForLoadState('networkidle');
        await testAllTextareaFields(page);
      }
    });
  });
});

