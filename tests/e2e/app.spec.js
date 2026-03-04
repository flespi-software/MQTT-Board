import { test, expect } from '@playwright/test'

const BROKER_HOST = 'wss://mqtt.flespi.io'
const BROKER_USERNAME = process.env.MQTT_TOKEN

test.describe('MQTT Board App', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.reload()
  })



  test.describe('Initial Load', () => {
    test('should display app title', async ({ page }) => {
      await page.goto('/')
      await expect(page.getByText('MQTT Board')).toBeVisible()
    })

    test('should show "No clients" message when no clients exist', async ({ page }) => {
      await page.goto('/')
      await expect(page.getByText('No clients')).toBeVisible()
    })

    test('should display "Create client" button when no clients', async ({ page }) => {
      await page.goto('/')
      await expect(page.getByRole('button', { name: 'Create client' })).toBeVisible()
    })

    test('should display FAB add button', async ({ page }) => {
      await page.goto('/')
      await expect(page.locator('.q-btn--fab')).toBeVisible()
    })

    test('should display GitHub fork button on desktop', async ({ page }) => {
      await page.goto('/')
      await expect(page.getByRole('button', { name: /fork me/i })).toBeVisible()
    })
  })

  test.describe('Client Creation', () => {
    test('should open settings modal when clicking FAB button', async ({ page }) => {
      await page.goto('/')
      await page.locator('.q-btn--fab').click()

      // Settings modal should appear - check for Host label which is in the form
      await expect(page.locator('.q-dialog')).toBeVisible()
      await expect(page.getByLabel('Host')).toBeVisible()
    })

    test('should open settings modal when clicking Create client button', async ({ page }) => {
      await page.goto('/')
      await page.getByRole('button', { name: 'Create client' }).click()

      await expect(page.locator('.q-dialog')).toBeVisible()
      await expect(page.getByLabel('Host')).toBeVisible()
    })

    test('should show default host in settings modal', async ({ page }) => {
      await page.goto('/')
      await page.locator('.q-btn--fab').click()

      // The host field should contain wss://mqtt.flespi.io by default
      const hostInput = page.getByLabel('Host')
      await expect(hostInput).toBeVisible()
      await expect(hostInput).toHaveValue('wss://mqtt.flespi.io')
    })

    test('should have save button in settings modal', async ({ page }) => {
      await page.goto('/')
      await page.locator('.q-btn--fab').click()

      await expect(page.getByRole('button', { name: /save/i })).toBeVisible()
    })

    test('should create client when saving settings', async ({ page }) => {
      await page.goto('/')
      await page.locator('.q-btn--fab').click()

      // Wait for modal
      await expect(page.locator('.q-dialog')).toBeVisible()

      // Click save
      await page.getByRole('button', { name: /save/i }).click()

      // Modal should close and client card should appear
      await expect(page.getByText('No clients')).not.toBeVisible({ timeout: 5000 })

      // Client card should be visible
      await expect(page.locator('.client__item')).toBeVisible()
    })
  })

  test.describe('Client Card', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/')
      await page.locator('.q-btn--fab').click()
      await expect(page.locator('.q-dialog')).toBeVisible()
      await page.getByRole('button', { name: /save/i }).click()
      await expect(page.locator('.client__item')).toBeVisible()
    })

    test('should display client host on card', async ({ page }) => {
      await expect(page.getByText('wss://mqtt.flespi.io')).toBeVisible()
    })

    test('should have action buttons on card', async ({ page }) => {
      // Card should have action buttons (play, settings, delete)
      const actionBtns = page.locator('.client__item .q-card .q-btn')
      await expect(actionBtns.first()).toBeVisible()
    })

    test('should have settings button', async ({ page }) => {
      await expect(page.locator('.client__item .q-btn').filter({ has: page.locator('[class*="mdi-cog"]') })).toBeVisible()
    })

    test('should have delete button', async ({ page }) => {
      await expect(page.locator('.client__item .q-btn').filter({ has: page.locator('[class*="mdi-delete"]') })).toBeVisible()
    })

    test('should open client when clicking on card', async ({ page }) => {
      await page.locator('.client__item .q-card').click()

      // Should show online/offline status
      await expect(page.getByText(/online|offline/i).first()).toBeVisible()
    })

    test('should delete client when clicking delete button', async ({ page }) => {
      // Delete button uses mdi-delete icon
      const deleteBtn = page.locator('.client__item .q-btn').filter({ has: page.locator('[class*="mdi-delete"]') })
      await deleteBtn.click()

      // A confirmation dialog should appear
      await expect(page.getByText('Confirm')).toBeVisible()

      // Click OK to confirm
      await page.getByRole('button', { name: /ok/i }).click()

      // Client should be removed
      await expect(page.getByText('No clients')).toBeVisible()
    })
  })

  test.describe('Active Client View', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/')
      await page.locator('.q-btn--fab').click()
      await page.getByRole('button', { name: /save/i }).click()
      await page.locator('.client__item .q-card').click()
      // Wait for active client view
      await expect(page.getByText(/online|offline/i).first()).toBeVisible()
    })

    test('should show client status indicator', async ({ page }) => {
      await expect(page.getByText(/online|offline/i).first()).toBeVisible()
    })

    test('should have settings cog button in header', async ({ page }) => {
      await expect(page.locator('.q-toolbar .q-btn').filter({ has: page.locator('[class*="mdi-cog"]') })).toBeVisible()
    })

    test('should have add pane button', async ({ page }) => {
      await expect(page.locator('.q-toolbar .q-btn').filter({ has: page.locator('[class*="mdi-plus"]') })).toBeVisible()
    })

    test('should show add pane menu when clicking plus button', async ({ page }) => {
      await page.locator('.q-toolbar .q-btn').filter({ has: page.locator('[class*="mdi-plus"]') }).click()

      await expect(page.getByText('Add pane')).toBeVisible()
      await expect(page.locator('.q-menu').getByText('Publisher')).toBeVisible()
      await expect(page.locator('.q-menu').getByText('Subscriber')).toBeVisible()
    })

    test('should have menu toggle button', async ({ page }) => {
      await expect(page.locator('.q-toolbar .q-btn').filter({ has: page.locator('.mdi-menu') })).toBeVisible()
    })

    test('should have close button', async ({ page }) => {
      await expect(page.locator('.q-toolbar .q-btn').filter({ has: page.locator('[class*="mdi-close"]') })).toBeVisible()
    })

    test('should return to client list when clicking close', async ({ page }) => {
      await page.locator('.q-toolbar .q-btn').filter({ has: page.locator('[class*="mdi-close"]') }).click()

      await expect(page.locator('.client__item')).toBeVisible()
    })
  })

  test.describe('Publisher Pane', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/')
      await page.locator('.q-btn--fab').click()
      await page.getByRole('button', { name: /save/i }).click()
      await page.locator('.client__item .q-card').click()
      await expect(page.getByText(/online|offline/i).first()).toBeVisible()

      // Add publisher
      await page.locator('.q-toolbar .q-btn').filter({ has: page.locator('[class*="mdi-plus"]') }).click()
      await page.locator('.q-menu').getByText('Publisher').click()
    })

    test('should show publisher pane with title', async ({ page }) => {
      await expect(page.getByText('Publisher', { exact: true }).first()).toBeVisible()
    })

    test('should have topic input', async ({ page }) => {
      // Publisher has a topic input
      await expect(page.getByLabel('Topic').first()).toBeVisible()
    })

    test('should have message input', async ({ page }) => {
      // Publisher payload field is labeled "Message"
      await expect(page.getByLabel('Message').first()).toBeVisible()
    })

    test('should have publish button', async ({ page }) => {
      // Publish button uses mdi-send icon - use first to handle duplicates
      await expect(page.locator('.q-btn').filter({ has: page.locator('[class*="mdi-send"]') }).first()).toBeVisible()
    })
  })

  test.describe('Subscriber Pane', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/')
      await page.locator('.q-btn--fab').click()
      await page.getByRole('button', { name: /save/i }).click()
      await page.locator('.client__item .q-card').click()
      await expect(page.getByText(/online|offline/i).first()).toBeVisible()

      // Add subscriber
      await page.locator('.q-toolbar .q-btn').filter({ has: page.locator('[class*="mdi-plus"]') }).click()
      await page.locator('.q-menu').getByText('Subscriber').click()
    })

    test('should show subscriber pane with title', async ({ page }) => {
      await expect(page.getByText('Subscriber', { exact: true }).first()).toBeVisible()
    })

    test('should have topic input', async ({ page }) => {
      await expect(page.getByLabel('Topic').first()).toBeVisible()
    })

    test('should have subscribe button', async ({ page }) => {
      // Subscribe button uses mdi-play icon
      await expect(page.locator('.q-btn[title="Subscribe"]').or(
        page.locator('.q-btn').filter({ has: page.locator('[class*="mdi-play"]') })
      ).first()).toBeVisible()
    })
  })

  test.describe('Subscriber Drawer Play Button', () => {
    test.skip(!BROKER_USERNAME, 'MQTT_TOKEN env var is required. Run with: MQTT_TOKEN=<your-token> npx playwright test')

    test.beforeEach(async ({ page }) => {
      await page.goto('/')
      await page.locator('.q-btn--fab').click()
      await expect(page.locator('.q-dialog')).toBeVisible()

      const hostInput = page.getByLabel('Host')
      await hostInput.clear()
      await hostInput.fill(BROKER_HOST)

      const usernameInput = page.getByLabel('Username')
      await usernameInput.clear()
      await usernameInput.fill(BROKER_USERNAME)

      await page.getByRole('button', { name: /save/i }).click()
      await page.locator('.client__item .q-card').click()
      await expect(page.getByText(/online/i).first()).toBeVisible({ timeout: 15000 })
    })

    test('should show pause button in subscriber pane after clicking play in drawer', async ({ page }) => {
      // The default client has a subscriber with topic "#"
      // Ensure the subscriber pane shows a play button (not yet subscribed)
      const subscriberPane = page.locator('.mqtt-client__subscriber')
      await expect(subscriberPane.locator('.q-btn').filter({ has: page.locator('[class*="mdi-play"]') }).first()).toBeVisible()

      // The right drawer with Panes should already be visible on desktop viewport
      // If not, open it via the menu button
      const drawer = page.locator('.q-drawer')
      if (!await drawer.isVisible()) {
        await page.locator('.q-toolbar .q-btn').filter({ has: page.locator('.mdi-menu') }).click()
        await expect(drawer).toBeVisible()
      }

      // Click the play button on the subscriber entry in the drawer
      const drawerPlayBtn = drawer.locator('.q-btn').filter({ has: page.locator('[class*="mdi-play"]') }).first()
      await expect(drawerPlayBtn).toBeVisible()
      await drawerPlayBtn.click()

      // After subscribing, the subscriber pane should switch to the subscribed view
      // which has a pause button (mdi-pause) instead of the initial play button
      await expect(subscriberPane.locator('.q-btn').filter({ has: page.locator('[class*="mdi-pause"]') }).first()).toBeVisible({ timeout: 10000 })
    })

    test('should show stop button in drawer after subscribing from drawer', async ({ page }) => {
      // The right drawer with Panes should already be visible on desktop viewport
      const drawer = page.locator('.q-drawer')
      if (!await drawer.isVisible()) {
        await page.locator('.q-toolbar .q-btn').filter({ has: page.locator('.mdi-menu') }).click()
        await expect(drawer).toBeVisible()
      }

      // Drawer should show play button for the subscriber
      const drawerSubscriberBtn = drawer.locator('.q-btn').filter({ has: page.locator('[class*="mdi-play"]') }).first()
      await expect(drawerSubscriberBtn).toBeVisible()
      await drawerSubscriberBtn.click()

      // After subscribing, the drawer should show a stop button instead of play
      await expect(drawer.locator('.q-btn').filter({ has: page.locator('[class*="mdi-stop"]') }).first()).toBeVisible({ timeout: 10000 })
    })
  })

  test.describe('Right Drawer Menu', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/')
      await page.locator('.q-btn--fab').click()
      await page.getByRole('button', { name: /save/i }).click()
      await page.locator('.client__item .q-card').click()
      await expect(page.getByText(/online|offline/i).first()).toBeVisible()
    })

    test('should toggle drawer when clicking menu button', async ({ page }) => {
      // Click menu toggle
      await page.locator('.q-toolbar .q-btn').filter({ has: page.locator('.mdi-menu') }).click()

      // Drawer should be visible
      await expect(page.locator('.q-drawer')).toBeVisible()
    })

    test('should show "remove all" button in drawer when entities exist', async ({ page }) => {
      // Add a publisher first
      await page.locator('.q-toolbar .q-btn').filter({ has: page.locator('[class*="mdi-plus"]') }).click()
      await page.locator('.q-menu').getByText('Publisher').click()

      // Open drawer
      await page.locator('.q-toolbar .q-btn').filter({ has: page.locator('.mdi-menu') }).click()

      await expect(page.getByRole('button', { name: /remove all/i })).toBeVisible()
    })
  })

  test.describe('Responsive Behavior', () => {
    test('should adapt to mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      await page.goto('/')

      await expect(page.getByText('MQTT Board')).toBeVisible()
      await expect(page.locator('.q-btn--fab')).toBeVisible()
    })
  })
})
