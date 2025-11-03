import { test, expect } from './fixtures';
import { testAllButtons, testAllLinks, testAllFormFields } from './test-helpers';

/**
 * E2E tests for user profile pages
 * Tests all buttons, fields, and links
 */

test.describe('User Profile Pages', () => {
  test('should test user profile main page', async ({ authenticatedPage: page }) => {
    await page.goto('/user/sarahpaws');
    await page.waitForLoadState('networkidle');
    await testAllButtons(page, 50);
    await testAllFormFields(page);
    await testAllLinks(page, 50);
  });

  test('should test user profile posts page', async ({ authenticatedPage: page }) => {
    await page.goto('/user/sarahpaws/posts');
    await page.waitForLoadState('networkidle');
    await testAllButtons(page, 50);
    await testAllLinks(page, 50);
  });

  test('should test user profile pets page', async ({ authenticatedPage: page }) => {
    await page.goto('/user/sarahpaws/pets');
    await page.waitForLoadState('networkidle');
    await testAllButtons(page, 50);
    await testAllLinks(page, 50);
  });

  test('should test user profile followers page', async ({ authenticatedPage: page }) => {
    await page.goto('/user/sarahpaws/followers');
    await page.waitForLoadState('networkidle');
    await testAllButtons(page, 50);
    await testAllLinks(page, 50);
  });

  test('should test user profile following page', async ({ authenticatedPage: page }) => {
    await page.goto('/user/sarahpaws/following');
    await page.waitForLoadState('networkidle');
    await testAllButtons(page, 50);
    await testAllLinks(page, 50);
  });

  test('should test user profile edit page', async ({ authenticatedPage: page }) => {
    await page.goto('/user/sarahpaws/edit');
    await page.waitForLoadState('networkidle');
    await testAllButtons(page, 50);
    await testAllFormFields(page);
  });

  test('should test user profile add-pet page', async ({ authenticatedPage: page }) => {
    await page.goto('/user/sarahpaws/add-pet');
    await page.waitForLoadState('networkidle');
    await testAllButtons(page, 50);
    await testAllFormFields(page);
  });

  test('should test user pet detail page', async ({ authenticatedPage: page }) => {
    await page.goto('/user/sarahpaws/pet/golden-buddy');
    await page.waitForLoadState('networkidle');
    await testAllButtons(page, 50);
    await testAllLinks(page, 50);
  });

  test('should test user pet edit page', async ({ authenticatedPage: page }) => {
    await page.goto('/user/sarahpaws/pet/golden-buddy/edit');
    await page.waitForLoadState('networkidle');
    await testAllButtons(page, 50);
    await testAllFormFields(page);
  });

  test('should test user pet followers page', async ({ authenticatedPage: page }) => {
    await page.goto('/user/sarahpaws/pet/golden-buddy/followers');
    await page.waitForLoadState('networkidle');
    await testAllButtons(page, 50);
    await testAllLinks(page, 50);
  });

  test('should test user pet friends page', async ({ authenticatedPage: page }) => {
    await page.goto('/user/sarahpaws/pet/golden-buddy/friends');
    await page.waitForLoadState('networkidle');
    await testAllButtons(page, 50);
    await testAllLinks(page, 50);
  });
});


