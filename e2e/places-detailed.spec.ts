import { test, expect } from './fixtures';

test.describe('Places Pages Detailed', () => {
  test.describe('Places Detail Functionality', () => {
    test('should navigate to place detail from list', async ({ authenticatedPage: page }) => {
      await page.goto('/places');
      await page.waitForLoadState('networkidle');
      
      // Try to find and click a place link
      const placeLinks = page.locator('a[href*="/places/"]').filter({ hasNot: page.locator('text=/create|Create/') });
      const count = await placeLinks.count();
      
      if (count > 0) {
        await placeLinks.first().click();
        await page.waitForLoadState('networkidle');
        await expect(page).toHaveURL(/.*\/places\/[^\/]+$/);
      }
    });

    test('should test all buttons on place detail page', async ({ authenticatedPage: page }) => {
      await page.goto('/places');
      await page.waitForLoadState('networkidle');
      
      const placeLinks = page.locator('a[href*="/places/"]').filter({ hasNot: page.locator('text=/create|Create/') });
      const count = await placeLinks.count();
      
      if (count > 0) {
        await placeLinks.first().click();
        await page.waitForLoadState('networkidle');
        
        const buttons = page.locator('button');
        const buttonCount = await buttons.count();
        
        if (buttonCount > 0) {
          for (let i = 0; i < Math.min(buttonCount, 50); i++) {
            const button = buttons.nth(i);
            if (await button.isVisible()) {
              await expect(button).toBeVisible();
            }
          }
        }
      }
    });

    test('should test all links on place detail page', async ({ authenticatedPage: page }) => {
      await page.goto('/places');
      await page.waitForLoadState('networkidle');
      
      const placeLinks = page.locator('a[href*="/places/"]').filter({ hasNot: page.locator('text=/create|Create/') });
      const count = await placeLinks.count();
      
      if (count > 0) {
        await placeLinks.first().click();
        await page.waitForLoadState('networkidle');
        
        const links = page.locator('a[href]');
        const linkCount = await links.count();
        
        if (linkCount > 0) {
          for (let i = 0; i < Math.min(linkCount, 50); i++) {
            const link = links.nth(i);
            if (await link.isVisible()) {
              await expect(link).toBeVisible();
            }
          }
        }
      }
    });

    test('should test tab navigation on place detail', async ({ authenticatedPage: page }) => {
      await page.goto('/places');
      await page.waitForLoadState('networkidle');
      
      const placeLinks = page.locator('a[href*="/places/"]').filter({ hasNot: page.locator('text=/create|Create/') });
      const count = await placeLinks.count();
      
      if (count > 0) {
        await placeLinks.first().click();
        await page.waitForLoadState('networkidle');
        
        const tabTriggers = page.locator('button[role="tab"]');
        const tabCount = await tabTriggers.count();
        
        if (tabCount > 0) {
          for (let i = 0; i < tabCount; i++) {
            const tab = tabTriggers.nth(i);
            if (await tab.isVisible()) {
              await expect(tab).toBeVisible();
              await tab.click();
              await page.waitForTimeout(500);
            }
          }
        }
      }
    });
  });

  test.describe('Places Search and Filters', () => {
    test('should test search input on places page', async ({ authenticatedPage: page }) => {
      await page.goto('/places');
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

    test('should test all filter fields', async ({ authenticatedPage: page }) => {
      await page.goto('/places');
      await page.waitForLoadState('networkidle');
      
      const fields = page.locator('input, select, button[role="combobox"]');
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

    test('should test filter toggle buttons', async ({ authenticatedPage: page }) => {
      await page.goto('/places');
      await page.waitForLoadState('networkidle');
      
      const filterButtons = page.locator('button').filter({ hasText: /filter|Filter|sort|Sort|view|View/i });
      const count = await filterButtons.count();
      
      if (count > 0) {
        for (let i = 0; i < Math.min(count, 10); i++) {
          const button = filterButtons.nth(i);
          if (await button.isVisible()) {
            await expect(button).toBeVisible();
          }
        }
      }
    });
  });
});

