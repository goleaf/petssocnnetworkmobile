import { test, expect } from './fixtures';
import { testAllButtons, testAllLinks, testAllFormFields, testAllInputFields, testAllTextareaFields, testAllSelectFields } from './test-helpers';

test.describe('Search Pages', () => {
  test.describe('Search Page', () => {
    test('should load search page', async ({ authenticatedPage: page }) => {
      await page.goto('/search');
      await expect(page).toHaveURL(/.*\/search/);
    });

    test('should test search input field', async ({ authenticatedPage: page }) => {
      await page.goto('/search');
      await page.waitForLoadState('networkidle');
      
      const searchInput = page.locator('input[type="search"]').or(
        page.locator('input[placeholder*="search" i]')
      ).first();
      
      if (await searchInput.count() > 0) {
        await expect(searchInput).toBeVisible();
        await searchInput.fill('test search query');
        await expect(searchInput).toHaveValue('test search query');
      }
    });

    test('should test all buttons on search page', async ({ authenticatedPage: page }) => {
      await page.goto('/search');
      await page.waitForLoadState('networkidle');
      await testAllButtons(page, 50);
    });

    test('should test all links on search page', async ({ authenticatedPage: page }) => {
      await page.goto('/search');
      await page.waitForLoadState('networkidle');
      await testAllLinks(page, 50);
    });

    test('should test all form fields on search page', async ({ authenticatedPage: page }) => {
      await page.goto('/search');
      await page.waitForLoadState('networkidle');
      await testAllFormFields(page);
    });

    test('should test all input fields on search page', async ({ authenticatedPage: page }) => {
      await page.goto('/search');
      await page.waitForLoadState('networkidle');
      await testAllInputFields(page);
    });

    test('should test all select fields on search page', async ({ authenticatedPage: page }) => {
      await page.goto('/search');
      await page.waitForLoadState('networkidle');
      await testAllSelectFields(page);
    });
  });

  test.describe('Faceted Search Page', () => {
    test('should load faceted search page', async ({ authenticatedPage: page }) => {
      await page.goto('/search-faceted');
      await expect(page).toHaveURL(/.*\/search-faceted/);
    });

    test('should test all buttons on faceted search page', async ({ authenticatedPage: page }) => {
      await page.goto('/search-faceted');
      await page.waitForLoadState('networkidle');
      await testAllButtons(page, 50);
    });

    test('should test all links on faceted search page', async ({ authenticatedPage: page }) => {
      await page.goto('/search-faceted');
      await page.waitForLoadState('networkidle');
      await testAllLinks(page, 50);
    });

    test('should test all filter fields on faceted search page', async ({ authenticatedPage: page }) => {
      await page.goto('/search-faceted');
      await page.waitForLoadState('networkidle');
      await testAllFormFields(page);
    });

    test('should test all input fields on faceted search page', async ({ authenticatedPage: page }) => {
      await page.goto('/search-faceted');
      await page.waitForLoadState('networkidle');
      await testAllInputFields(page);
    });

    test('should test all select fields on faceted search page', async ({ authenticatedPage: page }) => {
      await page.goto('/search-faceted');
      await page.waitForLoadState('networkidle');
      await testAllSelectFields(page);
    });
  });
});

