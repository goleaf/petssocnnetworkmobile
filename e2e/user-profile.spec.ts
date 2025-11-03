import { test, expect } from './fixtures';
import { testAllButtons, testAllLinks, testAllFormFields, testAllInputFields, testAllTextareaFields, testAllSelectFields } from './test-helpers';

test.describe('User Profile Pages', () => {
  test.describe('User Profile View Page', () => {
    test('should load user profile page', async ({ authenticatedPage: page }) => {
      await page.goto('/user/sarahpaws');
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/.*\/user\/sarahpaws/);
    });

    test('should test all buttons on user profile page', async ({ authenticatedPage: page }) => {
      await page.goto('/user/sarahpaws');
      await page.waitForLoadState('networkidle');
      await testAllButtons(page, 50);
    });

    test('should test all links on user profile page', async ({ authenticatedPage: page }) => {
      await page.goto('/user/sarahpaws');
      await page.waitForLoadState('networkidle');
      await testAllLinks(page, 50);
    });

    test('should test all form fields on user profile page', async ({ authenticatedPage: page }) => {
      await page.goto('/user/sarahpaws');
      await page.waitForLoadState('networkidle');
      await testAllFormFields(page);
    });

    test('should test tab navigation', async ({ authenticatedPage: page }) => {
      await page.goto('/user/sarahpaws');
      await page.waitForLoadState('networkidle');
      
      const tabTriggers = page.locator('button[role="tab"]');
      const count = await tabTriggers.count();
      
      if (count > 0) {
        for (let i = 0; i < count; i++) {
          const tab = tabTriggers.nth(i);
          if (await tab.isVisible()) {
            await expect(tab).toBeVisible();
            await tab.click();
            await page.waitForTimeout(500);
          }
        }
      }
    });
  });

  test.describe('User Profile Edit Page', () => {
    test('should load user edit page', async ({ authenticatedPage: page }) => {
      await page.goto('/user/sarahpaws/edit');
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/.*\/user\/sarahpaws\/edit/);
    });

    test('should test all form fields on user edit page', async ({ authenticatedPage: page }) => {
      await page.goto('/user/sarahpaws/edit');
      await page.waitForLoadState('networkidle');
      await testAllFormFields(page);
    });

    test('should test all buttons on user edit page', async ({ authenticatedPage: page }) => {
      await page.goto('/user/sarahpaws/edit');
      await page.waitForLoadState('networkidle');
      await testAllButtons(page, 50);
    });

    test('should test all input fields on user edit page', async ({ authenticatedPage: page }) => {
      await page.goto('/user/sarahpaws/edit');
      await page.waitForLoadState('networkidle');
      await testAllInputFields(page);
    });

    test('should test all textarea fields on user edit page', async ({ authenticatedPage: page }) => {
      await page.goto('/user/sarahpaws/edit');
      await page.waitForLoadState('networkidle');
      await testAllTextareaFields(page);
    });
  });

  test.describe('User Followers Page', () => {
    test('should load user followers page', async ({ authenticatedPage: page }) => {
      await page.goto('/user/sarahpaws/followers');
      await page.waitForLoadState('networkidle');
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

    test('should test all form fields on user followers page', async ({ authenticatedPage: page }) => {
      await page.goto('/user/sarahpaws/followers');
      await page.waitForLoadState('networkidle');
      await testAllFormFields(page);
    });
  });

  test.describe('User Following Page', () => {
    test('should load user following page', async ({ authenticatedPage: page }) => {
      await page.goto('/user/sarahpaws/following');
      await page.waitForLoadState('networkidle');
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

    test('should test all form fields on user following page', async ({ authenticatedPage: page }) => {
      await page.goto('/user/sarahpaws/following');
      await page.waitForLoadState('networkidle');
      await testAllFormFields(page);
    });
  });

  test.describe('User Posts Page', () => {
    test('should load user posts page', async ({ authenticatedPage: page }) => {
      await page.goto('/user/sarahpaws/posts');
      await page.waitForLoadState('networkidle');
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

    test('should test all form fields on user posts page', async ({ authenticatedPage: page }) => {
      await page.goto('/user/sarahpaws/posts');
      await page.waitForLoadState('networkidle');
      await testAllFormFields(page);
    });
  });

  test.describe('Profile View Page', () => {
    test('should load profile view page', async ({ authenticatedPage: page }) => {
      await page.goto('/profile/sarahpaws');
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/.*\/profile\/sarahpaws/);
    });

    test('should test all buttons on profile view page', async ({ authenticatedPage: page }) => {
      await page.goto('/profile/sarahpaws');
      await page.waitForLoadState('networkidle');
      await testAllButtons(page, 50);
    });

    test('should test all links on profile view page', async ({ authenticatedPage: page }) => {
      await page.goto('/profile/sarahpaws');
      await page.waitForLoadState('networkidle');
      await testAllLinks(page, 50);
    });

    test('should test all form fields on profile view page', async ({ authenticatedPage: page }) => {
      await page.goto('/profile/sarahpaws');
      await page.waitForLoadState('networkidle');
      await testAllFormFields(page);
    });

    test('should test tab navigation on profile view', async ({ authenticatedPage: page }) => {
      await page.goto('/profile/sarahpaws');
      await page.waitForLoadState('networkidle');
      
      const tabTriggers = page.locator('button[role="tab"]');
      const count = await tabTriggers.count();
      
      if (count > 0) {
        for (let i = 0; i < count; i++) {
          const tab = tabTriggers.nth(i);
          if (await tab.isVisible()) {
            await expect(tab).toBeVisible();
            await tab.click();
            await page.waitForTimeout(500);
          }
        }
      }
    });
  });
});

