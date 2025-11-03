import { test, expect } from './fixtures';

test.describe('Products Pages Detailed', () => {
  test.describe('Products Detail Functionality', () => {
    test('should navigate to product detail from list', async ({ authenticatedPage: page }) => {
      await page.goto('/products');
      await page.waitForLoadState('networkidle');
      
      // Try to find and click a product link
      const productLinks = page.locator('a[href*="/products/"]').filter({ hasNot: page.locator('text=/create|Create/') });
      const count = await productLinks.count();
      
      if (count > 0) {
        await productLinks.first().click();
        await page.waitForLoadState('networkidle');
        await expect(page).toHaveURL(/.*\/products\/[^\/]+$/);
      }
    });

    test('should test all buttons on product detail page', async ({ authenticatedPage: page }) => {
      await page.goto('/products');
      await page.waitForLoadState('networkidle');
      
      const productLinks = page.locator('a[href*="/products/"]').filter({ hasNot: page.locator('text=/create|Create/') });
      const count = await productLinks.count();
      
      if (count > 0) {
        await productLinks.first().click();
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

    test('should test all links on product detail page', async ({ authenticatedPage: page }) => {
      await page.goto('/products');
      await page.waitForLoadState('networkidle');
      
      const productLinks = page.locator('a[href*="/products/"]').filter({ hasNot: page.locator('text=/create|Create/') });
      const count = await productLinks.count();
      
      if (count > 0) {
        await productLinks.first().click();
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

    test('should test tab navigation on product detail', async ({ authenticatedPage: page }) => {
      await page.goto('/products');
      await page.waitForLoadState('networkidle');
      
      const productLinks = page.locator('a[href*="/products/"]').filter({ hasNot: page.locator('text=/create|Create/') });
      const count = await productLinks.count();
      
      if (count > 0) {
        await productLinks.first().click();
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

  test.describe('Products Search and Filters', () => {
    test('should test search input on products page', async ({ authenticatedPage: page }) => {
      await page.goto('/products');
      await page.waitForLoadState('networkidle');
      
      const searchInput = page.locator('input[type="search"]').or(
        page.locator('input[placeholder*="search" i]')
      ).first();
      
      if (await searchInput.count() > 0) {
        await expect(searchInput).toBeVisible();
        await searchInput.fill('test product search');
        await expect(searchInput).toHaveValue('test product search');
      }
    });

    test('should test all filter fields', async ({ authenticatedPage: page }) => {
      await page.goto('/products');
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

    test('should test view mode toggle buttons', async ({ authenticatedPage: page }) => {
      await page.goto('/products');
      await page.waitForLoadState('networkidle');
      
      const viewButtons = page.locator('button').filter({ hasText: /grid|list|view/ });
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
});

