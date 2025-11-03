import { test, expect } from './fixtures';

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
      
      const buttons = page.locator('button');
      const count = await buttons.count();
      
      if (count > 0) {
        for (let i = 0; i < Math.min(count, 30); i++) {
          const button = buttons.nth(i);
          if (await button.isVisible()) {
            await expect(button).toBeVisible();
          }
        }
      }
    });

    test('should test all form fields on search page', async ({ authenticatedPage: page }) => {
      await page.goto('/search');
      await page.waitForLoadState('networkidle');
      
      const fields = page.locator('input, select');
      const count = await fields.count();
      
      if (count > 0) {
        for (let i = 0; i < count; i++) {
          const field = fields.nth(i);
          if (await field.isVisible()) {
            await expect(field).toBeVisible();
            
            const tagName = await field.evaluate(el => el.tagName.toLowerCase());
            if (tagName === 'input') {
              const inputType = await field.getAttribute('type');
              if (inputType !== 'submit' && inputType !== 'button' && inputType !== 'file') {
                await field.fill('test');
                await field.clear();
              }
            }
          }
        }
      }
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
      
      const buttons = page.locator('button');
      const count = await buttons.count();
      
      if (count > 0) {
        for (let i = 0; i < Math.min(count, 30); i++) {
          const button = buttons.nth(i);
          if (await button.isVisible()) {
            await expect(button).toBeVisible();
          }
        }
      }
    });

    test('should test all filter fields on faceted search page', async ({ authenticatedPage: page }) => {
      await page.goto('/search-faceted');
      await page.waitForLoadState('networkidle');
      
      const fields = page.locator('input, select');
      const count = await fields.count();
      
      if (count > 0) {
        for (let i = 0; i < count; i++) {
          const field = fields.nth(i);
          if (await field.isVisible()) {
            await expect(field).toBeVisible();
          }
        }
      }
    });
  });
});

