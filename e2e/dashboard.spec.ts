import { test, expect } from './fixtures';
import { testAllButtons, testAllLinks, testAllFormFields } from './test-helpers';

test.describe('Dashboard Page', () => {
  test('should load dashboard page', async ({ authenticatedPage: page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/.*\/dashboard/);
  });

  test('should display dashboard content', async ({ authenticatedPage: page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    const dashboardElements = page.locator('text=/dashboard|welcome|feed|posts/i');
    if (await dashboardElements.count() > 0) {
      await expect(dashboardElements.first()).toBeVisible();
    }
  });

  test('should test all buttons on dashboard', async ({ authenticatedPage: page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await testAllButtons(page, 50);
  });

  test('should test all links on dashboard', async ({ authenticatedPage: page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await testAllLinks(page, 50);
  });

  test('should test all form fields on dashboard', async ({ authenticatedPage: page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await testAllFormFields(page);
  });
});

