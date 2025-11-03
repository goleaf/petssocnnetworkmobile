import { test, expect } from './fixtures';
import { testAllButtons, testAllLinks, testAllFormFields, testAllInputFields, testAllTextareaFields, testAllSelectFields } from './test-helpers';

test.describe('Other Pages', () => {
  test.describe('Places Pages', () => {
    test('should load places list page', async ({ authenticatedPage: page }) => {
      await page.goto('/places');
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/.*\/places/);
    });

    test('should test all buttons on places page', async ({ authenticatedPage: page }) => {
      await page.goto('/places');
      await page.waitForLoadState('networkidle');
      await testAllButtons(page, 50);
    });

    test('should test all links on places page', async ({ authenticatedPage: page }) => {
      await page.goto('/places');
      await page.waitForLoadState('networkidle');
      await testAllLinks(page, 50);
    });

    test('should test all form fields on places page', async ({ authenticatedPage: page }) => {
      await page.goto('/places');
      await page.waitForLoadState('networkidle');
      await testAllFormFields(page);
    });
  });

  test.describe('Products Pages', () => {
    test('should load products list page', async ({ authenticatedPage: page }) => {
      await page.goto('/products');
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/.*\/products/);
    });

    test('should test all buttons on products page', async ({ authenticatedPage: page }) => {
      await page.goto('/products');
      await page.waitForLoadState('networkidle');
      await testAllButtons(page, 50);
    });

    test('should test all links on products page', async ({ authenticatedPage: page }) => {
      await page.goto('/products');
      await page.waitForLoadState('networkidle');
      await testAllLinks(page, 50);
    });

    test('should test all form fields on products page', async ({ authenticatedPage: page }) => {
      await page.goto('/products');
      await page.waitForLoadState('networkidle');
      await testAllFormFields(page);
    });
  });

  test.describe('Organizations Pages', () => {
    test('should load organizations list page', async ({ authenticatedPage: page }) => {
      await page.goto('/organizations');
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/.*\/organizations/);
    });

    test('should test all buttons on organizations page', async ({ authenticatedPage: page }) => {
      await page.goto('/organizations');
      await page.waitForLoadState('networkidle');
      await testAllButtons(page, 50);
    });

    test('should test all links on organizations page', async ({ authenticatedPage: page }) => {
      await page.goto('/organizations');
      await page.waitForLoadState('networkidle');
      await testAllLinks(page, 50);
    });

    test('should test all form fields on organizations page', async ({ authenticatedPage: page }) => {
      await page.goto('/organizations');
      await page.waitForLoadState('networkidle');
      await testAllFormFields(page);
    });
  });

  test.describe('Species Pages', () => {
    test('should load species list page', async ({ authenticatedPage: page }) => {
      await page.goto('/species');
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/.*\/species/);
    });

    test('should test all buttons on species page', async ({ authenticatedPage: page }) => {
      await page.goto('/species');
      await page.waitForLoadState('networkidle');
      await testAllButtons(page, 50);
    });

    test('should test all links on species page', async ({ authenticatedPage: page }) => {
      await page.goto('/species');
      await page.waitForLoadState('networkidle');
      await testAllLinks(page, 50);
    });

    test('should test all form fields on species page', async ({ authenticatedPage: page }) => {
      await page.goto('/species');
      await page.waitForLoadState('networkidle');
      await testAllFormFields(page);
    });
  });

  test.describe('Messages Page', () => {
    test('should load messages page', async ({ authenticatedPage: page }) => {
      await page.goto('/messages');
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/.*\/messages/);
    });

    test('should test all buttons on messages page', async ({ authenticatedPage: page }) => {
      await page.goto('/messages');
      await page.waitForLoadState('networkidle');
      await testAllButtons(page, 50);
    });

    test('should test all links on messages page', async ({ authenticatedPage: page }) => {
      await page.goto('/messages');
      await page.waitForLoadState('networkidle');
      await testAllLinks(page, 50);
    });

    test('should test all form fields on messages page', async ({ authenticatedPage: page }) => {
      await page.goto('/messages');
      await page.waitForLoadState('networkidle');
      await testAllFormFields(page);
    });

    test('should test all input fields on messages page', async ({ authenticatedPage: page }) => {
      await page.goto('/messages');
      await page.waitForLoadState('networkidle');
      await testAllInputFields(page);
    });

    test('should test all textarea fields on messages page', async ({ authenticatedPage: page }) => {
      await page.goto('/messages');
      await page.waitForLoadState('networkidle');
      await testAllTextareaFields(page);
    });
  });

  test.describe('Notifications Page', () => {
    test('should load notifications page', async ({ authenticatedPage: page }) => {
      await page.goto('/notifications');
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/.*\/notifications/);
    });

    test('should test all buttons on notifications page', async ({ authenticatedPage: page }) => {
      await page.goto('/notifications');
      await page.waitForLoadState('networkidle');
      await testAllButtons(page, 50);
    });

    test('should test all links on notifications page', async ({ authenticatedPage: page }) => {
      await page.goto('/notifications');
      await page.waitForLoadState('networkidle');
      await testAllLinks(page, 50);
    });

    test('should test all form fields on notifications page', async ({ authenticatedPage: page }) => {
      await page.goto('/notifications');
      await page.waitForLoadState('networkidle');
      await testAllFormFields(page);
    });
  });
});

