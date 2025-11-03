import { test, expect } from './fixtures';
import { testAllButtons, testAllLinks, testAllFormFields } from './test-helpers';

/**
 * E2E tests for all settings pages
 * Tests all buttons, fields, and links
 */

test.describe('Settings Pages', () => {
  test('should test main settings page', async ({ authenticatedPage: page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
    await testAllButtons(page, 50);
    await testAllFormFields(page);
    await testAllLinks(page, 50);
  });

  test('should test settings notifications page', async ({ authenticatedPage: page }) => {
    await page.goto('/settings/notifications');
    await page.waitForLoadState('networkidle');
    await testAllButtons(page, 50);
    await testAllFormFields(page);
  });

  test('should test settings privacy page', async ({ authenticatedPage: page }) => {
    await page.goto('/settings/privacy');
    await page.waitForLoadState('networkidle');
    await testAllButtons(page, 50);
    await testAllFormFields(page);
  });

  test('should test settings integrations page', async ({ authenticatedPage: page }) => {
    await page.goto('/settings/integrations');
    await page.waitForLoadState('networkidle');
    await testAllButtons(page, 50);
    await testAllFormFields(page);
  });
});


