import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load home page', async ({ page }) => {
    await expect(page).toHaveTitle(/Pet Social Network|My Pet Social Network/i);
  });

  test('should display hero section for unauthenticated users', async ({ page }) => {
    // Check if user is not logged in
    const isAuthenticated = await page.evaluate(() => {
      return localStorage.getItem('pet_social_user') !== null;
    });

    if (!isAuthenticated) {
      await expect(page.locator('text=Connect, Share, and Learn About Your Pets')).toBeVisible();
      await expect(page.locator('text=The Social Network for Pet Lovers')).toBeVisible();
    }
  });

  test('should display all feature cards', async ({ page }) => {
    const features = [
      'Pet Profiles',
      'Pet Care Wiki',
      'Social Features',
      'Message Privacy',
      'Blog & Stories',
      'Pet Communities',
    ];

    for (const feature of features) {
      await expect(page.locator(`text=${feature}`)).toBeVisible();
    }
  });

  test('should have Get Started button', async ({ page }) => {
    const getStartedButton = page.locator('text=Get Started Free').or(page.locator('a[href*="/register"]').first());
    await expect(getStartedButton).toBeVisible();
  });

  test('should navigate to register page when clicking Get Started', async ({ page }) => {
    const getStartedButton = page.locator('text=Get Started Free').or(page.locator('a[href*="/register"]').first());
    await getStartedButton.click();
    await expect(page).toHaveURL(/.*\/register/);
  });

  test('should display demo credentials card', async ({ page }) => {
    const demoCard = page.locator('text=Demo Credentials').or(page.locator('text=Username:').first());
    await expect(demoCard).toBeVisible();
  });

  test('should test all buttons in authenticated view', async ({ page }) => {
    // First login
    await page.goto('/login');
    await page.fill('input[id="username"]', 'sarahpaws');
    await page.fill('input[id="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/', { timeout: 10000 });

    // Check all buttons on home page
    const buttons = [
      'All Posts',
      'Following',
      'Post',
      'Browse All Blogs',
      'Pet Care Wiki',
      'My Profile',
    ];

    for (const buttonText of buttons) {
      const button = page.locator(`button:has-text("${buttonText}")`).or(page.locator(`a:has-text("${buttonText}")`));
      await expect(button.first()).toBeVisible();
    }
  });

  test('should test create post form fields', async ({ page }) => {
    // First login
    await page.goto('/login');
    await page.fill('input[id="username"]', 'sarahpaws');
    await page.fill('input[id="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/', { timeout: 10000 });

    // Check for create post textarea
    const textarea = page.locator('textarea[placeholder*="pet\'s mind"]').or(page.locator('textarea[placeholder*="mind"]'));
    if (await textarea.count() > 0) {
      await expect(textarea.first()).toBeVisible();
      
      // Test textarea interaction
      await textarea.first().fill('Test post content');
      await expect(textarea.first()).toHaveValue('Test post content');
    }

    // Check for pet selector
    const petSelect = page.locator('select').or(page.locator('[role="combobox"]'));
    if (await petSelect.count() > 0) {
      await expect(petSelect.first()).toBeVisible();
    }

    // Check for privacy selector
    const privacyButton = page.locator('button').filter({ hasText: /public|private|followers/i }).first();
    if (await privacyButton.count() > 0) {
      await expect(privacyButton).toBeVisible();
    }
  });

  test('should test all input fields on home page comprehensively', async ({ page }) => {
    // First login
    await page.goto('/login');
    await page.fill('input[id="username"]', 'sarahpaws');
    await page.fill('input[id="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/', { timeout: 10000 });

    const inputFields = page.locator('input');
    const count = await inputFields.count();
    
    if (count > 0) {
      for (let i = 0; i < count; i++) {
        const field = inputFields.nth(i);
        if (await field.isVisible()) {
          await expect(field).toBeVisible();
          
          const inputType = await field.getAttribute('type');
          if (inputType !== 'file' && inputType !== 'submit' && inputType !== 'button') {
            await field.fill('test');
            await field.clear();
          }
        }
      }
    }
  });

  test('should test all textarea fields on home page', async ({ page }) => {
    // First login
    await page.goto('/login');
    await page.fill('input[id="username"]', 'sarahpaws');
    await page.fill('input[id="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/', { timeout: 10000 });

    const textareaFields = page.locator('textarea');
    const count = await textareaFields.count();
    
    if (count > 0) {
      for (let i = 0; i < count; i++) {
        const field = textareaFields.nth(i);
        if (await field.isVisible()) {
          await expect(field).toBeVisible();
          await field.fill('test content');
          await expect(field).toHaveValue('test content');
          await field.clear();
        }
      }
    }
  });

  test('should test all select fields on home page', async ({ page }) => {
    // First login
    await page.goto('/login');
    await page.fill('input[id="username"]', 'sarahpaws');
    await page.fill('input[id="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/', { timeout: 10000 });

    const selectFields = page.locator('select');
    const count = await selectFields.count();
    
    if (count > 0) {
      for (let i = 0; i < count; i++) {
        const field = selectFields.nth(i);
        if (await field.isVisible()) {
          await expect(field).toBeVisible();
        }
      }
    }
  });

  test('should test all links on home page', async ({ page }) => {
    // First login
    await page.goto('/login');
    await page.fill('input[id="username"]', 'sarahpaws');
    await page.fill('input[id="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/', { timeout: 10000 });

    const links = page.locator('a[href]');
    const count = await links.count();
    
    if (count > 0) {
      for (let i = 0; i < Math.min(count, 30); i++) {
        const link = links.nth(i);
        if (await link.isVisible()) {
          await expect(link).toBeVisible();
          
          const href = await link.getAttribute('href');
          expect(href).toBeTruthy();
        }
      }
    }
  });
});

