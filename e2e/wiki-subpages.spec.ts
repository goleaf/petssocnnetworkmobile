import { test, expect } from './fixtures';
import { testAllButtons, testAllLinks, testAllFormFields } from './test-helpers';

/**
 * E2E tests for wiki sub-pages
 * Tests all buttons, fields, and links
 */

test.describe('Wiki Sub-Pages', () => {
  test('should test wiki translate page', async ({ authenticatedPage: page }) => {
    await page.goto('/wiki');
    await page.waitForLoadState('networkidle');
    
    const wikiLink = page.locator('a[href*="/wiki/"]').filter({ hasNot: page.locator('text=/create|Create|quality|editorial/') }).first();
    if (await wikiLink.count() > 0) {
      await wikiLink.click();
      await page.waitForLoadState('networkidle');
      
      const translateButton = page.locator('button, a').filter({ hasText: /translate|Translate/i }).first();
      if (await translateButton.count() > 0) {
        await translateButton.click();
        await page.waitForLoadState('networkidle');
        await testAllButtons(page, 50);
        await testAllFormFields(page);
      }
    }
  });

  test('should test wiki edit page', async ({ authenticatedPage: page }) => {
    await page.goto('/wiki');
    await page.waitForLoadState('networkidle');
    
    const wikiLink = page.locator('a[href*="/wiki/"]').filter({ hasNot: page.locator('text=/create|Create|quality|editorial/') }).first();
    if (await wikiLink.count() > 0) {
      await wikiLink.click();
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

  test('should test wiki quality page', async ({ authenticatedPage: page }) => {
    await page.goto('/wiki/quality');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/.*\/wiki\/quality/);
    await testAllButtons(page, 50);
    await testAllFormFields(page);
    await testAllLinks(page, 50);
  });

  test('should test wiki editorial policy page', async ({ authenticatedPage: page }) => {
    await page.goto('/wiki/editorial-policy');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/.*\/wiki\/editorial-policy/);
    await testAllButtons(page, 50);
    await testAllLinks(page, 50);
  });

  test('should test wiki new page', async ({ authenticatedPage: page }) => {
    await page.goto('/wiki/new');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/.*\/wiki\/new/);
    await testAllButtons(page, 50);
    await testAllFormFields(page);
  });
});





