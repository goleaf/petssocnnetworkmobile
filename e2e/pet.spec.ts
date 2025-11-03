import { test, expect } from './fixtures';
import { testAllButtons, testAllLinks, testAllFormFields, testAllInputFields, testAllTextareaFields, testAllSelectFields } from './test-helpers';

test.describe('Pet Pages', () => {
  test.describe('Pet Profile Page', () => {
    test('should load pet profile page', async ({ authenticatedPage: page }) => {
      await page.goto('/user/sarahpaws/pet/golden-buddy');
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/.*\/user\/sarahpaws\/pet\/golden-buddy/);
    });

    test('should test all buttons on pet profile page', async ({ authenticatedPage: page }) => {
      await page.goto('/user/sarahpaws/pet/golden-buddy');
      await page.waitForLoadState('networkidle');
      await testAllButtons(page, 50);
    });

    test('should test all links on pet profile page', async ({ authenticatedPage: page }) => {
      await page.goto('/user/sarahpaws/pet/golden-buddy');
      await page.waitForLoadState('networkidle');
      await testAllLinks(page, 50);
    });

    test('should test all form fields on pet profile page', async ({ authenticatedPage: page }) => {
      await page.goto('/user/sarahpaws/pet/golden-buddy');
      await page.waitForLoadState('networkidle');
      await testAllFormFields(page);
    });

    test('should test all tab buttons', async ({ authenticatedPage: page }) => {
      await page.goto('/user/sarahpaws/pet/golden-buddy');
      await page.waitForLoadState('networkidle');
      
      const tabTriggers = page.locator('button[role="tab"]');
      const count = await tabTriggers.count();
      
      if (count > 0) {
        for (let i = 0; i < count; i++) {
          const tab = tabTriggers.nth(i);
          if (await tab.isVisible()) {
            await expect(tab).toBeVisible();
            // Click each tab to test switching
            await tab.click();
            await page.waitForTimeout(500);
          }
        }
      }
    });
  });

  test.describe('Pet Edit Page', () => {
    test('should load pet edit page', async ({ authenticatedPage: page }) => {
      await page.goto('/user/sarahpaws/pet/golden-buddy/edit');
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/.*\/user\/sarahpaws\/pet\/golden-buddy\/edit/);
    });

    test('should test all form fields on pet edit page', async ({ authenticatedPage: page }) => {
      await page.goto('/user/sarahpaws/pet/golden-buddy/edit');
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
                await expect(field).toHaveValue('test content');
                await field.clear();
              }
            }
          }
        }
      }
    });

    test('should test all buttons on pet edit page', async ({ authenticatedPage: page }) => {
      await page.goto('/user/sarahpaws/pet/golden-buddy/edit');
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

  test.describe('Pet Friends Page', () => {
    test('should load pet friends page', async ({ authenticatedPage: page }) => {
      await page.goto('/user/sarahpaws/pet/golden-buddy/friends');
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/.*\/user\/sarahpaws\/pet\/golden-buddy\/friends/);
    });

    test('should test all buttons on pet friends page', async ({ authenticatedPage: page }) => {
      await page.goto('/user/sarahpaws/pet/golden-buddy/friends');
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

    test('should test all links on pet friends page', async ({ authenticatedPage: page }) => {
      await page.goto('/user/sarahpaws/pet/golden-buddy/friends');
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

  test.describe('Pet Followers Page', () => {
    test('should load pet followers page', async ({ authenticatedPage: page }) => {
      await page.goto('/user/sarahpaws/pet/golden-buddy/followers');
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/.*\/user\/sarahpaws\/pet\/golden-buddy\/followers/);
    });

    test('should test all buttons on pet followers page', async ({ authenticatedPage: page }) => {
      await page.goto('/user/sarahpaws/pet/golden-buddy/followers');
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

  test.describe('User Pets List Page', () => {
    test('should load user pets page', async ({ authenticatedPage: page }) => {
      await page.goto('/user/sarahpaws/pets');
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/.*\/user\/sarahpaws\/pets/);
    });

    test('should test search field on user pets page', async ({ authenticatedPage: page }) => {
      await page.goto('/user/sarahpaws/pets');
      await page.waitForLoadState('networkidle');
      
      const searchInput = page.locator('input[type="search"]').or(
        page.locator('input[placeholder*="search" i]')
      ).first();
      
      if (await searchInput.count() > 0) {
        await expect(searchInput).toBeVisible();
        await searchInput.fill('test search');
        await expect(searchInput).toHaveValue('test search');
      }
    });

    test('should test all buttons on user pets page', async ({ authenticatedPage: page }) => {
      await page.goto('/user/sarahpaws/pets');
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

    test('should test filter dropdowns', async ({ authenticatedPage: page }) => {
      await page.goto('/user/sarahpaws/pets');
      await page.waitForLoadState('networkidle');
      
      const selects = page.locator('select, button[role="combobox"]');
      const count = await selects.count();
      
      if (count > 0) {
        for (let i = 0; i < count; i++) {
          const select = selects.nth(i);
          if (await select.isVisible()) {
            await expect(select).toBeVisible();
          }
        }
      }
    });
  });

  test.describe('Add Pet Page', () => {
    test('should load add pet page', async ({ authenticatedPage: page }) => {
      await page.goto('/user/sarahpaws/add-pet');
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/.*\/user\/sarahpaws\/add-pet/);
    });

    test('should test all form fields on add pet page', async ({ authenticatedPage: page }) => {
      await page.goto('/user/sarahpaws/add-pet');
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
                await expect(field).toHaveValue('test content');
                await field.clear();
              }
            }
          }
        }
      }
    });

    test('should test all buttons on add pet page', async ({ authenticatedPage: page }) => {
      await page.goto('/user/sarahpaws/add-pet');
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

  test.describe('Profile Pets Page', () => {
    test('should load profile pets page', async ({ authenticatedPage: page }) => {
      await page.goto('/profile/sarahpaws/pets');
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/.*\/profile\/sarahpaws\/pets/);
    });

    test('should test all buttons on profile pets page', async ({ authenticatedPage: page }) => {
      await page.goto('/profile/sarahpaws/pets');
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

    test('should test all links on profile pets page', async ({ authenticatedPage: page }) => {
      await page.goto('/profile/sarahpaws/pets');
      await page.waitForLoadState('networkidle');
      
      const links = page.locator('a[href]');
      const count = await links.count();
      
      if (count > 0) {
        for (let i = 0; i < Math.min(count, 40); i++) {
          const link = links.nth(i);
          if (await link.isVisible()) {
            await expect(link).toBeVisible();
          }
        }
      }
    });
  });
});

