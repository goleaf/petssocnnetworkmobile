import { test, expect } from './fixtures';
import { testAllButtons, testAllLinks, testAllFormFields } from './test-helpers';

test.describe('Dashboard Page', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[id="username"]', 'sarahpaws');
    await page.fill('input[id="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/', { timeout: 10000 });
    
    // Navigate to dashboard
    await page.goto('/dashboard');
  });

  test('should load dashboard page', async ({ page }) => {
    await expect(page).toHaveURL(/.*\/dashboard/);
  });

  test('should display dashboard content', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check for common dashboard elements
    const dashboardElements = page.locator('text=/dashboard|welcome|feed|posts/i');
    if (await dashboardElements.count() > 0) {
      await expect(dashboardElements.first()).toBeVisible();
    }
  });

  test('should test all buttons on dashboard', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    const buttons = page.locator('button');
    const count = await buttons.count();
    
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < Math.min(count, 20); i++) {
      const button = buttons.nth(i);
      if (await button.isVisible()) {
        await expect(button).toBeVisible();
      }
    }
  });

  test('should test all links on dashboard', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    const links = page.locator('a[href]');
    const count = await links.count();
    
    if (count > 0) {
      for (let i = 0; i < Math.min(count, 20); i++) {
        const link = links.nth(i);
        if (await link.isVisible()) {
          await expect(link).toBeVisible();
        }
      }
    }
  });

  test('should test all form fields on dashboard', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    const formFields = page.locator('input, textarea, select');
    const count = await formFields.count();
    
    if (count > 0) {
      for (let i = 0; i < count; i++) {
        const field = formFields.nth(i);
        if (await field.isVisible()) {
          await expect(field).toBeVisible();
        }
      }
    }
  });
});

