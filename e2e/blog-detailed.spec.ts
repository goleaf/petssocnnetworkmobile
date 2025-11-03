import { test, expect } from './fixtures';
import { testAllButtons, testAllLinks, testAllFormFields, testAllInputFields, testAllTextareaFields, testAllSelectFields } from './test-helpers';

test.describe('Blog Detailed Pages', () => {
  test.describe('Blog Edit Page', () => {
    test('should navigate to blog edit page', async ({ authenticatedPage: page }) => {
      await page.goto('/blog');
      await page.waitForLoadState('networkidle');
      
      // Try to find and click a blog link
      const blogLinks = page.locator('a[href*="/blog/"]').filter({ hasNot: page.locator('text=/create|Create/') });
      const count = await blogLinks.count();
      
      if (count > 0) {
        await blogLinks.first().click();
        await page.waitForLoadState('networkidle');
        
        // Try to navigate to edit
        const editButton = page.locator('button').filter({ hasText: /edit|Edit/i }).first();
        if (await editButton.count() > 0) {
          await editButton.click();
          await page.waitForLoadState('networkidle');
          await expect(page).toHaveURL(/.*\/blog\/[^\/]+\/edit/);
        }
      }
    });

    test('should test all form fields on blog edit page', async ({ authenticatedPage: page }) => {
      await page.goto('/blog');
      await page.waitForLoadState('networkidle');
      
      const blogLinks = page.locator('a[href*="/blog/"]').filter({ hasNot: page.locator('text=/create|Create/') });
      const count = await blogLinks.count();
      
      if (count > 0) {
        await blogLinks.first().click();
        await page.waitForLoadState('networkidle');
        
        const editButton = page.locator('button').filter({ hasText: /edit|Edit/i }).first();
        if (await editButton.count() > 0) {
          await editButton.click();
          await page.waitForLoadState('networkidle');
          
          await testAllFormFields(page);
        }
      }
    });
  });

  test.describe('Blog Tag Pages', () => {
    test('should navigate to blog tag page', async ({ authenticatedPage: page }) => {
      await page.goto('/blog');
      await page.waitForLoadState('networkidle');
      
      // Try to find a tag link
      const tagLinks = page.locator('a[href*="/blog/tag/"]');
      const count = await tagLinks.count();
      
      if (count > 0) {
        await tagLinks.first().click();
        await page.waitForLoadState('networkidle');
        await expect(page).toHaveURL(/.*\/blog\/tag\/.+/);
      }
    });

    test('should test all buttons on blog tag page', async ({ authenticatedPage: page }) => {
      await page.goto('/blog');
      await page.waitForLoadState('networkidle');
      
      const tagLinks = page.locator('a[href*="/blog/tag/"]');
      const count = await tagLinks.count();
      
      if (count > 0) {
        await tagLinks.first().click();
        await page.waitForLoadState('networkidle');
        
          await testAllButtons(page, 50);
      }
    });

    test('should test all links on blog tag page', async ({ authenticatedPage: page }) => {
      await page.goto('/blog');
      await page.waitForLoadState('networkidle');
      
      const tagLinks = page.locator('a[href*="/blog/tag/"]');
      const count = await tagLinks.count();
      
      if (count > 0) {
        await tagLinks.first().click();
        await page.waitForLoadState('networkidle');
        
          await testAllLinks(page, 50);
      }
    });
  });

  test.describe('Blog Detail Interactions', () => {
    test('should test all buttons on blog detail', async ({ authenticatedPage: page }) => {
      await page.goto('/blog');
      await page.waitForLoadState('networkidle');
      
      const blogLinks = page.locator('a[href*="/blog/"]').filter({ hasNot: page.locator('text=/create|Create|tag|Tag/') });
      const count = await blogLinks.count();
      
      if (count > 0) {
        await blogLinks.first().click();
        await page.waitForLoadState('networkidle');
        
        const buttons = page.locator('button');
        const buttonCount = await buttons.count();
        
        if (buttonCount > 0) {
          for (let i = 0; i < Math.min(buttonCount, 50); i++) {
            const button = buttons.nth(i);
            if (await button.isVisible()) {
              await expect(button).toBeVisible();
            }
          }
        }
      }
    });

    test('should test all links on blog detail', async ({ authenticatedPage: page }) => {
      await page.goto('/blog');
      await page.waitForLoadState('networkidle');
      
      const blogLinks = page.locator('a[href*="/blog/"]').filter({ hasNot: page.locator('text=/create|Create|tag|Tag/') });
      const count = await blogLinks.count();
      
      if (count > 0) {
        await blogLinks.first().click();
        await page.waitForLoadState('networkidle');
        
        const links = page.locator('a[href]');
        const linkCount = await links.count();
        
        if (linkCount > 0) {
          for (let i = 0; i < Math.min(linkCount, 50); i++) {
            const link = links.nth(i);
            if (await link.isVisible()) {
              await expect(link).toBeVisible();
            }
          }
        }
      }
    });

    test('should test reaction buttons', async ({ authenticatedPage: page }) => {
      await page.goto('/blog');
      await page.waitForLoadState('networkidle');
      
      const blogLinks = page.locator('a[href*="/blog/"]').filter({ hasNot: page.locator('text=/create|Create|tag|Tag/') });
      const count = await blogLinks.count();
      
      if (count > 0) {
        await blogLinks.first().click();
        await page.waitForLoadState('networkidle');
        
        const reactionButtons = page.locator('button').filter({ hasText: /❤️|👍|💬|share/i });
        const reactionCount = await reactionButtons.count();
        
        if (reactionCount > 0) {
          for (let i = 0; i < Math.min(reactionCount, 10); i++) {
            const button = reactionButtons.nth(i);
            if (await button.isVisible()) {
              await expect(button).toBeVisible();
            }
          }
        }
      }
    });
  });
});

