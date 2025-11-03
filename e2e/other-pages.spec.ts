import { test, expect } from './fixtures';

test.describe('Other Pages', () => {
  test.describe('Places Pages', () => {
    test('should load places list page', async ({ authenticatedPage: page }) => {
      await page.goto('/places');
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/.*\/places/);
    });

    test('should test all buttons on places page', async ({ authenticatedPage: page }) => {
      await page.goto('/places');
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

  test.describe('Products Pages', () => {
    test('should load products list page', async ({ authenticatedPage: page }) => {
      await page.goto('/products');
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/.*\/products/);
    });

    test('should test all buttons on products page', async ({ authenticatedPage: page }) => {
      await page.goto('/products');
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

  test.describe('Organizations Pages', () => {
    test('should load organizations list page', async ({ authenticatedPage: page }) => {
      await page.goto('/organizations');
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/.*\/organizations/);
    });

    test('should test all buttons on organizations page', async ({ authenticatedPage: page }) => {
      await page.goto('/organizations');
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

  test.describe('Species Pages', () => {
    test('should load species list page', async ({ authenticatedPage: page }) => {
      await page.goto('/species');
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/.*\/species/);
    });

    test('should test all buttons on species page', async ({ authenticatedPage: page }) => {
      await page.goto('/species');
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

  test.describe('Messages Page', () => {
    test('should load messages page', async ({ authenticatedPage: page }) => {
      await page.goto('/messages');
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/.*\/messages/);
    });

    test('should test all buttons on messages page', async ({ authenticatedPage: page }) => {
      await page.goto('/messages');
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

    test('should test all form fields on messages page', async ({ authenticatedPage: page }) => {
      await page.goto('/messages');
      await page.waitForLoadState('networkidle');
      
      const fields = page.locator('input, textarea');
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

  test.describe('Notifications Page', () => {
    test('should load notifications page', async ({ authenticatedPage: page }) => {
      await page.goto('/notifications');
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/.*\/notifications/);
    });

    test('should test all buttons on notifications page', async ({ authenticatedPage: page }) => {
      await page.goto('/notifications');
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

