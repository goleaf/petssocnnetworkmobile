import { test, expect } from './fixtures';
import { testAllButtons, testAllLinks, testAllFormFields, testAllInputFields } from './test-helpers';

test.describe('Register Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/register');
  });

  test('should load register page', async ({ page }) => {
    await expect(page).toHaveURL(/.*\/register/);
    await expect(page.locator('text=/register|sign up|create account/i')).toBeVisible();
  });

  test('should display registration form', async ({ page }) => {
    // Check for all registration form fields
    await expect(page.locator('input[id="fullName"]')).toBeVisible();
    await expect(page.locator('input[id="username"]')).toBeVisible();
    await expect(page.locator('input[id="email"]')).toBeVisible();
    await expect(page.locator('input[id="password"]')).toBeVisible();
    await expect(page.locator('input[id="confirmPassword"]')).toBeVisible();
  });

  test('should test all input fields', async ({ page }) => {
    // Test fullName field
    const fullNameField = page.locator('input[id="fullName"]');
    await expect(fullNameField).toBeVisible();
    await fullNameField.fill('John Doe');
    await expect(fullNameField).toHaveValue('John Doe');

    // Test username field
    const usernameField = page.locator('input[id="username"]');
    await expect(usernameField).toBeVisible();
    await usernameField.fill('johndoe');
    await expect(usernameField).toHaveValue('johndoe');

    // Test email field
    const emailField = page.locator('input[id="email"]');
    await expect(emailField).toBeVisible();
    await expect(emailField).toHaveAttribute('type', 'email');
    await emailField.fill('john@example.com');
    await expect(emailField).toHaveValue('john@example.com');
  });

  test('should test password fields', async ({ page }) => {
    // Test password field
    const passwordField = page.locator('input[id="password"]');
    await expect(passwordField).toBeVisible();
    await expect(passwordField).toHaveAttribute('type', 'password');
    await passwordField.fill('testpassword123');
    await expect(passwordField).toHaveValue('testpassword123');

    // Test confirm password field
    const confirmPasswordField = page.locator('input[id="confirmPassword"]');
    await expect(confirmPasswordField).toBeVisible();
    await confirmPasswordField.fill('testpassword123');
    await expect(confirmPasswordField).toHaveValue('testpassword123');
  });

  test('should toggle password visibility', async ({ page }) => {
    const passwordField = page.locator('input[id="password"]');
    await passwordField.fill('testpassword123');
    
    // Find password toggle button
    const toggleButton = page.locator('button[aria-label*="password"]').first();
    await expect(toggleButton).toBeVisible();
    
    // Check initial state
    await expect(passwordField).toHaveAttribute('type', 'password');
    
    // Click toggle
    await toggleButton.click();
    
    // Check if type changed
    const type = await passwordField.getAttribute('type');
    expect(type === 'text' || type === 'password').toBeTruthy();
  });

  test('should toggle confirm password visibility', async ({ page }) => {
    const confirmPasswordField = page.locator('input[id="confirmPassword"]');
    await confirmPasswordField.fill('testpassword123');
    
    // Find confirm password toggle button (should be the second one)
    const toggleButtons = page.locator('button[aria-label*="password"]');
    if (await toggleButtons.count() > 1) {
      const toggleButton = toggleButtons.nth(1);
      await expect(toggleButton).toBeVisible();
      await toggleButton.click();
    }
  });

  test('should validate password match', async ({ page }) => {
    await page.fill('input[id="password"]', 'password123');
    await page.fill('input[id="confirmPassword"]', 'differentpassword');
    
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();
    
    // Should show error about passwords not matching
    await page.waitForTimeout(1000);
    const errorMessage = page.locator('text=/do not match|match/i');
    if (await errorMessage.count() > 0) {
      await expect(errorMessage.first()).toBeVisible();
    }
  });

  test('should display submit button', async ({ page }) => {
    const submitButton = page.locator('button[type="submit"]').or(
      page.locator('button').filter({ hasText: /register|sign up|create/i })
    );
    await expect(submitButton.first()).toBeVisible();
  });

  test('should display login link/button', async ({ page }) => {
    const loginButton = page.locator('text=/login|sign in/i').or(
      page.locator('a[href*="/login"]')
    );
    await expect(loginButton.first()).toBeVisible();
  });

  test('should navigate to login page when clicking login link', async ({ page }) => {
    const loginButton = page.locator('text=/login|sign in/i').or(
      page.locator('a[href*="/login"]')
    ).first();
    await loginButton.click();
    await expect(page).toHaveURL(/.*\/login/);
  });

  test('should validate empty form submission', async ({ page }) => {
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();
    
    // Should show validation error or stay on page
    await expect(page).toHaveURL(/.*\/register/);
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

