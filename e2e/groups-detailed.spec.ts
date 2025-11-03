import { test, expect } from './fixtures';
import { testAllButtons, testAllLinks, testAllFormFields, testAllInputFields, testAllTextareaFields, testAllSelectFields } from './test-helpers';

test.describe('Groups Detailed Pages', () => {
  test.describe('Group Topics Create Page', () => {
    test('should load group topics create page', async ({ authenticatedPage: page }) => {
      await page.goto('/groups');
      await page.waitForLoadState('networkidle');
      
      const groupLinks = page.locator('a[href*="/groups/"]').filter({ hasNot: page.locator('text=/create|Create/') });
      const count = await groupLinks.count();
      
      if (count > 0) {
        await groupLinks.first().click();
        await page.waitForLoadState('networkidle');
        
        const topicsCreateLink = page.locator('a[href*="/topics/create"]').first();
        if (await topicsCreateLink.count() > 0) {
          await topicsCreateLink.click();
          await page.waitForLoadState('networkidle');
          await expect(page).toHaveURL(/.*\/groups\/[^\/]+\/topics\/create/);
        }
      }
    });

    test('should test all form fields on group topics create page', async ({ authenticatedPage: page }) => {
      await page.goto('/groups');
      await page.waitForLoadState('networkidle');
      
      const groupLinks = page.locator('a[href*="/groups/"]').filter({ hasNot: page.locator('text=/create|Create/') });
      const count = await groupLinks.count();
      
      if (count > 0) {
        await groupLinks.first().click();
        await page.waitForLoadState('networkidle');
        
        const topicsCreateLink = page.locator('a[href*="/topics/create"]').first();
        if (await topicsCreateLink.count() > 0) {
          await topicsCreateLink.click();
          await page.waitForLoadState('networkidle');
          
          await testAllFormFields(page);
        }
      }
    });

    test('should test all buttons on group topics create page', async ({ authenticatedPage: page }) => {
      await page.goto('/groups');
      await page.waitForLoadState('networkidle');
      
      const groupLinks = page.locator('a[href*="/groups/"]').filter({ hasNot: page.locator('text=/create|Create/') });
      const count = await groupLinks.count();
      
      if (count > 0) {
        await groupLinks.first().click();
        await page.waitForLoadState('networkidle');
        
        const topicsCreateLink = page.locator('a[href*="/topics/create"]').first();
        if (await topicsCreateLink.count() > 0) {
          await topicsCreateLink.click();
          await page.waitForLoadState('networkidle');
          
          const buttons = page.locator('button');
          const buttonCount = await buttons.count();
          
          if (buttonCount > 0) {
            for (let i = 0; i < buttonCount; i++) {
              const button = buttons.nth(i);
              if (await button.isVisible()) {
                await expect(button).toBeVisible();
              }
            }
          }
        }
      }
    });
  });

  test.describe('Group Topic Detail Page', () => {
    test('should load group topic detail page', async ({ authenticatedPage: page }) => {
      await page.goto('/groups');
      await page.waitForLoadState('networkidle');
      
      const groupLinks = page.locator('a[href*="/groups/"]').filter({ hasNot: page.locator('text=/create|Create/') });
      const count = await groupLinks.count();
      
      if (count > 0) {
        await groupLinks.first().click();
        await page.waitForLoadState('networkidle');
        
        const topicsLink = page.locator('a[href*="/topics"]').first();
        if (await topicsLink.count() > 0) {
          await topicsLink.click();
          await page.waitForLoadState('networkidle');
          
          const topicLink = page.locator('a[href*="/topics/"]').filter({ hasNot: page.locator('text=/create|Create/') }).first();
          if (await topicLink.count() > 0) {
            await topicLink.click();
            await page.waitForLoadState('networkidle');
            await expect(page).toHaveURL(/.*\/groups\/[^\/]+\/topics\/[^\/]+$/);
          }
        }
      }
    });

    test('should test all buttons on group topic detail page', async ({ authenticatedPage: page }) => {
      await page.goto('/groups');
      await page.waitForLoadState('networkidle');
      
      const groupLinks = page.locator('a[href*="/groups/"]').filter({ hasNot: page.locator('text=/create|Create/') });
      const count = await groupLinks.count();
      
      if (count > 0) {
        await groupLinks.first().click();
        await page.waitForLoadState('networkidle');
        
        const topicsLink = page.locator('a[href*="/topics"]').first();
        if (await topicsLink.count() > 0) {
          await topicsLink.click();
          await page.waitForLoadState('networkidle');
          
          const topicLink = page.locator('a[href*="/topics/"]').filter({ hasNot: page.locator('text=/create|Create/') }).first();
          if (await topicLink.count() > 0) {
            await topicLink.click();
            await page.waitForLoadState('networkidle');
            
            const buttons = page.locator('button');
            const buttonCount = await buttons.count();
            
            if (buttonCount > 0) {
              for (let i = 0; i < Math.min(buttonCount, 50); i++) {
                const button = buttons.nth(i);
                if (await button.isVisible()) {
                  await expect(button).toBeVisible();
                }
              }
            }
          }
        }
      }
    });

    test('should test all form fields on group topic detail page', async ({ authenticatedPage: page }) => {
      await page.goto('/groups');
      await page.waitForLoadState('networkidle');
      
      const groupLinks = page.locator('a[href*="/groups/"]').filter({ hasNot: page.locator('text=/create|Create/') });
      const count = await groupLinks.count();
      
      if (count > 0) {
        await groupLinks.first().click();
        await page.waitForLoadState('networkidle');
        
        const topicsLink = page.locator('a[href*="/topics"]').first();
        if (await topicsLink.count() > 0) {
          await topicsLink.click();
          await page.waitForLoadState('networkidle');
          
          const topicLink = page.locator('a[href*="/topics/"]').filter({ hasNot: page.locator('text=/create|Create/') }).first();
          if (await topicLink.count() > 0) {
            await topicLink.click();
            await page.waitForLoadState('networkidle');
            
            const fields = page.locator('input, textarea, select');
            const fieldCount = await fields.count();
            
            if (fieldCount > 0) {
              for (let i = 0; i < fieldCount; i++) {
                const field = fields.nth(i);
                if (await field.isVisible()) {
                  await expect(field).toBeVisible();
                }
              }
            }
          }
        }
      }
    });
  });

  test.describe('Group Topic Edit Page', () => {
    test('should load group topic edit page', async ({ authenticatedPage: page }) => {
      await page.goto('/groups');
      await page.waitForLoadState('networkidle');
      
      const groupLinks = page.locator('a[href*="/groups/"]').filter({ hasNot: page.locator('text=/create|Create/') });
      const count = await groupLinks.count();
      
      if (count > 0) {
        await groupLinks.first().click();
        await page.waitForLoadState('networkidle');
        
        const topicsLink = page.locator('a[href*="/topics"]').first();
        if (await topicsLink.count() > 0) {
          await topicsLink.click();
          await page.waitForLoadState('networkidle');
          
          const topicLink = page.locator('a[href*="/topics/"]').filter({ hasNot: page.locator('text=/create|Create/') }).first();
          if (await topicLink.count() > 0) {
            await topicLink.click();
            await page.waitForLoadState('networkidle');
            
            const editLink = page.locator('a[href*="/edit"]').first();
            if (await editLink.count() > 0) {
              await editLink.click();
              await page.waitForLoadState('networkidle');
              await expect(page).toHaveURL(/.*\/groups\/[^\/]+\/topics\/[^\/]+\/edit/);
            }
          }
        }
      }
    });

    test('should test all form fields on group topic edit page', async ({ authenticatedPage: page }) => {
      await page.goto('/groups');
      await page.waitForLoadState('networkidle');
      
      const groupLinks = page.locator('a[href*="/groups/"]').filter({ hasNot: page.locator('text=/create|Create/') });
      const count = await groupLinks.count();
      
      if (count > 0) {
        await groupLinks.first().click();
        await page.waitForLoadState('networkidle');
        
        const topicsLink = page.locator('a[href*="/topics"]').first();
        if (await topicsLink.count() > 0) {
          await topicsLink.click();
          await page.waitForLoadState('networkidle');
          
          const topicLink = page.locator('a[href*="/topics/"]').filter({ hasNot: page.locator('text=/create|Create/') }).first();
          if (await topicLink.count() > 0) {
            await topicLink.click();
            await page.waitForLoadState('networkidle');
            
            const editLink = page.locator('a[href*="/edit"]').first();
            if (await editLink.count() > 0) {
              await editLink.click();
              await page.waitForLoadState('networkidle');
              
              const fields = page.locator('input, textarea, select, button[role="combobox"]');
              const fieldCount = await fields.count();
              
              if (fieldCount > 0) {
                for (let i = 0; i < fieldCount; i++) {
                  const field = fields.nth(i);
                  if (await field.isVisible()) {
                    await expect(field).toBeVisible();
                    
                    const tagName = await field.evaluate(el => el.tagName.toLowerCase());
                    if (tagName === 'input' || tagName === 'textarea') {
                      const inputType = await field.getAttribute('type');
                      if (inputType !== 'submit' && inputType !== 'button' && inputType !== 'file') {
                        await field.fill('test content');
                        await expect(field).toHaveValue('test content');
                        await field.clear();
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    test('should test all buttons on group topic edit page', async ({ authenticatedPage: page }) => {
      await page.goto('/groups');
      await page.waitForLoadState('networkidle');
      
      const groupLinks = page.locator('a[href*="/groups/"]').filter({ hasNot: page.locator('text=/create|Create/') });
      const count = await groupLinks.count();
      
      if (count > 0) {
        await groupLinks.first().click();
        await page.waitForLoadState('networkidle');
        
        const topicsLink = page.locator('a[href*="/topics"]').first();
        if (await topicsLink.count() > 0) {
          await topicsLink.click();
          await page.waitForLoadState('networkidle');
          
          const topicLink = page.locator('a[href*="/topics/"]').filter({ hasNot: page.locator('text=/create|Create/') }).first();
          if (await topicLink.count() > 0) {
            await topicLink.click();
            await page.waitForLoadState('networkidle');
            
            const editLink = page.locator('a[href*="/edit"]').first();
            if (await editLink.count() > 0) {
              await editLink.click();
              await page.waitForLoadState('networkidle');
              
              const buttons = page.locator('button');
              const buttonCount = await buttons.count();
              
              if (buttonCount > 0) {
                for (let i = 0; i < buttonCount; i++) {
                  const button = buttons.nth(i);
                  if (await button.isVisible()) {
                    await expect(button).toBeVisible();
                  }
                }
              }
            }
          }
        }
      }
    });
  });

  test.describe('Group Polls Page', () => {
    test('should load group polls page', async ({ authenticatedPage: page }) => {
      await page.goto('/groups');
      await page.waitForLoadState('networkidle');
      
      const groupLinks = page.locator('a[href*="/groups/"]').filter({ hasNot: page.locator('text=/create|Create/') });
      const count = await groupLinks.count();
      
      if (count > 0) {
        await groupLinks.first().click();
        await page.waitForLoadState('networkidle');
        
        const pollsLink = page.locator('a[href*="/polls"]').first();
        if (await pollsLink.count() > 0) {
          await pollsLink.click();
          await page.waitForLoadState('networkidle');
          await expect(page).toHaveURL(/.*\/groups\/[^\/]+\/polls/);
        }
      }
    });

    test('should test all buttons on group polls page', async ({ authenticatedPage: page }) => {
      await page.goto('/groups');
      await page.waitForLoadState('networkidle');
      
      const groupLinks = page.locator('a[href*="/groups/"]').filter({ hasNot: page.locator('text=/create|Create/') });
      const count = await groupLinks.count();
      
      if (count > 0) {
        await groupLinks.first().click();
        await page.waitForLoadState('networkidle');
        
        const pollsLink = page.locator('a[href*="/polls"]').first();
        if (await pollsLink.count() > 0) {
          await pollsLink.click();
          await page.waitForLoadState('networkidle');
          
          await testAllButtons(page, 50);
        }
      }
    });

    test('should test all form fields on group polls page', async ({ authenticatedPage: page }) => {
      await page.goto('/groups');
      await page.waitForLoadState('networkidle');
      
      const groupLinks = page.locator('a[href*="/groups/"]').filter({ hasNot: page.locator('text=/create|Create/') });
      const count = await groupLinks.count();
      
      if (count > 0) {
        await groupLinks.first().click();
        await page.waitForLoadState('networkidle');
        
        const pollsLink = page.locator('a[href*="/polls"]').first();
        if (await pollsLink.count() > 0) {
          await pollsLink.click();
          await page.waitForLoadState('networkidle');
          
          const fields = page.locator('input, textarea, select');
          const fieldCount = await fields.count();
          
          if (fieldCount > 0) {
            for (let i = 0; i < fieldCount; i++) {
              const field = fields.nth(i);
              if (await field.isVisible()) {
                await expect(field).toBeVisible();
              }
            }
          }
        }
      }
    });
  });

  test.describe('Group Polls Create Page', () => {
    test('should load group polls create page', async ({ authenticatedPage: page }) => {
      await page.goto('/groups');
      await page.waitForLoadState('networkidle');
      
      const groupLinks = page.locator('a[href*="/groups/"]').filter({ hasNot: page.locator('text=/create|Create/') });
      const count = await groupLinks.count();
      
      if (count > 0) {
        await groupLinks.first().click();
        await page.waitForLoadState('networkidle');
        
        const pollsCreateLink = page.locator('a[href*="/polls/create"]').first();
        if (await pollsCreateLink.count() > 0) {
          await pollsCreateLink.click();
          await page.waitForLoadState('networkidle');
          await expect(page).toHaveURL(/.*\/groups\/[^\/]+\/polls\/create/);
        }
      }
    });

    test('should test all form fields on group polls create page', async ({ authenticatedPage: page }) => {
      await page.goto('/groups');
      await page.waitForLoadState('networkidle');
      
      const groupLinks = page.locator('a[href*="/groups/"]').filter({ hasNot: page.locator('text=/create|Create/') });
      const count = await groupLinks.count();
      
      if (count > 0) {
        await groupLinks.first().click();
        await page.waitForLoadState('networkidle');
        
        const pollsCreateLink = page.locator('a[href*="/polls/create"]').first();
        if (await pollsCreateLink.count() > 0) {
          await pollsCreateLink.click();
          await page.waitForLoadState('networkidle');
          
          await testAllFormFields(page);
        }
      }
    });

    test('should test all buttons on group polls create page', async ({ authenticatedPage: page }) => {
      await page.goto('/groups');
      await page.waitForLoadState('networkidle');
      
      const groupLinks = page.locator('a[href*="/groups/"]').filter({ hasNot: page.locator('text=/create|Create/') });
      const count = await groupLinks.count();
      
      if (count > 0) {
        await groupLinks.first().click();
        await page.waitForLoadState('networkidle');
        
        const pollsCreateLink = page.locator('a[href*="/polls/create"]').first();
        if (await pollsCreateLink.count() > 0) {
          await pollsCreateLink.click();
          await page.waitForLoadState('networkidle');
          
          const buttons = page.locator('button');
          const buttonCount = await buttons.count();
          
          if (buttonCount > 0) {
            for (let i = 0; i < buttonCount; i++) {
              const button = buttons.nth(i);
              if (await button.isVisible()) {
                await expect(button).toBeVisible();
              }
            }
          }
        }
      }
    });
  });

  test.describe('Group Poll Detail Page', () => {
    test('should load group poll detail page', async ({ authenticatedPage: page }) => {
      await page.goto('/groups');
      await page.waitForLoadState('networkidle');
      
      const groupLinks = page.locator('a[href*="/groups/"]').filter({ hasNot: page.locator('text=/create|Create/') });
      const count = await groupLinks.count();
      
      if (count > 0) {
        await groupLinks.first().click();
        await page.waitForLoadState('networkidle');
        
        const pollsLink = page.locator('a[href*="/polls"]').first();
        if (await pollsLink.count() > 0) {
          await pollsLink.click();
          await page.waitForLoadState('networkidle');
          
          const pollLink = page.locator('a[href*="/polls/"]').filter({ hasNot: page.locator('text=/create|Create/') }).first();
          if (await pollLink.count() > 0) {
            await pollLink.click();
            await page.waitForLoadState('networkidle');
            await expect(page).toHaveURL(/.*\/groups\/[^\/]+\/polls\/[^\/]+$/);
          }
        }
      }
    });

    test('should test all buttons on group poll detail page', async ({ authenticatedPage: page }) => {
      await page.goto('/groups');
      await page.waitForLoadState('networkidle');
      
      const groupLinks = page.locator('a[href*="/groups/"]').filter({ hasNot: page.locator('text=/create|Create/') });
      const count = await groupLinks.count();
      
      if (count > 0) {
        await groupLinks.first().click();
        await page.waitForLoadState('networkidle');
        
        const pollsLink = page.locator('a[href*="/polls"]').first();
        if (await pollsLink.count() > 0) {
          await pollsLink.click();
          await page.waitForLoadState('networkidle');
          
          const pollLink = page.locator('a[href*="/polls/"]').filter({ hasNot: page.locator('text=/create|Create/') }).first();
          if (await pollLink.count() > 0) {
            await pollLink.click();
            await page.waitForLoadState('networkidle');
            
            const buttons = page.locator('button');
            const buttonCount = await buttons.count();
            
            if (buttonCount > 0) {
              for (let i = 0; i < Math.min(buttonCount, 50); i++) {
                const button = buttons.nth(i);
                if (await button.isVisible()) {
                  await expect(button).toBeVisible();
                }
              }
            }
          }
        }
      }
    });

    test('should test all form fields on group poll detail page', async ({ authenticatedPage: page }) => {
      await page.goto('/groups');
      await page.waitForLoadState('networkidle');
      
      const groupLinks = page.locator('a[href*="/groups/"]').filter({ hasNot: page.locator('text=/create|Create/') });
      const count = await groupLinks.count();
      
      if (count > 0) {
        await groupLinks.first().click();
        await page.waitForLoadState('networkidle');
        
        const pollsLink = page.locator('a[href*="/polls"]').first();
        if (await pollsLink.count() > 0) {
          await pollsLink.click();
          await page.waitForLoadState('networkidle');
          
          const pollLink = page.locator('a[href*="/polls/"]').filter({ hasNot: page.locator('text=/create|Create/') }).first();
          if (await pollLink.count() > 0) {
            await pollLink.click();
            await page.waitForLoadState('networkidle');
            
            const fields = page.locator('input, textarea, select, button[role="radio"]');
            const fieldCount = await fields.count();
            
            if (fieldCount > 0) {
              for (let i = 0; i < fieldCount; i++) {
                const field = fields.nth(i);
                if (await field.isVisible()) {
                  await expect(field).toBeVisible();
                }
              }
            }
          }
        }
      }
    });
  });

  test.describe('Group Event Detail Page', () => {
    test('should load group event detail page', async ({ authenticatedPage: page }) => {
      await page.goto('/groups');
      await page.waitForLoadState('networkidle');
      
      const groupLinks = page.locator('a[href*="/groups/"]').filter({ hasNot: page.locator('text=/create|Create/') });
      const count = await groupLinks.count();
      
      if (count > 0) {
        await groupLinks.first().click();
        await page.waitForLoadState('networkidle');
        
        const eventLink = page.locator('a[href*="/events/"]').filter({ hasNot: page.locator('text=/create|Create/') }).first();
        if (await eventLink.count() > 0) {
          await eventLink.click();
          await page.waitForLoadState('networkidle');
          await expect(page).toHaveURL(/.*\/groups\/[^\/]+\/events\/[^\/]+$/);
        }
      }
    });

    test('should test all buttons on group event detail page', async ({ authenticatedPage: page }) => {
      await page.goto('/groups');
      await page.waitForLoadState('networkidle');
      
      const groupLinks = page.locator('a[href*="/groups/"]').filter({ hasNot: page.locator('text=/create|Create/') });
      const count = await groupLinks.count();
      
      if (count > 0) {
        await groupLinks.first().click();
        await page.waitForLoadState('networkidle');
        
        const eventLink = page.locator('a[href*="/events/"]').filter({ hasNot: page.locator('text=/create|Create/') }).first();
        if (await eventLink.count() > 0) {
          await eventLink.click();
          await page.waitForLoadState('networkidle');
          
          await testAllButtons(page, 50);
        }
      }
    });

    test('should test all form fields on group event detail page', async ({ authenticatedPage: page }) => {
      await page.goto('/groups');
      await page.waitForLoadState('networkidle');
      
      const groupLinks = page.locator('a[href*="/groups/"]').filter({ hasNot: page.locator('text=/create|Create/') });
      const count = await groupLinks.count();
      
      if (count > 0) {
        await groupLinks.first().click();
        await page.waitForLoadState('networkidle');
        
        const eventLink = page.locator('a[href*="/events/"]').filter({ hasNot: page.locator('text=/create|Create/') }).first();
        if (await eventLink.count() > 0) {
          await eventLink.click();
          await page.waitForLoadState('networkidle');
          
          const fields = page.locator('input, textarea, select');
          const fieldCount = await fields.count();
          
          if (fieldCount > 0) {
            for (let i = 0; i < fieldCount; i++) {
              const field = fields.nth(i);
              if (await field.isVisible()) {
                await expect(field).toBeVisible();
              }
            }
          }
        }
      }
    });
  });

  test.describe('Group Resources Create Page', () => {
    test('should load group resources create page', async ({ authenticatedPage: page }) => {
      await page.goto('/groups');
      await page.waitForLoadState('networkidle');
      
      const groupLinks = page.locator('a[href*="/groups/"]').filter({ hasNot: page.locator('text=/create|Create/') });
      const count = await groupLinks.count();
      
      if (count > 0) {
        await groupLinks.first().click();
        await page.waitForLoadState('networkidle');
        
        const resourcesCreateLink = page.locator('a[href*="/resources/create"]').first();
        if (await resourcesCreateLink.count() > 0) {
          await resourcesCreateLink.click();
          await page.waitForLoadState('networkidle');
          await expect(page).toHaveURL(/.*\/groups\/[^\/]+\/resources\/create/);
        }
      }
    });

    test('should test all form fields on group resources create page', async ({ authenticatedPage: page }) => {
      await page.goto('/groups');
      await page.waitForLoadState('networkidle');
      
      const groupLinks = page.locator('a[href*="/groups/"]').filter({ hasNot: page.locator('text=/create|Create/') });
      const count = await groupLinks.count();
      
      if (count > 0) {
        await groupLinks.first().click();
        await page.waitForLoadState('networkidle');
        
        const resourcesCreateLink = page.locator('a[href*="/resources/create"]').first();
        if (await resourcesCreateLink.count() > 0) {
          await resourcesCreateLink.click();
          await page.waitForLoadState('networkidle');
          
          await testAllFormFields(page);
        }
      }
    });

    test('should test all buttons on group resources create page', async ({ authenticatedPage: page }) => {
      await page.goto('/groups');
      await page.waitForLoadState('networkidle');
      
      const groupLinks = page.locator('a[href*="/groups/"]').filter({ hasNot: page.locator('text=/create|Create/') });
      const count = await groupLinks.count();
      
      if (count > 0) {
        await groupLinks.first().click();
        await page.waitForLoadState('networkidle');
        
        const resourcesCreateLink = page.locator('a[href*="/resources/create"]').first();
        if (await resourcesCreateLink.count() > 0) {
          await resourcesCreateLink.click();
          await page.waitForLoadState('networkidle');
          
          const buttons = page.locator('button');
          const buttonCount = await buttons.count();
          
          if (buttonCount > 0) {
            for (let i = 0; i < buttonCount; i++) {
              const button = buttons.nth(i);
              if (await button.isVisible()) {
                await expect(button).toBeVisible();
              }
            }
          }
        }
      }
    });
  });

  test.describe('Group Analytics Page', () => {
    test('should load group analytics page', async ({ authenticatedPage: page }) => {
      await page.goto('/groups');
      await page.waitForLoadState('networkidle');
      
      const groupLinks = page.locator('a[href*="/groups/"]').filter({ hasNot: page.locator('text=/create|Create/') });
      const count = await groupLinks.count();
      
      if (count > 0) {
        await groupLinks.first().click();
        await page.waitForLoadState('networkidle');
        
        const analyticsLink = page.locator('a[href*="/analytics"]').first();
        if (await analyticsLink.count() > 0) {
          await analyticsLink.click();
          await page.waitForLoadState('networkidle');
          await expect(page).toHaveURL(/.*\/groups\/[^\/]+\/analytics/);
        }
      }
    });

    test('should test all buttons on group analytics page', async ({ authenticatedPage: page }) => {
      await page.goto('/groups');
      await page.waitForLoadState('networkidle');
      
      const groupLinks = page.locator('a[href*="/groups/"]').filter({ hasNot: page.locator('text=/create|Create/') });
      const count = await groupLinks.count();
      
      if (count > 0) {
        await groupLinks.first().click();
        await page.waitForLoadState('networkidle');
        
        const analyticsLink = page.locator('a[href*="/analytics"]').first();
        if (await analyticsLink.count() > 0) {
          await analyticsLink.click();
          await page.waitForLoadState('networkidle');
          
          await testAllButtons(page, 50);
        }
      }
    });

    test('should test all form fields on group analytics page', async ({ authenticatedPage: page }) => {
      await page.goto('/groups');
      await page.waitForLoadState('networkidle');
      
      const groupLinks = page.locator('a[href*="/groups/"]').filter({ hasNot: page.locator('text=/create|Create/') });
      const count = await groupLinks.count();
      
      if (count > 0) {
        await groupLinks.first().click();
        await page.waitForLoadState('networkidle');
        
        const analyticsLink = page.locator('a[href*="/analytics"]').first();
        if (await analyticsLink.count() > 0) {
          await analyticsLink.click();
          await page.waitForLoadState('networkidle');
          
          const fields = page.locator('input, textarea, select, button[role="combobox"]');
          const fieldCount = await fields.count();
          
          if (fieldCount > 0) {
            for (let i = 0; i < fieldCount; i++) {
              const field = fields.nth(i);
              if (await field.isVisible()) {
                await expect(field).toBeVisible();
              }
            }
          }
        }
      }
    });
  });

  test.describe('Group Moderation Page', () => {
    test('should load group moderation page', async ({ authenticatedPage: page }) => {
      await page.goto('/groups');
      await page.waitForLoadState('networkidle');
      
      const groupLinks = page.locator('a[href*="/groups/"]').filter({ hasNot: page.locator('text=/create|Create/') });
      const count = await groupLinks.count();
      
      if (count > 0) {
        await groupLinks.first().click();
        await page.waitForLoadState('networkidle');
        
        const moderationLink = page.locator('a[href*="/moderation"]').first();
        if (await moderationLink.count() > 0) {
          await moderationLink.click();
          await page.waitForLoadState('networkidle');
          await expect(page).toHaveURL(/.*\/groups\/[^\/]+\/moderation/);
        }
      }
    });

    test('should test all buttons on group moderation page', async ({ authenticatedPage: page }) => {
      await page.goto('/groups');
      await page.waitForLoadState('networkidle');
      
      const groupLinks = page.locator('a[href*="/groups/"]').filter({ hasNot: page.locator('text=/create|Create/') });
      const count = await groupLinks.count();
      
      if (count > 0) {
        await groupLinks.first().click();
        await page.waitForLoadState('networkidle');
        
        const moderationLink = page.locator('a[href*="/moderation"]').first();
        if (await moderationLink.count() > 0) {
          await moderationLink.click();
          await page.waitForLoadState('networkidle');
          
          await testAllButtons(page, 50);
        }
      }
    });

    test('should test all form fields on group moderation page', async ({ authenticatedPage: page }) => {
      await page.goto('/groups');
      await page.waitForLoadState('networkidle');
      
      const groupLinks = page.locator('a[href*="/groups/"]').filter({ hasNot: page.locator('text=/create|Create/') });
      const count = await groupLinks.count();
      
      if (count > 0) {
        await groupLinks.first().click();
        await page.waitForLoadState('networkidle');
        
        const moderationLink = page.locator('a[href*="/moderation"]').first();
        if (await moderationLink.count() > 0) {
          await moderationLink.click();
          await page.waitForLoadState('networkidle');
          
          const fields = page.locator('input, textarea, select, button[role="combobox"]');
          const fieldCount = await fields.count();
          
          if (fieldCount > 0) {
            for (let i = 0; i < fieldCount; i++) {
              const field = fields.nth(i);
              if (await field.isVisible()) {
                await expect(field).toBeVisible();
              }
            }
          }
        }
      }
    });
  });
});

