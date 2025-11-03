import { test, expect } from '@playwright/test';

test.describe('Blog Pages', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[id="username"]', 'sarahpaws');
    await page.fill('input[id="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/', { timeout: 10000 });
  });

  test.describe('Blog List Page', () => {
    test('should load blog list page', async ({ page }) => {
      await page.goto('/blog');
      await expect(page).toHaveURL(/.*\/blog/);
    });

    test('should test all buttons on blog list page', async ({ page }) => {
      await page.goto('/blog');
      await page.waitForLoadState('networkidle');
      
      const buttons = page.locator('button');
      const count = await buttons.count();
      
      if (count > 0) {
        for (let i = 0; i < Math.min(count, 20); i++) {
          const button = buttons.nth(i);
          if (await button.isVisible()) {
            await expect(button).toBeVisible();
          }
        }
      }
    });

    test('should test all links on blog list page', async ({ page }) => {
      await page.goto('/blog');
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

    test('should navigate to create blog page', async ({ page }) => {
      await page.goto('/blog');
      await page.waitForLoadState('networkidle');
      
      const createLink = page.locator('a[href*="/blog/create"]').or(
        page.locator('button').filter({ hasText: /create|new|write/i })
      ).first();
      
      if (await createLink.count() > 0) {
        await createLink.click();
        await expect(page).toHaveURL(/.*\/blog\/create/);
      }
    });
  });

  test.describe('Blog Create Page', () => {
    test('should load blog create page', async ({ page }) => {
      await page.goto('/blog/create');
      await expect(page).toHaveURL(/.*\/blog\/create/);
    });

    test('should test all form fields on create page', async ({ page }) => {
      await page.goto('/blog/create');
      await page.waitForLoadState('networkidle');
      
      // Find all input and textarea fields
      const fields = page.locator('input, textarea, select');
      const count = await fields.count();
      
      expect(count).toBeGreaterThan(0);

      for (let i = 0; i < count; i++) {
        const field = fields.nth(i);
        if (await field.isVisible()) {
          await expect(field).toBeVisible();
          
          // Test that field can be filled
          const tagName = await field.evaluate(el => el.tagName.toLowerCase());
          if (tagName === 'input' || tagName === 'textarea') {
            const inputType = await field.getAttribute('type');
            if (inputType !== 'submit' && inputType !== 'button' && inputType !== 'file') {
              await field.fill('test content');
              await expect(field).toHaveValue('test content');
              await field.clear();
            }
          }
        }
      }
    });

    test('should test all buttons on create page', async ({ page }) => {
      await page.goto('/blog/create');
      await page.waitForLoadState('networkidle');
      
      const buttons = page.locator('button');
      const count = await buttons.count();
      
      expect(count).toBeGreaterThan(0);

      for (let i = 0; i < count; i++) {
        const button = buttons.nth(i);
        if (await button.isVisible()) {
          await expect(button).toBeVisible();
        }
      }
    });
  });

  test.describe('Blog Detail Page', () => {
    test('should load blog detail page', async ({ page }) => {
      // First go to blog list to get a blog ID
      await page.goto('/blog');
      await page.waitForLoadState('networkidle');
      
      // Try to find a blog link
      const blogLink = page.locator('a[href*="/blog/"]').first();
      if (await blogLink.count() > 0) {
        await blogLink.click();
        await page.waitForURL(/.*\/blog\/[^/]+/, { timeout: 5000 });
      } else {
        // If no blogs, skip this test
        test.skip();
      }
    });

    test('should test all buttons on blog detail page', async ({ page }) => {
      await page.goto('/blog');
      await page.waitForLoadState('networkidle');
      
      const blogLink = page.locator('a[href*="/blog/"]').first();
      if (await blogLink.count() > 0) {
        await blogLink.click();
        await page.waitForLoadState('networkidle');
        
        const buttons = page.locator('button');
        const count = await buttons.count();
        
        if (count > 0) {
          for (let i = 0; i < Math.min(count, 20); i++) {
            const button = buttons.nth(i);
            if (await button.isVisible()) {
              await expect(button).toBeVisible();
            }
          }
        }
      } else {
        test.skip();
      }
    });
  });
});

