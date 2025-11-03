import { Page, expect } from '@playwright/test';

/**
 * Test all buttons on a page
 */
export async function testAllButtons(page: Page, maxCount: number = 50) {
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
  
  return count;
}

/**
 * Test all input fields on a page
 */
export async function testAllInputFields(page: Page) {
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
  
  return count;
}

/**
 * Test all textarea fields on a page
 */
export async function testAllTextareaFields(page: Page) {
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
  
  return count;
}

/**
 * Test all select fields on a page
 */
export async function testAllSelectFields(page: Page) {
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
  
  return count;
}

/**
 * Test all links on a page
 */
export async function testAllLinks(page: Page, maxCount: number = 50) {
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
  
  return count;
}

/**
 * Test all form fields (inputs, textareas, selects) on a page
 */
export async function testAllFormFields(page: Page) {
  const inputCount = await testAllInputFields(page);
  const textareaCount = await testAllTextareaFields(page);
  const selectCount = await testAllSelectFields(page);
  
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
export async function testAllInteractiveElements(page: Page) {
  await page.waitForLoadState('networkidle');
  
  const buttons = await testAllButtons(page);
  const links = await testAllLinks(page);
  const formFields = await testAllFormFields(page);
  
  return {
    buttons,
    links,
    formFields
  };
}

