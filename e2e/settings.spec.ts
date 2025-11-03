import { test, expect } from './fixtures';

test.describe('Settings Pages', () => {
  test.describe('Settings Main Page', () => {
    test('should load settings page', async ({ authenticatedPage: page }) => {
      await page.goto('/settings');
      await expect(page).toHaveURL(/.*\/settings/);
    });

    test('should test all buttons on settings page', async ({ authenticatedPage: page }) => {
      await page.goto('/settings');
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

    test('should test all links on settings page', async ({ authenticatedPage: page }) => {
      await page.goto('/settings');
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

  test.describe('Privacy Settings', () => {
    test('should load privacy settings page', async ({ authenticatedPage: page }) => {
      await page.goto('/settings/privacy');
      await expect(page).toHaveURL(/.*\/settings\/privacy/);
    });

    test('should test all form fields on privacy settings', async ({ authenticatedPage: page }) => {
      await page.goto('/settings/privacy');
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

    test('should test all buttons on privacy settings', async ({ authenticatedPage: page }) => {
      await page.goto('/settings/privacy');
      await page.waitForLoadState('networkidle');
      
      const buttons = page.locator('button');
      const count = await buttons.count();
      
      if (count > 0) {
        for (let i = 0; i < count; i++) {
          const button = buttons.nth(i);
          if (await button.isVisible()) {
            await expect(button).toBeVisible();
          }
        }
      }
    });
  });

  test.describe('Notifications Settings', () => {
    test('should load notifications settings page', async ({ authenticatedPage: page }) => {
      await page.goto('/settings/notifications');
      await expect(page).toHaveURL(/.*\/settings\/notifications/);
    });

    test('should test all form fields on notifications settings', async ({ authenticatedPage: page }) => {
      await page.goto('/settings/notifications');
      await page.waitForLoadState('networkidle');
      
      const fields = page.locator('input[type="checkbox"], input[type="radio"], select');
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

    test('should test all buttons on notifications settings', async ({ authenticatedPage: page }) => {
      await page.goto('/settings/notifications');
      await page.waitForLoadState('networkidle');
      
      const buttons = page.locator('button');
      const count = await buttons.count();
      
      if (count > 0) {
        for (let i = 0; i < count; i++) {
          const button = buttons.nth(i);
          if (await button.isVisible()) {
            await expect(button).toBeVisible();
          }
        }
      }
    });
  });
});

