import { test, expect } from './fixtures';
import { testAllButtons, testAllLinks, testAllFormFields, testAllInputFields, testAllTextareaFields, testAllSelectFields } from './test-helpers';

/**
 * Complete comprehensive tests for ALL pages
 * Ensures every page has tests for buttons and fields
 */

test.describe('Complete Page Coverage Tests', () => {
  test.describe('Feed Page', () => {
    test('should test feed page redirects or displays correctly', async ({ authenticatedPage: page }) => {
      await page.goto('/feed');
      await page.waitForLoadState('networkidle');
      // Feed redirects to home, so test home page elements
      await testAllButtons(page, 50);
      await testAllFormFields(page);
    });
  });

  test.describe('Blog Talk Page', () => {
    test('should test blog talk page buttons and fields', async ({ authenticatedPage: page }) => {
      await page.goto('/blog');
      await page.waitForLoadState('networkidle');
      
      const blogLink = page.locator('a[href*="/blog/"]').filter({ hasNot: page.locator('text=/create|Create|tag|Tag/') }).first();
      if (await blogLink.count() > 0) {
        await blogLink.click();
        await page.waitForLoadState('networkidle');
        
        // Navigate to talk page
        const talkLink = page.locator('a[href*="/talk"]').first();
        if (await talkLink.count() > 0) {
          await talkLink.click();
          await page.waitForLoadState('networkidle');
          await testAllButtons(page, 50);
          await testAllFormFields(page);
        }
      }
    });
  });

  test.describe('Article Type Pages', () => {
    test('should test article type page buttons and fields', async ({ authenticatedPage: page }) => {
      // Try to navigate to an article page if it exists
      await page.goto('/article/create');
      await page.waitForLoadState('networkidle');
      await testAllButtons(page, 50);
      await testAllFormFields(page);
    });
  });

  test.describe('Group Event Detail Pages', () => {
    test('should test group event detail page buttons and fields', async ({ authenticatedPage: page }) => {
      await page.goto('/groups');
      await page.waitForLoadState('networkidle');
      
      const groupLink = page.locator('a[href*="/groups/"]').filter({ hasNot: page.locator('text=/create|Create/') }).first();
      if (await groupLink.count() > 0) {
        await groupLink.click();
        await page.waitForLoadState('networkidle');
        
        // Navigate to events tab
        const eventsTab = page.locator('button[role="tab"], a').filter({ hasText: /event|Event/i }).first();
        if (await eventsTab.count() > 0) {
          await eventsTab.click();
          await page.waitForTimeout(500);
          
          // Try to click on an event
          const eventLink = page.locator('a[href*="/events/"]').first();
          if (await eventLink.count() > 0) {
            await eventLink.click();
            await page.waitForLoadState('networkidle');
            await testAllButtons(page, 50);
            await testAllFormFields(page);
          }
        }
      }
    });
  });

  test.describe('Group Poll Detail Pages', () => {
    test('should test group poll detail page buttons and fields', async ({ authenticatedPage: page }) => {
      await page.goto('/groups');
      await page.waitForLoadState('networkidle');
      
      const groupLink = page.locator('a[href*="/groups/"]').filter({ hasNot: page.locator('text=/create|Create/') }).first();
      if (await groupLink.count() > 0) {
        await groupLink.click();
        await page.waitForLoadState('networkidle');
        
        // Navigate to polls tab
        const pollsTab = page.locator('button[role="tab"], a').filter({ hasText: /poll|Poll/i }).first();
        if (await pollsTab.count() > 0) {
          await pollsTab.click();
          await page.waitForTimeout(500);
          
          // Try to click on a poll
          const pollLink = page.locator('a[href*="/polls/"]').first();
          if (await pollLink.count() > 0) {
            await pollLink.click();
            await page.waitForLoadState('networkidle');
            await testAllButtons(page, 50);
            await testAllFormFields(page);
          }
        }
      }
    });
  });

  test.describe('Group Topic Detail Pages', () => {
    test('should test group topic detail page buttons and fields', async ({ authenticatedPage: page }) => {
      await page.goto('/groups');
      await page.waitForLoadState('networkidle');
      
      const groupLink = page.locator('a[href*="/groups/"]').filter({ hasNot: page.locator('text=/create|Create/') }).first();
      if (await groupLink.count() > 0) {
        await groupLink.click();
        await page.waitForLoadState('networkidle');
        
        // Navigate to topics tab
        const topicsTab = page.locator('button[role="tab"], a').filter({ hasText: /topic|Topic/i }).first();
        if (await topicsTab.count() > 0) {
          await topicsTab.click();
          await page.waitForTimeout(500);
          
          // Try to click on a topic
          const topicLink = page.locator('a[href*="/topics/"]').first();
          if (await topicLink.count() > 0) {
            await topicLink.click();
            await page.waitForLoadState('networkidle');
            await testAllButtons(page, 50);
            await testAllFormFields(page);
          }
        }
      }
    });
  });

  test.describe('Admin Announcements Page', () => {
    test('should test admin announcements page buttons and fields', async ({ authenticatedPage: page }) => {
      await page.goto('/admin/announcements');
      await page.waitForLoadState('networkidle');
      await testAllButtons(page, 50);
      await testAllFormFields(page);
    });
  });

  test.describe('Admin Moderation Queue Page', () => {
    test('should test admin moderation queue page buttons and fields', async ({ authenticatedPage: page }) => {
      await page.goto('/admin/moderation-queue');
      await page.waitForLoadState('networkidle');
      await testAllButtons(page, 50);
      await testAllFormFields(page);
    });
  });

  test.describe('Admin Wiki Experts Page', () => {
    test('should test admin wiki experts page buttons and fields', async ({ authenticatedPage: page }) => {
      await page.goto('/admin/wiki/experts');
      await page.waitForLoadState('networkidle');
      await testAllButtons(page, 50);
      await testAllFormFields(page);
    });
  });

  test.describe('Admin Queue Page', () => {
    test('should test admin queue page buttons and fields', async ({ authenticatedPage: page }) => {
      await page.goto('/admin/queue');
      await page.waitForLoadState('networkidle');
      await testAllButtons(page, 50);
      await testAllFormFields(page);
    });
  });

  test.describe('Admin Moderation Reports Page', () => {
    test('should test admin moderation reports page buttons and fields', async ({ authenticatedPage: page }) => {
      await page.goto('/admin/moderation/reports');
      await page.waitForLoadState('networkidle');
      await testAllButtons(page, 50);
      await testAllFormFields(page);
    });
  });
});





