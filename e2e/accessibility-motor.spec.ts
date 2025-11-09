import { test, expect } from './fixtures'

const SETTINGS_KEY = 'motorA11ySettings'

function setMotorSettings(page, settings) {
  return page.addInitScript((sKey, s) => {
    try {
      localStorage.setItem(sKey, JSON.stringify(s))
    } catch {}
  }, SETTINGS_KEY, settings)
}

test.describe('Motor accessibility', () => {
  test('sticky keys latches and auto-clears after inactivity', async ({ authenticatedPage: page }) => {
    await setMotorSettings(page, {
      stickyKeys: true,
      slowKeys: false,
      slowKeysDelayMs: 300,
      clickDelayMs: 0,
      largeTouchTargets: false,
    })

    await page.goto('/admin')
    await page.waitForLoadState('networkidle')

    // Sequential Control then k should open search (Cmd/Ctrl+K)
    await page.keyboard.press('Control')
    await page.keyboard.press('k')

    const searchInput = page.getByPlaceholder('Search admin panel... (Esc to close)')
    await expect(searchInput).toBeVisible()

    // Close search
    await page.keyboard.press('Escape')
    await expect(searchInput).toBeHidden()

    // After 5s inactivity, sticky modifiers should auto-clear
    await page.waitForTimeout(5200)
    await page.keyboard.press('k')
    await expect(searchInput).toBeHidden()

    // Re-press Control then k works again
    await page.keyboard.press('Control')
    await page.keyboard.press('k')
    await expect(searchInput).toBeVisible()
  })

  test('click delay blocks rapid double clicks within window', async ({ authenticatedPage: page }) => {
    await setMotorSettings(page, {
      stickyKeys: false,
      slowKeys: false,
      slowKeysDelayMs: 300,
      clickDelayMs: 600,
      largeTouchTargets: false,
    })

    await page.goto('/en/settings/accessibility')
    await page.waitForLoadState('networkidle')

    // Inject a click test button that increments a counter on click
    await page.evaluate(() => {
      const btn = document.createElement('button')
      btn.id = 'click-test'
      btn.textContent = 'Click test'
      btn.style.margin = '12px'
      ;(window as any).__clickCount = 0
      btn.addEventListener('click', () => {
        ;(window as any).__clickCount = ((window as any).__clickCount || 0) + 1
        btn.setAttribute('data-count', String((window as any).__clickCount))
      })
      document.body.appendChild(btn)
    })

    const btn = page.locator('#click-test')
    await expect(btn).toBeVisible()

    // Double click rapidly: only first should count
    await btn.click()
    await page.waitForTimeout(80)
    await btn.click()
    await expect(btn).toHaveAttribute('data-count', '1')

    // Wait beyond delay and click again -> counts as second
    await page.waitForTimeout(700)
    await btn.click()
    await expect(btn).toHaveAttribute('data-count', '2')
  })
})

