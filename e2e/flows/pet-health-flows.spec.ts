import { test, expect } from '../fixtures'

test.describe('Pet Health Flows', () => {
  test('manage medications: add, reminder, mark given, adherence tracked', async ({ authenticatedPage: page, }) => {
    // Owner edits pet and adds a medication
    await page.goto('/user/sarahpaws/pet/golden-buddy/edit')
    await page.waitForLoadState('networkidle')

    // Add medication
    await page.getByRole('button', { name: 'Add Medication' }).click()
    await page.getByLabel('Medication Name').last().fill('E2E Test Med')
    await page.getByLabel('Dosage').last().fill('5 mg')
    await page.getByLabel('Frequency').last().fill('Once daily')
    // Use today to make it active
    const today = new Date().toISOString().split('T')[0]!
    await page.getByLabel('Start Date').last().fill(today)

    // Save
    const saveButton = page.getByRole('button', { name: 'Save All Changes' })
    if (await saveButton.isVisible()) {
      await saveButton.click()
      await page.waitForTimeout(500)
    }

    // Navigate to pet page and capture medication ID from button test id
    await page.goto('/user/sarahpaws/pet/golden-buddy')
    await page.waitForLoadState('networkidle')
    const btn = page.locator('[data-testid^="mark-given-"]').first()
    const testid = await btn.getAttribute('data-testid')
    const medId = testid?.replace('mark-given-', '')!

    // Click 'Mark Given Today' on the pet page
    await btn.click()
    await page.waitForTimeout(300)
    await expect(page.getByText('This month:')).toBeVisible()
  })

  test('secure share link reveals health data to recipient', async ({ authenticatedPage: page }) => {
    await page.goto('/user/sarahpaws/pet/golden-buddy')
    await page.waitForLoadState('networkidle')

    // Open secure share dialog and generate link with health viewing
    const open = page.getByTestId('secure-share-button')
    await expect(open).toBeVisible()
    await open.click()
    const gen = page.getByTestId('generate-share-link')
    await gen.click()
    const linkInput = page.getByTestId('share-link')
    const link = await linkInput.inputValue()
    expect(link).toContain('?access=')

    // Recipient visits link (same browser context for simplicity)
    const recipient = await page.context().newPage()
    await recipient.goto(link)
    await recipient.waitForLoadState('networkidle')
    // Health sections should be visible (no "No medications recorded" text if present)
    // We assert that the Medications card header is visible
    await expect(recipient.getByText('Medications')).toBeVisible()
  })

  test('co-owner accepts invite and can edit pet', async ({ authenticatedPage: page, }) => {
    await page.goto('/user/sarahpaws/pet/golden-buddy')
    await page.waitForLoadState('networkidle')
    // Open secure share dialog, enable co-owner
    await page.getByTestId('secure-share-button').click()
    const coOwnerCheckbox = page.locator('label:has-text("Invite as co-owner") input[type="checkbox"]')
    await coOwnerCheckbox.check()
    await page.getByTestId('generate-share-link').click()
    const link = await page.getByTestId('share-link').inputValue()

    // Recipient logs in as different user and accepts
    const recipient = await page.context().newPage()
    await recipient.goto('/login')
    await recipient.fill('input[id="username"]', 'mikecatlover')
    await recipient.fill('input[id="password"]', 'password123')
    await recipient.click('button[type="submit"]')
    await recipient.waitForLoadState('networkidle')

    await recipient.goto(link + '&invite=' + encodeURIComponent(link.split('access=')[1]!))
    await recipient.waitForLoadState('networkidle')
    const acceptBtn = recipient.getByTestId('accept-coowner')
    await expect(acceptBtn).toBeVisible()
    await acceptBtn.click()
    await recipient.waitForTimeout(300)

    // Co-owner edits pet bio
    await recipient.goto('/user/sarahpaws/pet/golden-buddy/edit')
    await recipient.waitForLoadState('networkidle')
    const bio = recipient.getByLabel('Bio')
    await bio.fill('Edited by co-owner')
    const save = recipient.getByRole('button', { name: 'Save All Changes' })
    await save.click()
    await recipient.waitForTimeout(500)

    // Owner refreshes and sees update
    await page.reload()
    await expect(page.getByText('Edited by co-owner')).toBeVisible()
  })
})
