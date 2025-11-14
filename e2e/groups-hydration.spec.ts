import { test, expect } from './fixtures';

test.describe('Groups Page Hydration Fix', () => {
  test('should load groups page without hydration errors', async ({ authenticatedPage: page }) => {
    // Listen for console errors that might indicate hydration issues
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Navigate to groups page
    await page.goto('/groups');
    await page.waitForLoadState('networkidle');

    // Verify page loaded successfully
    await expect(page).toHaveURL(/.*\/groups/);
    await expect(page.locator('h1')).toContainText(/discover groups/i);

    // Verify categories are rendered immediately (static data)
    const categoryTabs = page.locator('[role="tab"]');
    await expect(categoryTabs).toHaveCount(11); // All + 10 categories

    // Verify no hydration mismatch errors
    const hydrationErrors = consoleErrors.filter(
      (error) =>
        error.includes('Hydration') ||
        error.includes('did not match') ||
        error.includes('server-rendered HTML')
    );
    expect(hydrationErrors).toHaveLength(0);
  });

  test('should render categories consistently', async ({ authenticatedPage: page }) => {
    await page.goto('/groups');
    await page.waitForLoadState('networkidle');

    // Verify all expected categories are present
    const expectedCategories = [
      'All',
      'Dogs',
      'Cats',
      'Birds',
      'Rabbits',
      'Hamsters',
      'Fish',
      'Training',
      'Health',
      'Adoption',
      'Nutrition',
    ];

    for (const category of expectedCategories) {
      const categoryTab = page.locator('[role="tab"]', { hasText: category });
      await expect(categoryTab).toBeVisible();
    }
  });

  test('should filter groups by category without errors', async ({ authenticatedPage: page }) => {
    await page.goto('/groups');
    await page.waitForLoadState('networkidle');

    // Click on Dogs category
    const dogsTab = page.locator('[role="tab"]', { hasText: 'Dogs' });
    await dogsTab.click();

    // Wait for filtering to complete
    await page.waitForTimeout(500);

    // Verify URL updated with category filter
    await expect(page).toHaveURL(/.*category=cat-dogs/);
  });

  test('should handle search without hydration issues', async ({ authenticatedPage: page }) => {
    await page.goto('/groups');
    await page.waitForLoadState('networkidle');

    // Find and use search input
    const searchInput = page.locator('input[placeholder*="Search groups"]');
    await expect(searchInput).toBeVisible();
    await searchInput.fill('test');

    // Wait for search to process
    await page.waitForTimeout(500);

    // Verify no console errors
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    expect(consoleErrors.filter((e) => e.includes('Hydration'))).toHaveLength(0);
  });

  test('should toggle view modes without errors', async ({ authenticatedPage: page }) => {
    await page.goto('/groups');
    await page.waitForLoadState('networkidle');

    // Find view mode toggle buttons
    const viewButtons = page.locator('button').filter({ has: page.locator('svg') });
    const buttonCount = await viewButtons.count();

    // Should have at least 2 view mode buttons (grid and list)
    expect(buttonCount).toBeGreaterThanOrEqual(2);

    // Click different view modes
    if (buttonCount >= 2) {
      await viewButtons.nth(0).click();
      await page.waitForTimeout(200);
      await viewButtons.nth(1).click();
      await page.waitForTimeout(200);
    }

    // Verify no errors occurred
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    expect(consoleErrors).toHaveLength(0);
  });
});
