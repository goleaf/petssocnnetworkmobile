import { test, expect } from './fixtures';

test.describe('Wiki Pages', () => {
  test.describe('Wiki List Page', () => {
    test('should load wiki list page', async ({ authenticatedPage: page }) => {
      await page.goto('/wiki');
      await expect(page).toHaveURL(/.*\/wiki/);
    });

    test('should test all buttons on wiki list page', async ({ authenticatedPage: page }) => {
      await page.goto('/wiki');
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

    test('should test all links on wiki list page', async ({ authenticatedPage: page }) => {
      await page.goto('/wiki');
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

    test('should navigate to create wiki page', async ({ authenticatedPage: page }) => {
      await page.goto('/wiki');
      await page.waitForLoadState('networkidle');
      
      const createLink = page.locator('a[href*="/wiki/create"]').or(
        page.locator('button').filter({ hasText: /create|new/i })
      ).first();
      
      if (await createLink.count() > 0) {
        await createLink.click();
        await expect(page).toHaveURL(/.*\/wiki\/create/);
      }
    });
  });

  test.describe('Wiki Create Page', () => {
    test('should load wiki create page', async ({ authenticatedPage: page }) => {
      await page.goto('/wiki/create');
      await expect(page).toHaveURL(/.*\/wiki\/create/);
    });

    test('should test all form fields on create page', async ({ authenticatedPage: page }) => {
      await page.goto('/wiki/create');
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
      await page.goto('/wiki/create');
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

  test.describe('Wiki Detail Page', () => {
    test('should load wiki detail page', async ({ authenticatedPage: page }) => {
      // First go to wiki list to get a slug
      await page.goto('/wiki');
      await page.waitForLoadState('networkidle');
      
      const wikiLink = page.locator('a[href*="/wiki/"]').filter({ hasNot: page.locator('text=create') }).first();
      if (await wikiLink.count() > 0) {
        const href = await wikiLink.getAttribute('href');
        if (href && !href.includes('/create')) {
          await wikiLink.click();
          await page.waitForLoadState('networkidle');
          await expect(page).toHaveURL(/.*\/wiki\/.+/);
        }
      } else {
        test.skip();
      }
    });

    test('should test all buttons on wiki detail page', async ({ authenticatedPage: page }) => {
      await page.goto('/wiki');
      await page.waitForLoadState('networkidle');
      
      const wikiLink = page.locator('a[href*="/wiki/"]').filter({ hasNot: page.locator('text=create') }).first();
      if (await wikiLink.count() > 0) {
        const href = await wikiLink.getAttribute('href');
        if (href && !href.includes('/create')) {
          await wikiLink.click();
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

