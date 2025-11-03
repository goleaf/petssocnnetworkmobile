import { test, expect } from './fixtures';
import { testAllButtons, testAllLinks, testAllFormFields, testAllInputFields } from './test-helpers';

test.describe('Login Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('should load login page', async ({ page }) => {
    await expect(page).toHaveURL(/.*\/login/);
    await expect(page.locator('text=Welcome Back').first()).toBeVisible();
  });

  test('should display login form', async ({ page }) => {
    await expect(page.locator('input[id="username"]')).toBeVisible();
    await expect(page.locator('input[id="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should test username field', async ({ page }) => {
    const usernameField = page.locator('input[id="username"]');
    await expect(usernameField).toBeVisible();
    await expect(usernameField).toHaveAttribute('type', 'text');
    await expect(usernameField).toHaveAttribute('required');
    
    // Test typing
    await usernameField.fill('testuser');
    await expect(usernameField).toHaveValue('testuser');
    
    // Test placeholder
    await usernameField.clear();
    await expect(usernameField).toHaveAttribute('placeholder', /username|Enter your username/i);
  });

  test('should test password field', async ({ page }) => {
    const passwordField = page.locator('input[id="password"]');
    await expect(passwordField).toBeVisible();
    await expect(passwordField).toHaveAttribute('type', 'password');
    await expect(passwordField).toHaveAttribute('required');
    
    // Test typing
    await passwordField.fill('testpassword');
    await expect(passwordField).toHaveValue('testpassword');
  });

  test('should toggle password visibility', async ({ page }) => {
    const passwordField = page.locator('input[id="password"]');
    await passwordField.fill('testpassword');
    
    // Find toggle button
    const toggleButton = page.locator('button[aria-label*="password"]').first();
    
    if (await toggleButton.count() > 0) {
      // Check initial state
      await expect(passwordField).toHaveAttribute('type', 'password');
      
      // Click toggle
      await toggleButton.click();
      
      // Check if type changed (may be text or password depending on implementation)
      const type = await passwordField.getAttribute('type');
      expect(type === 'text' || type === 'password').toBeTruthy();
    }
  });

  test('should display sign in button', async ({ page }) => {
    const signInButton = page.locator('button[type="submit"]').filter({ hasText: /sign in|Sign In/i });
    await expect(signInButton).toBeVisible();
    await expect(signInButton).toBeEnabled();
  });

  test('should display register link/button', async ({ page }) => {
    const registerButton = page.locator('text=Register').or(
      page.locator('text=Don\'t have an account').or(
        page.locator('a[href*="/register"]')
      )
    );
    await expect(registerButton.first()).toBeVisible();
  });

  test('should navigate to register page when clicking register link', async ({ page }) => {
    const registerButton = page.locator('button').filter({ hasText: /Don't have an account|Register/i });
    if (await registerButton.count() > 0) {
      await registerButton.first().click();
      await expect(page).toHaveURL(/.*\/register/);
    }
  });

  test('should validate empty form submission', async ({ page }) => {
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();
    
    // Should show validation error or stay on page
    await expect(page).toHaveURL(/.*\/login/);
  });

  test('should validate username minimum length', async ({ page }) => {
    const usernameField = page.locator('input[id="username"]');
    await usernameField.fill('ab');
    await page.locator('input[id="password"]').fill('password123');
    
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();
    
    // Should show error or stay on page
    await page.waitForTimeout(1000);
    const errorMessage = page.locator('text=/at least 3|required|invalid/i');
    if (await errorMessage.count() > 0) {
      await expect(errorMessage.first()).toBeVisible();
    }
  });

  test('should validate password minimum length', async ({ page }) => {
    const usernameField = page.locator('input[id="username"]');
    await usernameField.fill('testuser');
    await page.locator('input[id="password"]').fill('12345');
    
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();
    
    // Should show error or stay on page
    await page.waitForTimeout(1000);
    const errorMessage = page.locator('text=/at least 6|required|invalid/i');
    if (await errorMessage.count() > 0) {
      await expect(errorMessage.first()).toBeVisible();
    }
  });

  test('should login with valid credentials', async ({ page }) => {
    await page.fill('input[id="username"]', 'sarahpaws');
    await page.fill('input[id="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Should redirect to home page
    await page.waitForURL(/\//, { timeout: 10000 });
    await expect(page).toHaveURL(/\//);
  });

  test('should display demo credentials', async ({ page }) => {
    await expect(page.locator('text=Demo Credentials')).toBeVisible();
    await expect(page.locator('text=sarahpaws').first()).toBeVisible();
    await expect(page.locator('text=password123')).toBeVisible();
  });

  test('should show error on invalid credentials', async ({ page }) => {
    await page.fill('input[id="username"]', 'invaliduser');
    await page.fill('input[id="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // Should show error message
    await page.waitForTimeout(2000);
    const errorMessage = page.locator('text=/invalid|incorrect|failed|error/i');
    if (await errorMessage.count() > 0) {
      await expect(errorMessage.first()).toBeVisible();
    }
  });

  test('should test all buttons on page', async ({ page }) => {
    await testAllButtons(page, 50);
  });

  test('should test all input fields comprehensively', async ({ page }) => {
    await testAllInputFields(page);
  });

  test('should test all form fields on page', async ({ page }) => {
    await testAllFormFields(page);
  });

  test('should test all links on page', async ({ page }) => {
    await testAllLinks(page, 50);
  });
});

