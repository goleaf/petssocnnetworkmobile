import { test as base, expect as expectBase } from '@playwright/test';

type TestFixtures = {
  authenticatedPage: any;
};

export const test = base.extend<TestFixtures>({
  authenticatedPage: async ({ page }, use) => {
    // Login
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[id="username"]', 'sarahpaws');
    await page.fill('input[id="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Wait for navigation or login success
    // Try to wait for either URL change or for an element that indicates login
    try {
      await page.waitForURL(/\/(?!login)/, { timeout: 15000 });
    } catch (e) {
      // If URL doesn't change, wait for network idle to ensure login completed
      await page.waitForLoadState('networkidle');
      // Try to navigate to home page
      await page.goto('/');
      await page.waitForLoadState('networkidle');
    }
    
    await use(page);
  },
});

export const expect = expectBase;

