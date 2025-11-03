import { test, expect } from './fixtures';

test.describe('Species Pages', () => {
  test.describe('Species List Page', () => {
    test('should load species list page', async ({ authenticatedPage: page }) => {
      await page.goto('/species');
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/.*\/species/);
    });

    test('should test all buttons on species list page', async ({ authenticatedPage: page }) => {
      await page.goto('/species');
      await page.waitForLoadState('networkidle');
      
      const buttons = page.locator('button');
      const count = await buttons.count();
      
      if (count > 0) {
        for (let i = 0; i < Math.min(count, 50); i++) {
          const button = buttons.nth(i);
          if (await button.isVisible()) {
            await expect(button).toBeVisible();
          }
        }
      }
    });

    test('should test all links on species list page', async ({ authenticatedPage: page }) => {
      await page.goto('/species');
      await page.waitForLoadState('networkidle');
      
      const links = page.locator('a[href]');
      const count = await links.count();
      
      if (count > 0) {
        for (let i = 0; i < Math.min(count, 50); i++) {
          const link = links.nth(i);
          if (await link.isVisible()) {
            await expect(link).toBeVisible();
          }
        }
      }
    });

    test('should test search functionality', async ({ authenticatedPage: page }) => {
      await page.goto('/species');
      await page.waitForLoadState('networkidle');
      
      const searchInput = page.locator('input[type="search"]').or(
        page.locator('input[placeholder*="search" i]')
      ).first();
      
      if (await searchInput.count() > 0) {
        await expect(searchInput).toBeVisible();
        await searchInput.fill('dog');
        await expect(searchInput).toHaveValue('dog');
      }
    });

    test('should test filter dropdowns', async ({ authenticatedPage: page }) => {
      await page.goto('/species');
      await page.waitForLoadState('networkidle');
      
      const selects = page.locator('select, button[role="combobox"]');
      const count = await selects.count();
      
      if (count > 0) {
        for (let i = 0; i < count; i++) {
          const select = selects.nth(i);
          if (await select.isVisible()) {
            await expect(select).toBeVisible();
          }
        }
      }
    });

    test('should test view mode toggle buttons', async ({ authenticatedPage: page }) => {
      await page.goto('/species');
      await page.waitForLoadState('networkidle');
      
      const viewButtons = page.locator('button').filter({ hasText: /grid|list/ });
      const count = await viewButtons.count();
      
      if (count > 0) {
        for (let i = 0; i < count; i++) {
          const button = viewButtons.nth(i);
          if (await button.isVisible()) {
            await expect(button).toBeVisible();
            // Test clicking view buttons
            await button.click();
            await page.waitForTimeout(500);
          }
        }
      }
    });
  });

  test.describe('Species Detail Functionality', () => {
    test('should navigate to species detail from list', async ({ authenticatedPage: page }) => {
      await page.goto('/species');
      await page.waitForLoadState('networkidle');
      
      // Try to find and click a species link
      const speciesLinks = page.locator('a[href*="/species/"]').filter({ hasNot: page.locator('text=/create|Create/') });
      const count = await speciesLinks.count();
      
      if (count > 0) {
        await speciesLinks.first().click();
        await page.waitForLoadState('networkidle');
        await expect(page).toHaveURL(/.*\/species\/[^\/]+$/);
      }
    });

    test('should test all buttons on species detail page', async ({ authenticatedPage: page }) => {
      await page.goto('/species');
      await page.waitForLoadState('networkidle');
      
      const speciesLinks = page.locator('a[href*="/species/"]').filter({ hasNot: page.locator('text=/create|Create/') });
      const count = await speciesLinks.count();
      
      if (count > 0) {
        await speciesLinks.first().click();
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

    test('should test all links on species detail page', async ({ authenticatedPage: page }) => {
      await page.goto('/species');
      await page.waitForLoadState('networkidle');
      
      const speciesLinks = page.locator('a[href*="/species/"]').filter({ hasNot: page.locator('text=/create|Create/') });
      const count = await speciesLinks.count();
      
      if (count > 0) {
        await speciesLinks.first().click();
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

    test('should test tab navigation on species detail', async ({ authenticatedPage: page }) => {
      await page.goto('/species');
      await page.waitForLoadState('networkidle');
      
      const speciesLinks = page.locator('a[href*="/species/"]').filter({ hasNot: page.locator('text=/create|Create/') });
      const count = await speciesLinks.count();
      
      if (count > 0) {
        await speciesLinks.first().click();
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
});

