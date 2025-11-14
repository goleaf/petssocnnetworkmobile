import { test, expect } from './fixtures';
import { testAllButtons, testAllLinks, testAllFormFields } from './test-helpers';

/**
 * E2E tests for group sub-pages
 * Tests all buttons, fields, and links
 */

test.describe('Group Sub-Pages', () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    // Navigate to groups page and find first group
    await page.goto('/groups');
    await page.waitForLoadState('networkidle');
    
    const groupLink = page.locator('a[href*="/groups/"]').filter({ hasNot: page.locator('text=/create|Create/') }).first();
    if (await groupLink.count() > 0) {
      await groupLink.click();
      await page.waitForLoadState('networkidle');
    }
  });

  test('should test group members page', async ({ authenticatedPage: page }) => {
    await page.goto('/groups');
    await page.waitForLoadState('networkidle');
    
    const groupLink = page.locator('a[href*="/groups/"]').filter({ hasNot: page.locator('text=/create|Create/') }).first();
    if (await groupLink.count() > 0) {
      const href = await groupLink.getAttribute('href');
      if (href) {
        const slug = href.split('/groups/')[1]?.split('/')[0];
        if (slug) {
          await page.goto(`/groups/${slug}/members`);
          await page.waitForLoadState('networkidle');
          await testAllButtons(page, 50);
          await testAllLinks(page, 50);
        }
      }
    }
  });

  test('should test group settings page', async ({ authenticatedPage: page }) => {
    await page.goto('/groups');
    await page.waitForLoadState('networkidle');
    
    const groupLink = page.locator('a[href*="/groups/"]').filter({ hasNot: page.locator('text=/create|Create/') }).first();
    if (await groupLink.count() > 0) {
      const href = await groupLink.getAttribute('href');
      if (href) {
        const slug = href.split('/groups/')[1]?.split('/')[0];
        if (slug) {
          await page.goto(`/groups/${slug}/settings`);
          await page.waitForLoadState('networkidle');
          await testAllButtons(page, 50);
          await testAllFormFields(page);
        }
      }
    }
  });

  test('should test group analytics page', async ({ authenticatedPage: page }) => {
    await page.goto('/groups');
    await page.waitForLoadState('networkidle');
    
    const groupLink = page.locator('a[href*="/groups/"]').filter({ hasNot: page.locator('text=/create|Create/') }).first();
    if (await groupLink.count() > 0) {
      const href = await groupLink.getAttribute('href');
      if (href) {
        const slug = href.split('/groups/')[1]?.split('/')[0];
        if (slug) {
          await page.goto(`/groups/${slug}/analytics`);
          await page.waitForLoadState('networkidle');
          await testAllButtons(page, 50);
          await testAllFormFields(page);
        }
      }
    }
  });

  test('should test group moderation page', async ({ authenticatedPage: page }) => {
    await page.goto('/groups');
    await page.waitForLoadState('networkidle');
    
    const groupLink = page.locator('a[href*="/groups/"]').filter({ hasNot: page.locator('text=/create|Create/') }).first();
    if (await groupLink.count() > 0) {
      const href = await groupLink.getAttribute('href');
      if (href) {
        const slug = href.split('/groups/')[1]?.split('/')[0];
        if (slug) {
          await page.goto(`/groups/${slug}/moderation`);
          await page.waitForLoadState('networkidle');
          await testAllButtons(page, 50);
          await testAllFormFields(page);
        }
      }
    }
  });

  test('should test group topics page', async ({ authenticatedPage: page }) => {
    await page.goto('/groups');
    await page.waitForLoadState('networkidle');
    
    const groupLink = page.locator('a[href*="/groups/"]').filter({ hasNot: page.locator('text=/create|Create/') }).first();
    if (await groupLink.count() > 0) {
      const href = await groupLink.getAttribute('href');
      if (href) {
        const slug = href.split('/groups/')[1]?.split('/')[0];
        if (slug) {
          await page.goto(`/groups/${slug}/topics`);
          await page.waitForLoadState('networkidle');
          await testAllButtons(page, 50);
          await testAllFormFields(page);
        }
      }
    }
  });

  test('should test group topic detail page', async ({ authenticatedPage: page }) => {
    await page.goto('/groups');
    await page.waitForLoadState('networkidle');
    
    const groupLink = page.locator('a[href*="/groups/"]').filter({ hasNot: page.locator('text=/create|Create/') }).first();
    if (await groupLink.count() > 0) {
      await groupLink.click();
      await page.waitForLoadState('networkidle');
      
      const topicLink = page.locator('a[href*="/topics/"]').first();
      if (await topicLink.count() > 0) {
        await topicLink.click();
        await page.waitForLoadState('networkidle');
        await testAllButtons(page, 50);
        await testAllFormFields(page);
      }
    }
  });

  test('should test group topic edit page', async ({ authenticatedPage: page }) => {
    await page.goto('/groups');
    await page.waitForLoadState('networkidle');
    
    const groupLink = page.locator('a[href*="/groups/"]').filter({ hasNot: page.locator('text=/create|Create/') }).first();
    if (await groupLink.count() > 0) {
      await groupLink.click();
      await page.waitForLoadState('networkidle');
      
      const topicLink = page.locator('a[href*="/topics/"]').first();
      if (await topicLink.count() > 0) {
        await topicLink.click();
        await page.waitForLoadState('networkidle');
        
        const editButton = page.locator('button').filter({ hasText: /edit|Edit/i }).first();
        if (await editButton.count() > 0) {
          await editButton.click();
          await page.waitForLoadState('networkidle');
          await testAllButtons(page, 50);
          await testAllFormFields(page);
        }
      }
    }
  });

  test('should test group polls page', async ({ authenticatedPage: page }) => {
    await page.goto('/groups');
    await page.waitForLoadState('networkidle');
    
    const groupLink = page.locator('a[href*="/groups/"]').filter({ hasNot: page.locator('text=/create|Create/') }).first();
    if (await groupLink.count() > 0) {
      const href = await groupLink.getAttribute('href');
      if (href) {
        const slug = href.split('/groups/')[1]?.split('/')[0];
        if (slug) {
          await page.goto(`/groups/${slug}/polls`);
          await page.waitForLoadState('networkidle');
          await testAllButtons(page, 50);
          await testAllFormFields(page);
        }
      }
    }
  });

  test('should test group poll detail page', async ({ authenticatedPage: page }) => {
    await page.goto('/groups');
    await page.waitForLoadState('networkidle');
    
    const groupLink = page.locator('a[href*="/groups/"]').filter({ hasNot: page.locator('text=/create|Create/') }).first();
    if (await groupLink.count() > 0) {
      const href = await groupLink.getAttribute('href');
      if (href) {
        const slug = href.split('/groups/')[1]?.split('/')[0];
        if (slug) {
          await page.goto(`/groups/${slug}/polls`);
          await page.waitForLoadState('networkidle');
          
          const pollLink = page.locator('a[href*="/polls/"]').first();
          if (await pollLink.count() > 0) {
            await pollLink.click();
            await page.waitForLoadState('networkidle');
            await testAllButtons(page, 50);
            await testAllFormFields(page);
          }
        }
      }
    }
  });

  test('should test group resources create page', async ({ authenticatedPage: page }) => {
    await page.goto('/groups');
    await page.waitForLoadState('networkidle');
    
    const groupLink = page.locator('a[href*="/groups/"]').filter({ hasNot: page.locator('text=/create|Create/') }).first();
    if (await groupLink.count() > 0) {
      const href = await groupLink.getAttribute('href');
      if (href) {
        const slug = href.split('/groups/')[1]?.split('/')[0];
        if (slug) {
          await page.goto(`/groups/${slug}/resources/create`);
          await page.waitForLoadState('networkidle');
          await testAllButtons(page, 50);
          await testAllFormFields(page);
        }
      }
    }
  });

  test('should test group events create page', async ({ authenticatedPage: page }) => {
    await page.goto('/groups');
    await page.waitForLoadState('networkidle');
    
    const groupLink = page.locator('a[href*="/groups/"]').filter({ hasNot: page.locator('text=/create|Create/') }).first();
    if (await groupLink.count() > 0) {
      const href = await groupLink.getAttribute('href');
      if (href) {
        const slug = href.split('/groups/')[1]?.split('/')[0];
        if (slug) {
          await page.goto(`/groups/${slug}/events/create`);
          await page.waitForLoadState('networkidle');
          await testAllButtons(page, 50);
          await testAllFormFields(page);
        }
      }
    }
  });

  test('should test group polls create page', async ({ authenticatedPage: page }) => {
    await page.goto('/groups');
    await page.waitForLoadState('networkidle');
    
    const groupLink = page.locator('a[href*="/groups/"]').filter({ hasNot: page.locator('text=/create|Create/') }).first();
    if (await groupLink.count() > 0) {
      const href = await groupLink.getAttribute('href');
      if (href) {
        const slug = href.split('/groups/')[1]?.split('/')[0];
        if (slug) {
          await page.goto(`/groups/${slug}/polls/create`);
          await page.waitForLoadState('networkidle');
          await testAllButtons(page, 50);
          await testAllFormFields(page);
        }
      }
    }
  });

  test('should test group topics create page', async ({ authenticatedPage: page }) => {
    await page.goto('/groups');
    await page.waitForLoadState('networkidle');
    
    const groupLink = page.locator('a[href*="/groups/"]').filter({ hasNot: page.locator('text=/create|Create/') }).first();
    if (await groupLink.count() > 0) {
      const href = await groupLink.getAttribute('href');
      if (href) {
        const slug = href.split('/groups/')[1]?.split('/')[0];
        if (slug) {
          await page.goto(`/groups/${slug}/topics/create`);
          await page.waitForLoadState('networkidle');
          await testAllButtons(page, 50);
          await testAllFormFields(page);
        }
      }
    }
  });
});





  test('should test group resources create page', async ({ authenticatedPage: page }) => {
    await page.goto('/groups');
    await page.waitForLoadState('networkidle');
    
    const groupLink = page.locator('a[href*="/groups/"]').filter({ hasNot: page.locator('text=/create|Create/') }).first();
    if (await groupLink.count() > 0) {
      const href = await groupLink.getAttribute('href');
      if (href) {
        const slug = href.split('/groups/')[1]?.split('/')[0];
        if (slug) {
          await page.goto(`/groups/${slug}/resources/create`);
          await page.waitForLoadState('networkidle');
          
          // Verify page loaded successfully
          await expect(page).toHaveURL(new RegExp(`/groups/${slug}/resources/create`));
          
          // Test form fields
          await testAllFormFields(page);
          await testAllButtons(page, 50);
        }
      }
    }
  });
