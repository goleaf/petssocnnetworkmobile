import { test, expect } from './fixtures'

test.describe('Profile End-to-End Flows', () => {
  test('Profile completion can reach 100% with all steps', async ({ authenticatedPage: page }) => {
    // Prepare: mark phone verified and ensure at least one pet exists for the user
    await page.goto('/')
    await page.evaluate(() => {
      const users = JSON.parse(localStorage.getItem('pet_social_users') || '[]')
      const uIdx = users.findIndex((x: any) => x.username === 'sarahpaws')
      if (uIdx !== -1) {
        users[uIdx].phoneVerified = true
        localStorage.setItem('pet_social_users', JSON.stringify(users))
        const petsRaw = localStorage.getItem('pet_social_pets')
        const pets = petsRaw ? JSON.parse(petsRaw) : []
        const owned = pets.some((p: any) => p.ownerId === users[uIdx].id)
        if (!owned) {
          pets.push({ id: `pet_${Date.now()}`, ownerId: users[uIdx].id, name: 'Buddy', species: 'dog', followers: [] })
          localStorage.setItem('pet_social_pets', JSON.stringify(pets))
        }
      }
    })

    await page.goto('/user/sarahpaws/edit')
    await page.waitForLoadState('networkidle')

    const completionText = page.locator('text=Your profile is').first()
    await expect(completionText).toBeVisible()
    const beforeText = await completionText.textContent()
    const before = Number(beforeText?.match(/(\d+)%/)?.[1] || '0')

    // Fill key fields: bio, website, date of birth, location
    await page.fill('textarea#bio', 'Hello, I love pets and sharing tips!')
    const dateInput = page.locator('input#dateOfBirth')
    if (await dateInput.count()) {
      await dateInput.fill('2000-01-01')
    }
    const websiteInput = page.locator('input#website')
    if (await websiteInput.count()) {
      await websiteInput.fill('https://example.com')
    }
    const cityInput = page.locator('input#city')
    if (await cityInput.count()) await cityInput.fill('Austin')
    const countryInput = page.locator('input#country')
    if (await countryInput.count()) await countryInput.fill('United States')

    // Wait a moment for live recompute
    await page.waitForTimeout(500)
    const afterText = await completionText.textContent()
    const after = Number(afterText?.match(/(\d+)%/)?.[1] || '0')

    expect(after).toBeGreaterThan(before)
    // With phone verified and one pet plus fields, should reach 100%
    expect(after).toBeGreaterThanOrEqual(100)
  })

  test('Username change redirects old username to new', async ({ authenticatedPage: page }) => {
    await page.goto('/user/sarahpaws')
    // Determine userId from localStorage
    const { userId, oldUsername } = await page.evaluate(() => {
      const users = JSON.parse(localStorage.getItem('pet_social_users') || '[]')
      const u = users.find((x: any) => x.username === 'sarahpaws')
      return { userId: u?.id, oldUsername: 'sarahpaws' }
    })
    expect(userId).toBeTruthy()

    const newUsername = `sarahpaws_${Date.now().toString().slice(-5)}`
    // Change username via API
    const status = await page.evaluate(async ({ userId, newUsername }) => {
      const res = await fetch(`/api/users/${encodeURIComponent(userId)}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: newUsername, password: 'password123' }),
      })
      return res.status
    }, { userId, newUsername })
    expect(status).toBe(200)

    // Visit old username and verify redirect to new with banner
    await page.goto(`/user/${oldUsername}`)
    await page.waitForURL(new RegExp(`/user/${newUsername}`))
    await expect(page).toHaveURL(new RegExp(`renamed_from=${oldUsername}`))
    await expect(page.locator('text=recently changed their username')).toBeVisible()
  })

  test('Private profile is hidden from non-friends', async ({ authenticatedPage: page }) => {
    // Get current username and id
    const { userId, username } = await page.evaluate(() => {
      const users = JSON.parse(localStorage.getItem('pet_social_users') || '[]')
      const u = users.find((x: any) => x.username === 'sarahpaws')
      return { userId: u?.id, username: u?.username }
    })
    // Set profile privacy to private via API
    const putStatus = await page.evaluate(async ({ userId }) => {
      const res = await fetch(`/api/users/${encodeURIComponent(userId)}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ privacy: { profile: 'private', searchable: true, allowFollowRequests: 'public', allowTagging: 'public' } }),
      })
      return res.status
    }, { userId })
    expect(putStatus).toBe(200)

    // New, unauthenticated context
    const ctx = await page.context().browser()?.newContext()
    const anon = await ctx!.newPage()
    await anon.goto(`/user/${username}`)
    await anon.waitForLoadState('networkidle')
    await expect(anon.locator('text=User not found or profile is private')).toBeVisible()
    await anon.close()
    await ctx!.close()
  })

  test('Verified user shows verified badge', async ({ authenticatedPage: page }) => {
    // Flip badge to verified in client storage for demo
    await page.evaluate(() => {
      const users = JSON.parse(localStorage.getItem('pet_social_users') || '[]')
      const idx = users.findIndex((x: any) => x.username === 'sarahpaws')
      if (idx !== -1) {
        users[idx].badge = 'verified'
        localStorage.setItem('pet_social_users', JSON.stringify(users))
      }
    })
    await page.goto('/user/sarahpaws')
    await page.waitForLoadState('networkidle')
    // BadgeDisplay renders icon with title="Verified"
    await expect(page.locator('[title="Verified"]')).toBeVisible()
  })
})
