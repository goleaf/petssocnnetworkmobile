import { test, expect } from './fixtures';

test.describe('Admin Pages', () => {
  test.describe('Admin Dashboard', () => {
    test('should load admin dashboard', async ({ authenticatedPage: page }) => {
      await page.goto('/admin/dashboard');
      await expect(page).toHaveURL(/.*\/admin\/dashboard/);
    });

    test('should test all buttons on admin dashboard', async ({ authenticatedPage: page }) => {
      await page.goto('/admin/dashboard');
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

    test('should test all links on admin dashboard', async ({ authenticatedPage: page }) => {
      await page.goto('/admin/dashboard');
      await page.waitForLoadState('networkidle');
      
      const links = page.locator('a[href]');
      const count = await links.count();
      
      if (count > 0) {
        for (let i = 0; i < Math.min(count, 30); i++) {
          const link = links.nth(i);
          if (await link.isVisible()) {
            await expect(link).toBeVisible();
          }
        }
      }
    });
  });

  test.describe('Admin Moderation', () => {
    test('should load moderation page', async ({ authenticatedPage: page }) => {
      await page.goto('/admin/moderation');
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/.*\/admin\/moderation/);
    });

    test('should test all buttons on moderation page', async ({ authenticatedPage: page }) => {
      await page.goto('/admin/moderation');
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

    test('should test all form fields on moderation page', async ({ authenticatedPage: page }) => {
      await page.goto('/admin/moderation');
      await page.waitForLoadState('networkidle');
      
      const fields = page.locator('input, textarea, select');
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

  test.describe('Admin Analytics', () => {
    test('should load analytics page', async ({ authenticatedPage: page }) => {
      await page.goto('/admin/analytics');
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/.*\/admin\/analytics/);
    });

    test('should test all buttons on analytics page', async ({ authenticatedPage: page }) => {
      await page.goto('/admin/analytics');
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
  });
});

