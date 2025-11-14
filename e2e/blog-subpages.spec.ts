import { test, expect } from './fixtures';
import { testAllButtons, testAllLinks, testAllFormFields } from './test-helpers';

/**
 * E2E tests for blog sub-pages
 * Tests all buttons, fields, and links
 */

test.describe('Blog Sub-Pages', () => {
  test('should test blog analytics page', async ({ authenticatedPage: page }) => {
    await page.goto('/blog');
    await page.waitForLoadState('networkidle');
    
    const blogLink = page.locator('a[href*="/blog/"]').filter({ hasNot: page.locator('text=/create|Create|tag|Tag/') }).first();
    if (await blogLink.count() > 0) {
      await blogLink.click();
      await page.waitForLoadState('networkidle');
      
      const analyticsLink = page.locator('a[href*="/analytics"]').first();
      if (await analyticsLink.count() > 0) {
        await analyticsLink.click();
        await page.waitForLoadState('networkidle');
        await testAllButtons(page, 50);
        await testAllFormFields(page);
      }
    }
  });

  test('should test blog talk page', async ({ authenticatedPage: page }) => {
    await page.goto('/blog');
    await page.waitForLoadState('networkidle');
    
    const blogLink = page.locator('a[href*="/blog/"]').filter({ hasNot: page.locator('text=/create|Create|tag|Tag/') }).first();
    if (await blogLink.count() > 0) {
      await blogLink.click();
      await page.waitForLoadState('networkidle');
      
      const talkLink = page.locator('a[href*="/talk"]').first();
      if (await talkLink.count() > 0) {
        await talkLink.click();
        await page.waitForLoadState('networkidle');
        await testAllButtons(page, 50);
        await testAllFormFields(page);
      }
    }
  });

  test('should test blog edit page', async ({ authenticatedPage: page }) => {
    await page.goto('/blog');
    await page.waitForLoadState('networkidle');
    
    const blogLink = page.locator('a[href*="/blog/"]').filter({ hasNot: page.locator('text=/create|Create|tag|Tag/') }).first();
    if (await blogLink.count() > 0) {
      await blogLink.click();
      await page.waitForLoadState('networkidle');
      
      const editButton = page.locator('button, a').filter({ hasText: /edit|Edit/i }).first();
      if (await editButton.count() > 0) {
        await editButton.click();
        await page.waitForLoadState('networkidle');
        await testAllButtons(page, 50);
        await testAllFormFields(page);
      }
    }
  });
});





