import { test, expect } from './fixtures';
import { testAllButtons, testAllLinks, testAllFormFields, testAllInputFields, testAllTextareaFields, testAllSelectFields } from './test-helpers';

/**
 * Comprehensive tests for all pages, buttons, and fields
 * This file covers pages that might not have dedicated test files
 */

test.describe('Comprehensive Page Tests', () => {
  test.describe('Pet Pages', () => {
    test('should test all buttons on pet profile page', async ({ authenticatedPage: page }) => {
      await page.goto('/user/sarahpaws/pet/golden-buddy');
      await page.waitForLoadState('networkidle');
      await testAllButtons(page, 50);
    });

    test('should test all form fields on pet profile page', async ({ authenticatedPage: page }) => {
      await page.goto('/user/sarahpaws/pet/golden-buddy');
      await page.waitForLoadState('networkidle');
      await testAllFormFields(page);
    });
  });

  test.describe('Wiki Pages', () => {
    test('should test all buttons on wiki list page', async ({ authenticatedPage: page }) => {
      await page.goto('/wiki');
      await page.waitForLoadState('networkidle');
      await testAllButtons(page, 50);
    });

    test('should test all form fields on wiki list page', async ({ authenticatedPage: page }) => {
      await page.goto('/wiki');
      await page.waitForLoadState('networkidle');
      await testAllFormFields(page);
    });

    test('should test wiki detail page buttons and fields', async ({ authenticatedPage: page }) => {
      await page.goto('/wiki');
      await page.waitForLoadState('networkidle');
      
      const wikiLink = page.locator('a[href*="/wiki/"]').filter({ hasNot: page.locator('text=/create|Create/') }).first();
      if (await wikiLink.count() > 0) {
        await wikiLink.click();
        await page.waitForLoadState('networkidle');
        await testAllButtons(page, 50);
        await testAllFormFields(page);
      }
    });

    test('should test wiki edit page buttons and fields', async ({ authenticatedPage: page }) => {
      await page.goto('/wiki');
      await page.waitForLoadState('networkidle');
      
      const wikiLink = page.locator('a[href*="/wiki/"]').filter({ hasNot: page.locator('text=/create|Create/') }).first();
      if (await wikiLink.count() > 0) {
        await wikiLink.click();
        await page.waitForLoadState('networkidle');
        
        const editButton = page.locator('button').filter({ hasText: /edit|Edit/i }).first();
        if (await editButton.count() > 0) {
          await editButton.click();
          await page.waitForLoadState('networkidle');
          await testAllButtons(page, 50);
          await testAllFormFields(page);
        }
      }
    });
  });

  test.describe('Groups Pages', () => {
    test('should test all buttons on group detail page', async ({ authenticatedPage: page }) => {
      await page.goto('/groups');
      await page.waitForLoadState('networkidle');
      
      const groupLink = page.locator('a[href*="/groups/"]').filter({ hasNot: page.locator('text=/create|Create/') }).first();
      if (await groupLink.count() > 0) {
        await groupLink.click();
        await page.waitForLoadState('networkidle');
        await testAllButtons(page, 50);
      }
    });

    test('should test all form fields on group detail page', async ({ authenticatedPage: page }) => {
      await page.goto('/groups');
      await page.waitForLoadState('networkidle');
      
      const groupLink = page.locator('a[href*="/groups/"]').filter({ hasNot: page.locator('text=/create|Create/') }).first();
      if (await groupLink.count() > 0) {
        await groupLink.click();
        await page.waitForLoadState('networkidle');
        await testAllFormFields(page);
      }
    });

    test('should test group topics page buttons and fields', async ({ authenticatedPage: page }) => {
      await page.goto('/groups');
      await page.waitForLoadState('networkidle');
      
      const groupLink = page.locator('a[href*="/groups/"]').filter({ hasNot: page.locator('text=/create|Create/') }).first();
      if (await groupLink.count() > 0) {
        await groupLink.click();
        await page.waitForLoadState('networkidle');
        
        const topicsTab = page.locator('button[role="tab"]').filter({ hasText: /topic|Topic/i }).first();
        if (await topicsTab.count() > 0) {
          await topicsTab.click();
          await page.waitForTimeout(500);
          await testAllButtons(page, 50);
          await testAllFormFields(page);
        }
      }
    });

    test('should test group polls page buttons and fields', async ({ authenticatedPage: page }) => {
      await page.goto('/groups');
      await page.waitForLoadState('networkidle');
      
      const groupLink = page.locator('a[href*="/groups/"]').filter({ hasNot: page.locator('text=/create|Create/') }).first();
      if (await groupLink.count() > 0) {
        await groupLink.click();
        await page.waitForLoadState('networkidle');
        
        const pollsTab = page.locator('button[role="tab"]').filter({ hasText: /poll|Poll/i }).first();
        if (await pollsTab.count() > 0) {
          await pollsTab.click();
          await page.waitForTimeout(500);
          await testAllButtons(page, 50);
          await testAllFormFields(page);
        }
      }
    });

    test('should test group events page buttons and fields', async ({ authenticatedPage: page }) => {
      await page.goto('/groups');
      await page.waitForLoadState('networkidle');
      
      const groupLink = page.locator('a[href*="/groups/"]').filter({ hasNot: page.locator('text=/create|Create/') }).first();
      if (await groupLink.count() > 0) {
        await groupLink.click();
        await page.waitForLoadState('networkidle');
        
        const eventsTab = page.locator('button[role="tab"]').filter({ hasText: /event|Event/i }).first();
        if (await eventsTab.count() > 0) {
          await eventsTab.click();
          await page.waitForTimeout(500);
          await testAllButtons(page, 50);
          await testAllFormFields(page);
        }
      }
    });

    test('should test group resources page buttons and fields', async ({ authenticatedPage: page }) => {
      await page.goto('/groups');
      await page.waitForLoadState('networkidle');
      
      const groupLink = page.locator('a[href*="/groups/"]').filter({ hasNot: page.locator('text=/create|Create/') }).first();
      if (await groupLink.count() > 0) {
        await groupLink.click();
        await page.waitForLoadState('networkidle');
        
        const resourcesTab = page.locator('button[role="tab"]').filter({ hasText: /resource|Resource/i }).first();
        if (await resourcesTab.count() > 0) {
          await resourcesTab.click();
          await page.waitForTimeout(500);
          await testAllButtons(page, 50);
          await testAllFormFields(page);
        }
      }
    });

    test('should test group members page buttons and fields', async ({ authenticatedPage: page }) => {
      await page.goto('/groups');
      await page.waitForLoadState('networkidle');
      
      const groupLink = page.locator('a[href*="/groups/"]').filter({ hasNot: page.locator('text=/create|Create/') }).first();
      if (await groupLink.count() > 0) {
        await groupLink.click();
        await page.waitForLoadState('networkidle');
        
        const membersTab = page.locator('button[role="tab"]').filter({ hasText: /member|Member/i }).first();
        if (await membersTab.count() > 0) {
          await membersTab.click();
          await page.waitForTimeout(500);
          await testAllButtons(page, 50);
          await testAllFormFields(page);
        }
      }
    });

    test('should test group settings page buttons and fields', async ({ authenticatedPage: page }) => {
      await page.goto('/groups');
      await page.waitForLoadState('networkidle');
      
      const groupLink = page.locator('a[href*="/groups/"]').filter({ hasNot: page.locator('text=/create|Create/') }).first();
      if (await groupLink.count() > 0) {
        await groupLink.click();
        await page.waitForLoadState('networkidle');
        
        const settingsTab = page.locator('button[role="tab"]').filter({ hasText: /setting|Setting/i }).first();
        if (await settingsTab.count() > 0) {
          await settingsTab.click();
          await page.waitForTimeout(500);
          await testAllButtons(page, 50);
          await testAllFormFields(page);
        }
      }
    });
  });

  test.describe('Search Pages', () => {
    test('should test all buttons on search page', async ({ authenticatedPage: page }) => {
      await page.goto('/search');
      await page.waitForLoadState('networkidle');
      await testAllButtons(page, 50);
    });

    test('should test all input fields on search page', async ({ authenticatedPage: page }) => {
      await page.goto('/search');
      await page.waitForLoadState('networkidle');
      await testAllInputFields(page);
    });

    test('should test all buttons on search-faceted page', async ({ authenticatedPage: page }) => {
      await page.goto('/search-faceted');
      await page.waitForLoadState('networkidle');
      await testAllButtons(page, 50);
    });

    test('should test all form fields on search-faceted page', async ({ authenticatedPage: page }) => {
      await page.goto('/search-faceted');
      await page.waitForLoadState('networkidle');
      await testAllFormFields(page);
    });
  });

  test.describe('Settings Pages', () => {
    test('should test all input fields on settings page', async ({ authenticatedPage: page }) => {
      await page.goto('/settings');
      await page.waitForLoadState('networkidle');
      await testAllInputFields(page);
    });

    test('should test all textarea fields on settings page', async ({ authenticatedPage: page }) => {
      await page.goto('/settings');
      await page.waitForLoadState('networkidle');
      await testAllTextareaFields(page);
    });

    test('should test all select fields on settings page', async ({ authenticatedPage: page }) => {
      await page.goto('/settings');
      await page.waitForLoadState('networkidle');
      await testAllSelectFields(page);
    });

    test('should test all input fields on privacy settings page', async ({ authenticatedPage: page }) => {
      await page.goto('/settings/privacy');
      await page.waitForLoadState('networkidle');
      await testAllInputFields(page);
    });

    test('should test all select fields on privacy settings page', async ({ authenticatedPage: page }) => {
      await page.goto('/settings/privacy');
      await page.waitForLoadState('networkidle');
      await testAllSelectFields(page);
    });

    test('should test all form fields on notifications settings page', async ({ authenticatedPage: page }) => {
      await page.goto('/settings/notifications');
      await page.waitForLoadState('networkidle');
      await testAllFormFields(page);
    });

    test('should test all form fields on integrations settings page', async ({ authenticatedPage: page }) => {
      await page.goto('/settings/integrations');
      await page.waitForLoadState('networkidle');
      await testAllFormFields(page);
    });
  });

  test.describe('Places Pages', () => {
    test('should test all buttons on places list page', async ({ authenticatedPage: page }) => {
      await page.goto('/places');
      await page.waitForLoadState('networkidle');
      await testAllButtons(page, 50);
    });

    test('should test all form fields on places list page', async ({ authenticatedPage: page }) => {
      await page.goto('/places');
      await page.waitForLoadState('networkidle');
      await testAllFormFields(page);
    });

    test('should test places detail page buttons and fields', async ({ authenticatedPage: page }) => {
      await page.goto('/places');
      await page.waitForLoadState('networkidle');
      
      const placeLink = page.locator('a[href*="/places/"]').filter({ hasNot: page.locator('text=/create|Create/') }).first();
      if (await placeLink.count() > 0) {
        await placeLink.click();
        await page.waitForLoadState('networkidle');
        await testAllButtons(page, 50);
        await testAllFormFields(page);
      }
    });

    test('should test places create page buttons and fields', async ({ authenticatedPage: page }) => {
      await page.goto('/places/create');
      await page.waitForLoadState('networkidle');
      await testAllButtons(page, 50);
      await testAllFormFields(page);
    });
  });

  test.describe('Products Pages', () => {
    test('should test all buttons on products list page', async ({ authenticatedPage: page }) => {
      await page.goto('/products');
      await page.waitForLoadState('networkidle');
      await testAllButtons(page, 50);
    });

    test('should test all form fields on products list page', async ({ authenticatedPage: page }) => {
      await page.goto('/products');
      await page.waitForLoadState('networkidle');
      await testAllFormFields(page);
    });

    test('should test products detail page buttons and fields', async ({ authenticatedPage: page }) => {
      await page.goto('/products');
      await page.waitForLoadState('networkidle');
      
      const productLink = page.locator('a[href*="/products/"]').filter({ hasNot: page.locator('text=/create|Create/') }).first();
      if (await productLink.count() > 0) {
        await productLink.click();
        await page.waitForLoadState('networkidle');
        await testAllButtons(page, 50);
        await testAllFormFields(page);
      }
    });
  });

  test.describe('Organizations Pages', () => {
    test('should test all buttons on organizations list page', async ({ authenticatedPage: page }) => {
      await page.goto('/organizations');
      await page.waitForLoadState('networkidle');
      await testAllButtons(page, 50);
    });

    test('should test all form fields on organizations list page', async ({ authenticatedPage: page }) => {
      await page.goto('/organizations');
      await page.waitForLoadState('networkidle');
      await testAllFormFields(page);
    });

    test('should test organizations detail page buttons and fields', async ({ authenticatedPage: page }) => {
      await page.goto('/organizations');
      await page.waitForLoadState('networkidle');
      
      const orgLink = page.locator('a[href*="/organizations/"]').filter({ hasNot: page.locator('text=/create|Create/') }).first();
      if (await orgLink.count() > 0) {
        await orgLink.click();
        await page.waitForLoadState('networkidle');
        await testAllButtons(page, 50);
        await testAllFormFields(page);
      }
    });
  });

  test.describe('Species Pages', () => {
    test('should test all buttons on species list page', async ({ authenticatedPage: page }) => {
      await page.goto('/species');
      await page.waitForLoadState('networkidle');
      await testAllButtons(page, 50);
    });

    test('should test all form fields on species list page', async ({ authenticatedPage: page }) => {
      await page.goto('/species');
      await page.waitForLoadState('networkidle');
      await testAllFormFields(page);
    });

    test('should test species detail page buttons and fields', async ({ authenticatedPage: page }) => {
      await page.goto('/species');
      await page.waitForLoadState('networkidle');
      
      const speciesLink = page.locator('a[href*="/species/"]').first();
      if (await speciesLink.count() > 0) {
        await speciesLink.click();
        await page.waitForLoadState('networkidle');
        await testAllButtons(page, 50);
        await testAllFormFields(page);
      }
    });
  });

  test.describe('Messages Pages', () => {
    test('should test all buttons on messages page', async ({ authenticatedPage: page }) => {
      await page.goto('/messages');
      await page.waitForLoadState('networkidle');
      await testAllButtons(page, 50);
    });

    test('should test all form fields on messages page', async ({ authenticatedPage: page }) => {
      await page.goto('/messages');
      await page.waitForLoadState('networkidle');
      await testAllFormFields(page);
    });

    test('should test all textarea fields on messages page', async ({ authenticatedPage: page }) => {
      await page.goto('/messages');
      await page.waitForLoadState('networkidle');
      await testAllTextareaFields(page);
    });
  });

  test.describe('Notifications Pages', () => {
    test('should test all buttons on notifications page', async ({ authenticatedPage: page }) => {
      await page.goto('/notifications');
      await page.waitForLoadState('networkidle');
      await testAllButtons(page, 50);
    });

    test('should test all form fields on notifications page', async ({ authenticatedPage: page }) => {
      await page.goto('/notifications');
      await page.waitForLoadState('networkidle');
      await testAllFormFields(page);
    });
  });

  test.describe('Home Page', () => {
    test('should test all buttons on home page (authenticated)', async ({ authenticatedPage: page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      await testAllButtons(page, 50);
    });

    test('should test all form fields on home page (authenticated)', async ({ authenticatedPage: page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      await testAllFormFields(page);
    });

    test('should test all textarea fields on home page (authenticated)', async ({ authenticatedPage: page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      await testAllTextareaFields(page);
    });
  });
});

