import { test, expect } from './fixtures';
import { testAllButtons, testAllLinks, testAllFormFields, testAllInputFields, testAllTextareaFields, testAllSelectFields } from './test-helpers';

test.describe('Settings Pages', () => {
  test.describe('Settings Main Page', () => {
    test('should load settings page', async ({ authenticatedPage: page }) => {
      await page.goto('/settings');
      await expect(page).toHaveURL(/.*\/settings/);
    });

    test('should test all buttons on settings page', async ({ authenticatedPage: page }) => {
      await page.goto('/settings');
      await page.waitForLoadState('networkidle');
      await testAllButtons(page, 50);
    });

    test('should test all links on settings page', async ({ authenticatedPage: page }) => {
      await page.goto('/settings');
      await page.waitForLoadState('networkidle');
      await testAllLinks(page, 50);
    });

    test('should test all form fields on settings page', async ({ authenticatedPage: page }) => {
      await page.goto('/settings');
      await page.waitForLoadState('networkidle');
      await testAllFormFields(page);
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
      await testAllFormFields(page);
    });

    test('should test all buttons on privacy settings', async ({ authenticatedPage: page }) => {
      await page.goto('/settings/privacy');
      await page.waitForLoadState('networkidle');
      await testAllButtons(page, 50);
    });

    test('should test all input fields on privacy settings', async ({ authenticatedPage: page }) => {
      await page.goto('/settings/privacy');
      await page.waitForLoadState('networkidle');
      await testAllInputFields(page);
    });

    test('should test all select fields on privacy settings', async ({ authenticatedPage: page }) => {
      await page.goto('/settings/privacy');
      await page.waitForLoadState('networkidle');
      await testAllSelectFields(page);
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
      await testAllFormFields(page);
    });

    test('should test all buttons on notifications settings', async ({ authenticatedPage: page }) => {
      await page.goto('/settings/notifications');
      await page.waitForLoadState('networkidle');
      await testAllButtons(page, 50);
    });

    test('should test all input fields on notifications settings', async ({ authenticatedPage: page }) => {
      await page.goto('/settings/notifications');
      await page.waitForLoadState('networkidle');
      await testAllInputFields(page);
    });

    test('should test all select fields on notifications settings', async ({ authenticatedPage: page }) => {
      await page.goto('/settings/notifications');
      await page.waitForLoadState('networkidle');
      await testAllSelectFields(page);
    });
  });

  test.describe('Integrations Settings', () => {
    test('should load integrations settings page', async ({ authenticatedPage: page }) => {
      await page.goto('/settings/integrations');
      await expect(page).toHaveURL(/.*\/settings\/integrations/);
    });

    test('should test all buttons on integrations settings', async ({ authenticatedPage: page }) => {
      await page.goto('/settings/integrations');
      await page.waitForLoadState('networkidle');
      await testAllButtons(page, 50);
    });

    test('should test all form fields on integrations settings', async ({ authenticatedPage: page }) => {
      await page.goto('/settings/integrations');
      await page.waitForLoadState('networkidle');
      await testAllFormFields(page);
    });
  });
});

