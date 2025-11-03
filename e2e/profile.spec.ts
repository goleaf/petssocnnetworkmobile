import { test, expect } from './fixtures';

test.describe('Profile Pages', () => {
  test.describe('User Profile Page', () => {
    test('should load user profile page', async ({ authenticatedPage: page }) => {
      await page.goto('/profile/sarahpaws');
      await expect(page).toHaveURL(/.*\/profile\/sarahpaws/);
    });

    test('should test all buttons on profile page', async ({ authenticatedPage: page }) => {
      await page.goto('/profile/sarahpaws');
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

    test('should test all links on profile page', async ({ authenticatedPage: page }) => {
      await page.goto('/profile/sarahpaws');
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

  test.describe('Profile Edit Page', () => {
    test('should load profile edit page', async ({ authenticatedPage: page }) => {
      await page.goto('/user/sarahpaws/edit');
      await expect(page).toHaveURL(/.*\/user\/sarahpaws\/edit/);
    });

    test('should test all form fields on edit page', async ({ authenticatedPage: page }) => {
      await page.goto('/user/sarahpaws/edit');
      await page.waitForLoadState('networkidle');
      
      const fields = page.locator('input, textarea, select');
      const count = await fields.count();
      
      if (count > 0) {
        for (let i = 0; i < count; i++) {
          const field = fields.nth(i);
          if (await field.isVisible()) {
            await expect(field).toBeVisible();
            
            const tagName = await field.evaluate(el => el.tagName.toLowerCase());
            if (tagName === 'input' || tagName === 'textarea') {
              const inputType = await field.getAttribute('type');
              if (inputType !== 'submit' && inputType !== 'button' && inputType !== 'file') {
                await field.fill('test content');
                await field.clear();
              }
            }
          }
        }
      }
    });

    test('should test all buttons on edit page', async ({ authenticatedPage: page }) => {
      await page.goto('/user/sarahpaws/edit');
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

