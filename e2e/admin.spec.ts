import { test, expect } from './fixtures';
import { testAllButtons, testAllLinks, testAllFormFields, testAllInputFields, testAllTextareaFields, testAllSelectFields } from './test-helpers';

test.describe('Admin Pages', () => {
  test.describe('Admin Dashboard', () => {
    test('should load admin dashboard', async ({ authenticatedPage: page }) => {
      await page.goto('/admin/dashboard');
      await expect(page).toHaveURL(/.*\/admin\/dashboard/);
    });

    test('should test all buttons on admin dashboard', async ({ authenticatedPage: page }) => {
      await page.goto('/admin/dashboard');
      await page.waitForLoadState('networkidle');
      await testAllButtons(page, 50);
    });

    test('should test all links on admin dashboard', async ({ authenticatedPage: page }) => {
      await page.goto('/admin/dashboard');
      await page.waitForLoadState('networkidle');
      await testAllLinks(page, 50);
    });

    test('should test all form fields on admin dashboard', async ({ authenticatedPage: page }) => {
      await page.goto('/admin/dashboard');
      await page.waitForLoadState('networkidle');
      await testAllFormFields(page);
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
      await testAllButtons(page, 50);
    });

    test('should test all links on moderation page', async ({ authenticatedPage: page }) => {
      await page.goto('/admin/moderation');
      await page.waitForLoadState('networkidle');
      await testAllLinks(page, 50);
    });

    test('should test all form fields on moderation page', async ({ authenticatedPage: page }) => {
      await page.goto('/admin/moderation');
      await page.waitForLoadState('networkidle');
      await testAllFormFields(page);
    });

    test('should test all input fields on moderation page', async ({ authenticatedPage: page }) => {
      await page.goto('/admin/moderation');
      await page.waitForLoadState('networkidle');
      await testAllInputFields(page);
    });

    test('should test all textarea fields on moderation page', async ({ authenticatedPage: page }) => {
      await page.goto('/admin/moderation');
      await page.waitForLoadState('networkidle');
      await testAllTextareaFields(page);
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
      await testAllButtons(page, 50);
    });

    test('should test all links on analytics page', async ({ authenticatedPage: page }) => {
      await page.goto('/admin/analytics');
      await page.waitForLoadState('networkidle');
      await testAllLinks(page, 50);
    });

    test('should test all form fields on analytics page', async ({ authenticatedPage: page }) => {
      await page.goto('/admin/analytics');
      await page.waitForLoadState('networkidle');
      await testAllFormFields(page);
    });
  });
});

