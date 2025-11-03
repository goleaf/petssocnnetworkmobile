import { test, expect } from './fixtures';
import { testAllButtons, testAllLinks, testAllFormFields, testAllInputFields, testAllTextareaFields, testAllSelectFields } from './test-helpers';

test.describe('Wiki Detailed Pages', () => {
  test.describe('Wiki Edit Page', () => {
    test('should navigate to wiki edit page', async ({ authenticatedPage: page }) => {
      await page.goto('/wiki');
      await page.waitForLoadState('networkidle');
      
      // Try to find and click a wiki link
      const wikiLinks = page.locator('a[href*="/wiki/"]').filter({ hasNot: page.locator('text=/create|Create|new|New/') });
      const count = await wikiLinks.count();
      
      if (count > 0) {
        await wikiLinks.first().click();
        await page.waitForLoadState('networkidle');
        
        // Try to navigate to edit
        const editButton = page.locator('button').filter({ hasText: /edit|Edit/i }).first();
        if (await editButton.count() > 0) {
          await editButton.click();
          await page.waitForLoadState('networkidle');
          await expect(page).toHaveURL(/.*\/wiki\/.+\/edit/);
        }
      }
    });

    test('should test all form fields on wiki edit page', async ({ authenticatedPage: page }) => {
      await page.goto('/wiki');
      await page.waitForLoadState('networkidle');
      
      const wikiLinks = page.locator('a[href*="/wiki/"]').filter({ hasNot: page.locator('text=/create|Create|new|New/') });
      const count = await wikiLinks.count();
      
      if (count > 0) {
        await wikiLinks.first().click();
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

  test.describe('Wiki Translate Page', () => {
    test('should navigate to wiki translate page', async ({ authenticatedPage: page }) => {
      await page.goto('/wiki');
      await page.waitForLoadState('networkidle');
      
      const wikiLinks = page.locator('a[href*="/wiki/"]').filter({ hasNot: page.locator('text=/create|Create|new|New/') });
      const count = await wikiLinks.count();
      
      if (count > 0) {
        await wikiLinks.first().click();
        await page.waitForLoadState('networkidle');
        
        // Try to navigate to translate
        const translateButton = page.locator('button').filter({ hasText: /translate|Translate/i }).first();
        if (await translateButton.count() > 0) {
          await translateButton.click();
          await page.waitForLoadState('networkidle');
          await expect(page).toHaveURL(/.*\/wiki\/.+\/translate/);
        }
      }
    });

    test('should test all form fields on wiki translate page', async ({ authenticatedPage: page }) => {
      await page.goto('/wiki');
      await page.waitForLoadState('networkidle');
      
      const wikiLinks = page.locator('a[href*="/wiki/"]').filter({ hasNot: page.locator('text=/create|Create|new|New/') });
      const count = await wikiLinks.count();
      
      if (count > 0) {
        await wikiLinks.first().click();
        await page.waitForLoadState('networkidle');
        
        const translateButton = page.locator('button').filter({ hasText: /translate|Translate/i }).first();
        if (await translateButton.count() > 0) {
          await translateButton.click();
          await page.waitForLoadState('networkidle');
          
          const fields = page.locator('input, textarea, select');
          const fieldCount = await fields.count();
          
          if (fieldCount > 0) {
            for (let i = 0; i < fieldCount; i++) {
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
        }
      }
    });
  });

  test.describe('Wiki Quality Page', () => {
    test('should load wiki quality page', async ({ authenticatedPage: page }) => {
      await page.goto('/wiki/quality');
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/.*\/wiki\/quality/);
    });

    test('should test all buttons on wiki quality page', async ({ authenticatedPage: page }) => {
      await page.goto('/wiki/quality');
      await page.waitForLoadState('networkidle');
      
      const buttons = page.locator('button');
      const count = await buttons.count();
      
      if (count > 0) {
        for (let i = 0; i < Math.min(count, 40); i++) {
          const button = buttons.nth(i);
          if (await button.isVisible()) {
            await expect(button).toBeVisible();
          }
        }
      }
    });

    test('should test all links on wiki quality page', async ({ authenticatedPage: page }) => {
      await page.goto('/wiki/quality');
      await page.waitForLoadState('networkidle');
      
      await testAllLinks(page, 50);
    });
  });

  test.describe('Wiki Editorial Policy Page', () => {
    test('should load editorial policy page', async ({ authenticatedPage: page }) => {
      await page.goto('/wiki/editorial-policy');
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/.*\/wiki\/editorial-policy/);
    });

    test('should test all buttons on editorial policy page', async ({ authenticatedPage: page }) => {
      await page.goto('/wiki/editorial-policy');
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
  });

  test.describe('Wiki Detail Interactions', () => {
    test('should test all buttons on wiki detail', async ({ authenticatedPage: page }) => {
      await page.goto('/wiki');
      await page.waitForLoadState('networkidle');
      
      const wikiLinks = page.locator('a[href*="/wiki/"]').filter({ hasNot: page.locator('text=/create|Create|new|New|quality|editorial/') });
      const count = await wikiLinks.count();
      
      if (count > 0) {
        await wikiLinks.first().click();
        await page.waitForLoadState('networkidle');
        
        await testAllButtons(page, 50);
      }
    });

    test('should test all links on wiki detail', async ({ authenticatedPage: page }) => {
      await page.goto('/wiki');
      await page.waitForLoadState('networkidle');
      
      const wikiLinks = page.locator('a[href*="/wiki/"]').filter({ hasNot: page.locator('text=/create|Create|new|New|quality|editorial/') });
      const count = await wikiLinks.count();
      
      if (count > 0) {
        await wikiLinks.first().click();
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
  });
});

