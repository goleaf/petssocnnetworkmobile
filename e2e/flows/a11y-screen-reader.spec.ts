import { test, expect } from '@playwright/test'

test.describe('Screen Reader Mode', () => {
  test('toggle sets body attribute, skip links work, focus outline increases', async ({ page }) => {
    await page.goto('/')

    // Wait for primary nav and SR toggle
    await page.waitForSelector('#primary-navigation')
    const toggle = page.getByTestId('sr-toggle')
    await expect(toggle).toBeVisible()

    // Ensure disabled to start (idempotent)
    const pressed = await toggle.getAttribute('aria-pressed')
    if (pressed === 'true') {
      await toggle.click()
      await expect(page.locator('body')).toHaveAttribute('data-sr-mode', 'false')
    }

    // Enable SR mode
    await toggle.click()
    await expect(toggle).toHaveAttribute('aria-pressed', 'true')
    await expect(page.locator('body')).toHaveAttribute('data-sr-mode', 'true')

    // Skip links should take first focus on Tab
    await page.keyboard.press('Tab')
    await expect(page.getByTestId('skip-to-content')).toBeFocused()

    // Focus outline should be >= 3px in SR mode
    const outlinePx = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null
      if (!el) return null
      const v = getComputedStyle(el).outlineWidth
      return v
    })
    expect(outlinePx).not.toBeNull()
    const outline = parseFloat(String(outlinePx))
    expect(outline).toBeGreaterThanOrEqual(3)

    // Activate skip to content and ensure hash updates
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/#main-content$/)

    // Target should be focusable in SR mode (tabindex applied)
    await expect(page.locator('#main-content')).toHaveAttribute('tabindex', '-1')
  })
})
