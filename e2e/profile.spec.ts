import { test, expect } from './fixtures';
import { testAllButtons, testAllLinks, testAllFormFields, testAllInputFields, testAllTextareaFields, testAllSelectFields } from './test-helpers';

test.describe('Profile Pages', () => {
  test.describe('User Profile Page', () => {
    test('should load user profile page', async ({ authenticatedPage: page }) => {
      await page.goto('/profile/sarahpaws');
      await expect(page).toHaveURL(/.*\/profile\/sarahpaws/);
    });

    test('should test all buttons on profile page', async ({ authenticatedPage: page }) => {
      await page.goto('/profile/sarahpaws');
      await page.waitForLoadState('networkidle');
      await testAllButtons(page, 50);
    });

    test('should test all links on profile page', async ({ authenticatedPage: page }) => {
      await page.goto('/profile/sarahpaws');
      await page.waitForLoadState('networkidle');
      await testAllLinks(page, 50);
    });

    test('should test all input fields on profile page', async ({ authenticatedPage: page }) => {
      await page.goto('/profile/sarahpaws');
      await page.waitForLoadState('networkidle');
      await testAllInputFields(page);
    });

    test('should test all textarea fields on profile page', async ({ authenticatedPage: page }) => {
      await page.goto('/profile/sarahpaws');
      await page.waitForLoadState('networkidle');
      await testAllTextareaFields(page);
    });

    test('should test all select fields on profile page', async ({ authenticatedPage: page }) => {
      await page.goto('/profile/sarahpaws');
      await page.waitForLoadState('networkidle');
      await testAllSelectFields(page);
    });
  });

  test.describe('User Page (Alternative Route)', () => {
    test('should load user page', async ({ authenticatedPage: page }) => {
      await page.goto('/user/sarahpaws');
      await expect(page).toHaveURL(/.*\/user\/sarahpaws/);
    });

    test('should test all buttons on user page', async ({ authenticatedPage: page }) => {
      await page.goto('/user/sarahpaws');
      await page.waitForLoadState('networkidle');
      await testAllButtons(page, 50);
    });

    test('should test all form fields on user page', async ({ authenticatedPage: page }) => {
      await page.goto('/user/sarahpaws');
      await page.waitForLoadState('networkidle');
      await testAllFormFields(page);
    });
  });

  test.describe('Profile Edit Page', () => {
    test('should load profile edit page', async ({ authenticatedPage: page }) => {
      await page.goto('/user/sarahpaws/edit');
      await expect(page).toHaveURL(/.*\/user\/sarahpaws\/edit/);
    });

    test('should test all form fields on edit page', async ({ authenticatedPage: page }) => {
      await page.goto('/user/sarahpaws/edit');
      await page.waitForLoadState('networkidle');
      await testAllFormFields(page);
    });

    test('should test all buttons on edit page', async ({ authenticatedPage: page }) => {
      await page.goto('/user/sarahpaws/edit');
      await page.waitForLoadState('networkidle');
      await testAllButtons(page, 50);
    });

    test('should test all input fields on edit page', async ({ authenticatedPage: page }) => {
      await page.goto('/user/sarahpaws/edit');
      await page.waitForLoadState('networkidle');
      await testAllInputFields(page);
    });

    test('should test all textarea fields on edit page', async ({ authenticatedPage: page }) => {
      await page.goto('/user/sarahpaws/edit');
      await page.waitForLoadState('networkidle');
      await testAllTextareaFields(page);
    });
  });

  test.describe('User Posts Page', () => {
    test('should load user posts page', async ({ authenticatedPage: page }) => {
      await page.goto('/user/sarahpaws/posts');
      await expect(page).toHaveURL(/.*\/user\/sarahpaws\/posts/);
    });

    test('should test all buttons on user posts page', async ({ authenticatedPage: page }) => {
      await page.goto('/user/sarahpaws/posts');
      await page.waitForLoadState('networkidle');
      await testAllButtons(page, 50);
    });

    test('should test all links on user posts page', async ({ authenticatedPage: page }) => {
      await page.goto('/user/sarahpaws/posts');
      await page.waitForLoadState('networkidle');
      await testAllLinks(page, 50);
    });
  });

  test.describe('User Pets Page', () => {
    test('should load user pets page', async ({ authenticatedPage: page }) => {
      await page.goto('/user/sarahpaws/pets');
      await expect(page).toHaveURL(/.*\/user\/sarahpaws\/pets/);
    });

    test('should test all buttons on user pets page', async ({ authenticatedPage: page }) => {
      await page.goto('/user/sarahpaws/pets');
      await page.waitForLoadState('networkidle');
      await testAllButtons(page, 50);
    });

    test('should test all links on user pets page', async ({ authenticatedPage: page }) => {
      await page.goto('/user/sarahpaws/pets');
      await page.waitForLoadState('networkidle');
      await testAllLinks(page, 50);
    });
  });

  test.describe('User Followers Page', () => {
    test('should load user followers page', async ({ authenticatedPage: page }) => {
      await page.goto('/user/sarahpaws/followers');
      await expect(page).toHaveURL(/.*\/user\/sarahpaws\/followers/);
    });

    test('should test all buttons on user followers page', async ({ authenticatedPage: page }) => {
      await page.goto('/user/sarahpaws/followers');
      await page.waitForLoadState('networkidle');
      await testAllButtons(page, 50);
    });

    test('should test all links on user followers page', async ({ authenticatedPage: page }) => {
      await page.goto('/user/sarahpaws/followers');
      await page.waitForLoadState('networkidle');
      await testAllLinks(page, 50);
    });
  });

  test.describe('User Following Page', () => {
    test('should load user following page', async ({ authenticatedPage: page }) => {
      await page.goto('/user/sarahpaws/following');
      await expect(page).toHaveURL(/.*\/user\/sarahpaws\/following/);
    });

    test('should test all buttons on user following page', async ({ authenticatedPage: page }) => {
      await page.goto('/user/sarahpaws/following');
      await page.waitForLoadState('networkidle');
      await testAllButtons(page, 50);
    });

    test('should test all links on user following page', async ({ authenticatedPage: page }) => {
      await page.goto('/user/sarahpaws/following');
      await page.waitForLoadState('networkidle');
      await testAllLinks(page, 50);
    });
  });

  test.describe('Profile Pets Page', () => {
    test('should load profile pets page', async ({ authenticatedPage: page }) => {
      await page.goto('/profile/sarahpaws/pets');
      await expect(page).toHaveURL(/.*\/profile\/sarahpaws\/pets/);
    });

    test('should test all buttons on profile pets page', async ({ authenticatedPage: page }) => {
      await page.goto('/profile/sarahpaws/pets');
      await page.waitForLoadState('networkidle');
      await testAllButtons(page, 50);
    });

    test('should test all links on profile pets page', async ({ authenticatedPage: page }) => {
      await page.goto('/profile/sarahpaws/pets');
      await page.waitForLoadState('networkidle');
      await testAllLinks(page, 50);
    });
  });

  test.describe('Profile Add Pet Page', () => {
    test('should load profile add pet page', async ({ authenticatedPage: page }) => {
      await page.goto('/profile/sarahpaws/add-pet');
      await expect(page).toHaveURL(/.*\/profile\/sarahpaws\/add-pet/);
    });

    test('should test all form fields on add pet page', async ({ authenticatedPage: page }) => {
      await page.goto('/profile/sarahpaws/add-pet');
      await page.waitForLoadState('networkidle');
      await testAllFormFields(page);
    });

    test('should test all buttons on add pet page', async ({ authenticatedPage: page }) => {
      await page.goto('/profile/sarahpaws/add-pet');
      await page.waitForLoadState('networkidle');
      await testAllButtons(page, 50);
    });
  });
});

