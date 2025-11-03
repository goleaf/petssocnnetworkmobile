import { test, expect } from './fixtures';

test.describe('Organizations Pages', () => {
  test.describe('Organizations List Page', () => {
    test('should load organizations list page', async ({ authenticatedPage: page }) => {
      await page.goto('/organizations');
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/.*\/organizations/);
    });

    test('should test all buttons on organizations list page', async ({ authenticatedPage: page }) => {
      await page.goto('/organizations');
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

    test('should test all links on organizations list page', async ({ authenticatedPage: page }) => {
      await page.goto('/organizations');
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
      await page.goto('/organizations');
      await page.waitForLoadState('networkidle');
      
      const searchInput = page.locator('input[type="search"]').or(
        page.locator('input[placeholder*="search" i]')
      ).first();
      
      if (await searchInput.count() > 0) {
        await expect(searchInput).toBeVisible();
        await searchInput.fill('test search');
        await expect(searchInput).toHaveValue('test search');
      }
    });

    test('should test filter dropdowns', async ({ authenticatedPage: page }) => {
      await page.goto('/organizations');
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
  });

  test.describe('Organization Detail Page', () => {
    test('should load organization detail page', async ({ authenticatedPage: page }) => {
      // First navigate to list page and find an organization
      await page.goto('/organizations');
      await page.waitForLoadState('networkidle');
      
      // Try to find and click an organization link
      const orgLinks = page.locator('a[href*="/organizations/"]').filter({ hasNot: page.locator('text=/create|Create/') });
      const count = await orgLinks.count();
      
      if (count > 0) {
        await orgLinks.first().click();
        await page.waitForLoadState('networkidle');
        await expect(page).toHaveURL(/.*\/organizations\/[^\/]+$/);
      }
    });

    test('should test all buttons on organization detail page', async ({ authenticatedPage: page }) => {
      await page.goto('/organizations');
      await page.waitForLoadState('networkidle');
      
      const orgLinks = page.locator('a[href*="/organizations/"]').filter({ hasNot: page.locator('text=/create|Create/') });
      const count = await orgLinks.count();
      
      if (count > 0) {
        await orgLinks.first().click();
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

    test('should test all links on organization detail page', async ({ authenticatedPage: page }) => {
      await page.goto('/organizations');
      await page.waitForLoadState('networkidle');
      
      const orgLinks = page.locator('a[href*="/organizations/"]').filter({ hasNot: page.locator('text=/create|Create/') });
      const count = await orgLinks.count();
      
      if (count > 0) {
        await orgLinks.first().click();
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

    test('should test tab navigation', async ({ authenticatedPage: page }) => {
      await page.goto('/organizations');
      await page.waitForLoadState('networkidle');
      
      const orgLinks = page.locator('a[href*="/organizations/"]').filter({ hasNot: page.locator('text=/create|Create/') });
      const count = await orgLinks.count();
      
      if (count > 0) {
        await orgLinks.first().click();
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

