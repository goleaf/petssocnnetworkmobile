import { test, expect } from './fixtures';
import { testAllButtons, testAllLinks, testAllFormFields, testAllInputFields, testAllTextareaFields, testAllSelectFields } from './test-helpers';

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

  test('should test all buttons in authenticated view', async ({ authenticatedPage: page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await testAllButtons(page, 50);
  });

  test('should test all form fields on home page (authenticated)', async ({ authenticatedPage: page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await testAllFormFields(page);
  });

  test('should test all input fields on home page (authenticated)', async ({ authenticatedPage: page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await testAllInputFields(page);
  });

  test('should test all textarea fields on home page (authenticated)', async ({ authenticatedPage: page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await testAllTextareaFields(page);
  });

  test('should test all select fields on home page (authenticated)', async ({ authenticatedPage: page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await testAllSelectFields(page);
  });

  test('should test all links on home page (authenticated)', async ({ authenticatedPage: page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await testAllLinks(page, 50);
  });
});

