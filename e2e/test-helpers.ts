import { Page, expect } from '@playwright/test';

/**
 * Take a screenshot of the page
 */
export async function takeScreenshot(page: Page, name: string) {
  const path = require('path');
  const fs = require('fs');
  const screenshotsDir = path.join(process.cwd(), 'test-results', 'screenshots');
  
  // Ensure directory exists
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }
  
  const sanitizedName = name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const timestamp = Date.now();
  const screenshotPath = path.join(screenshotsDir, `${sanitizedName}-${timestamp}.png`);
  
  await page.screenshot({ 
    path: screenshotPath,
    fullPage: true 
  });
  
  return screenshotPath;
}

/**
 * Take a screenshot at the start of a test (initial page state)
 */
export async function takeInitialScreenshot(page: Page, testName: string) {
  await page.waitForLoadState('networkidle');
  return await takeScreenshot(page, `initial-${testName}`);
}

/**
 * Test all buttons on a page
 */
export async function testAllButtons(page: Page, maxCount: number = 50, testName?: string) {
  const buttons = page.locator('button');
  const count = await buttons.count();
  
  if (count > 0) {
    for (let i = 0; i < Math.min(count, maxCount); i++) {
      const button = buttons.nth(i);
      if (await button.isVisible()) {
        await expect(button).toBeVisible();
        // Try to click (may fail if disabled, that's ok)
        const isDisabled = await button.isDisabled().catch(() => false);
        if (!isDisabled) {
          // Just check if it's clickable, don't actually click to avoid navigation
          const boundingBox = await button.boundingBox();
          expect(boundingBox).toBeTruthy();
        }
      }
    }
  }
  
  // Take screenshot after testing buttons
  if (testName) {
    await takeScreenshot(page, `buttons-${testName}`);
  }
  
  return count;
}

/**
 * Test all input fields on a page
 */
export async function testAllInputFields(page: Page, testName?: string) {
  const fields = page.locator('input');
  const count = await fields.count();
  
  if (count > 0) {
    for (let i = 0; i < count; i++) {
      const field = fields.nth(i);
      if (await field.isVisible()) {
        await expect(field).toBeVisible();
        
        const inputType = await field.getAttribute('type');
        if (inputType !== 'file' && inputType !== 'submit' && inputType !== 'button' && inputType !== 'checkbox' && inputType !== 'radio') {
          await field.fill('test');
          await expect(field).toHaveValue('test');
          await field.clear();
        }
      }
    }
  }
  
  // Take screenshot after testing inputs
  if (testName) {
    await takeScreenshot(page, `inputs-${testName}`);
  }
  
  return count;
}

/**
 * Test all textarea fields on a page
 */
export async function testAllTextareaFields(page: Page, testName?: string) {
  const fields = page.locator('textarea');
  const count = await fields.count();
  
  if (count > 0) {
    for (let i = 0; i < count; i++) {
      const field = fields.nth(i);
      if (await field.isVisible()) {
        await expect(field).toBeVisible();
        await field.fill('test content');
        await expect(field).toHaveValue('test content');
        await field.clear();
      }
    }
  }
  
  // Take screenshot after testing textareas
  if (testName) {
    await takeScreenshot(page, `textareas-${testName}`);
  }
  
  return count;
}

/**
 * Test all select fields on a page
 */
export async function testAllSelectFields(page: Page, testName?: string) {
  const fields = page.locator('select, [role="combobox"]');
  const count = await fields.count();
  
  if (count > 0) {
    for (let i = 0; i < count; i++) {
      const field = fields.nth(i);
      if (await field.isVisible()) {
        await expect(field).toBeVisible();
      }
    }
  }
  
  // Take screenshot after testing selects
  if (testName) {
    await takeScreenshot(page, `selects-${testName}`);
  }
  
  return count;
}

/**
 * Test all links on a page
 */
export async function testAllLinks(page: Page, maxCount: number = 50, testName?: string) {
  const links = page.locator('a[href]');
  const count = await links.count();
  
  if (count > 0) {
    for (let i = 0; i < Math.min(count, maxCount); i++) {
      const link = links.nth(i);
      if (await link.isVisible()) {
        await expect(link).toBeVisible();
        const href = await link.getAttribute('href');
        expect(href).toBeTruthy();
      }
    }
  }
  
  // Take screenshot after testing links
  if (testName) {
    await takeScreenshot(page, `links-${testName}`);
  }
  
  return count;
}

/**
 * Test all form fields (inputs, textareas, selects) on a page
 */
export async function testAllFormFields(page: Page, testName?: string) {
  const inputCount = await testAllInputFields(page);
  const textareaCount = await testAllTextareaFields(page);
  const selectCount = await testAllSelectFields(page);
  
  // Take screenshot after testing all form fields
  if (testName) {
    await takeScreenshot(page, `form-fields-${testName}`);
  }
  
  return {
    inputs: inputCount,
    textareas: textareaCount,
    selects: selectCount,
    total: inputCount + textareaCount + selectCount
  };
}

/**
 * Test all interactive elements on a page
 */
export async function testAllInteractiveElements(page: Page, testName?: string) {
  await page.waitForLoadState('networkidle');
  
  const buttons = await testAllButtons(page, 50, testName);
  const links = await testAllLinks(page, 50, testName);
  const formFields = await testAllFormFields(page, testName);
  
  // Take final screenshot
  if (testName) {
    await takeScreenshot(page, `interactive-elements-${testName}`);
  }
  
  return {
    buttons,
    links,
    formFields
  };
}

