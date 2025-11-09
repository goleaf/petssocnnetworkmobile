import { test, expect } from './fixtures'

test.describe('Media Settings & Playback Accessibility', () => {
  test('toggles captions, language, audio descriptions, flash warnings; warns before flagged video', async ({ authenticatedPage: page }) => {
    // Go to media settings
    await page.goto('/settings/data-storage')
    await page.waitForLoadState('networkidle')

    // Enable Show Captions
    const showCaptions = page.getByTestId('toggle-show-captions')
    await showCaptions.click()

    // Set caption language to Spanish
    await page.getByTestId('select-caption-language').click()
    await page.getByRole('option', { name: 'Spanish' }).click()

    // Enable Audio Descriptions
    const audioDesc = page.getByTestId('toggle-audio-descriptions')
    await audioDesc.click()

    // Ensure Flash Warnings is on (toggle off then on to persist state deterministically)
    const flashWarnings = page.getByTestId('toggle-flash-warnings')
    await flashWarnings.click()
    await flashWarnings.click()

    // Save
    await page.getByTestId('btn-save-media-settings').click()

    // Navigate to a blog post with a flagged flashing video in mock data
    await page.goto('/blog/1')
    await page.waitForLoadState('networkidle')

    // Open the 3rd thumbnail (two images + one video in mock post 1)
    await page.getByTestId('media-thumb-2').click()

    // Expect the flash warning overlay to appear
    await expect(page.getByTestId('flash-warning-overlay')).toBeVisible()

    // Acknowledge warning and ensure it dismisses
    await page.getByTestId('btn-ack-flash-warning').click()
    await expect(page.getByTestId('flash-warning-overlay')).toBeHidden()
  })
})

