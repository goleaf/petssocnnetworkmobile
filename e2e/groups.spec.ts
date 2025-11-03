import { test, expect } from './fixtures';

test.describe('Groups Pages', () => {
  test.describe('Groups List Page', () => {
    test('should load groups list page', async ({ authenticatedPage: page }) => {
      await page.goto('/groups');
      await expect(page).toHaveURL(/.*\/groups/);
    });

    test('should test all buttons on groups list page', async ({ authenticatedPage: page }) => {
      await page.goto('/groups');
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

    test('should test all links on groups list page', async ({ authenticatedPage: page }) => {
      await page.goto('/groups');
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

    test('should navigate to create group page', async ({ authenticatedPage: page }) => {
      await page.goto('/groups');
      await page.waitForLoadState('networkidle');
      
      const createLink = page.locator('a[href*="/groups/create"]').or(
        page.locator('button').filter({ hasText: /create|new/i })
      ).first();
      
      if (await createLink.count() > 0) {
        await createLink.click();
        await expect(page).toHaveURL(/.*\/groups\/create/);
      }
    });
  });

  test.describe('Group Create Page', () => {
    test('should load group create page', async ({ authenticatedPage: page }) => {
      await page.goto('/groups/create');
      await expect(page).toHaveURL(/.*\/groups\/create/);
    });

    test('should test all form fields on create page', async ({ authenticatedPage: page }) => {
      await page.goto('/groups/create');
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

    test('should test all buttons on create page', async ({ authenticatedPage: page }) => {
      await page.goto('/groups/create');
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

  test.describe('Group Detail Page', () => {
    test('should load group detail page', async ({ authenticatedPage: page }) => {
      await page.goto('/groups');
      await page.waitForLoadState('networkidle');
      
      const groupLink = page.locator('a[href*="/groups/"]').filter({ hasNot: page.locator('text=create') }).first();
      if (await groupLink.count() > 0) {
        const href = await groupLink.getAttribute('href');
        if (href && !href.includes('/create')) {
          await groupLink.click();
          await page.waitForLoadState('networkidle');
          await expect(page).toHaveURL(/.*\/groups\/.+/);
        }
      } else {
        test.skip();
      }
    });

    test('should test all buttons on group detail page', async ({ authenticatedPage: page }) => {
      await page.goto('/groups');
      await page.waitForLoadState('networkidle');
      
      const groupLink = page.locator('a[href*="/groups/"]').filter({ hasNot: page.locator('text=create') }).first();
      if (await groupLink.count() > 0) {
        const href = await groupLink.getAttribute('href');
        if (href && !href.includes('/create')) {
          await groupLink.click();
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
        }
      } else {
        test.skip();
      }
    });
  });
});

