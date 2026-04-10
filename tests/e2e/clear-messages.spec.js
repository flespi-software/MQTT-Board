import { test, expect } from '@playwright/test'

const BROKER_HOST = 'wss://mqtt.flespi.io'
const BROKER_USERNAME = process.env.MQTT_TOKEN

test.describe('Subscriber Clear Messages', () => {
  test.skip(!BROKER_USERNAME, 'MQTT_TOKEN env var is required. Run with: MQTT_TOKEN=<your-token> npx playwright test')

  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.reload()

    // Create client with flespi broker credentials
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

  async function openDrawerIfNeeded (page) {
    const drawer = page.locator('.q-drawer')
    if (!await drawer.isVisible()) {
      await page.locator('.q-toolbar .q-btn').filter({ has: page.locator('.mdi-menu') }).click()
      await expect(drawer).toBeVisible()
    }
    return drawer
  }

  async function closeDrawerIfOpen (page) {
    const drawer = page.locator('.q-drawer')
    if (await drawer.isVisible()) {
      await page.locator('.q-toolbar .q-btn').filter({ has: page.locator('.mdi-menu') }).click()
      await expect(drawer).not.toBeVisible()
    }
  }

  async function scrollToPane (page, paneName) {
    const drawer = await openDrawerIfNeeded(page)
    await drawer.locator('.q-item').filter({ hasText: paneName }).first().click()
  }

  async function publishMessages (page, topic, payload, count = 3) {
    await scrollToPane(page, 'Publisher')

    const publisherPane = page.locator('.mqtt-client__publisher').first()
    await expect(publisherPane).toBeVisible()

    const publisherTopicInput = publisherPane.getByLabel('Topic', { exact: true })
    await publisherTopicInput.clear()
    await publisherTopicInput.fill(topic)

    const messageInput = publisherPane.getByLabel('Message', { exact: true })
    await messageInput.clear()
    await messageInput.fill(payload)

    const sendBtn = publisherPane.locator('.q-btn').filter({ has: page.locator('[class*="mdi-send"]') }).first()
    for (let i = 0; i < count; i++) {
      await sendBtn.click()
      if (i < count - 1) await page.waitForTimeout(300)
    }
  }

  async function clearSubscriberMessages (page, subscriberPane) {
    // Close the drawer to avoid covering the subscriber toolbar
    await closeDrawerIfOpen(page)
    await page.waitForTimeout(300)

    // Open the dots menu on the subscriber pane
    const dotsBtn = subscriberPane.locator('.q-toolbar .q-btn').filter({ has: page.locator('[class*="mdi-dots-vertical"]') })
    await dotsBtn.click()

    // Wait for the popup menu to appear and click "Clear messages"
    const clearItem = page.locator('.q-menu').getByText('Clear messages')
    await expect(clearItem).toBeVisible()
    await clearItem.click()

    // Wait for the menu to close
    await expect(page.locator('.q-menu')).not.toBeVisible({ timeout: 3000 })
  }

  test('should clear messages in list mode', async ({ page }) => {
    test.setTimeout(90000)
    const topic = 'test/mqtt-board/clear-list-' + Date.now()

    // Configure subscriber
    const subscriberPane = page.locator('.mqtt-client__subscriber').first()
    await expect(subscriberPane).toBeVisible()

    const subscriberTopicInput = subscriberPane.getByLabel('Topic')
    await subscriberTopicInput.clear()
    await subscriberTopicInput.fill(topic)

    // Subscribe
    await subscriberPane.locator('.q-btn').filter({ has: page.locator('[class*="mdi-play"]') }).first().click()
    await expect(subscriberPane.locator('.q-btn').filter({ has: page.locator('[class*="mdi-pause"]') }).first()).toBeVisible({ timeout: 10000 })

    // Publish messages
    await publishMessages(page, topic, '{"test": "list-mode"}')

    // Navigate back to subscriber and verify messages received
    await scrollToPane(page, 'Subscriber')
    await page.waitForTimeout(500)
    await expect(subscriberPane.locator('.message').first()).toBeVisible({ timeout: 15000 })

    // Clear messages
    await clearSubscriberMessages(page, subscriberPane)

    // Messages should be cleared — "No messages" should appear
    await expect(subscriberPane.locator('.subscriber__list--empty')).toBeVisible({ timeout: 5000 })
    await expect(subscriberPane.locator('.subscriber__list--empty')).toHaveText('No messages')

    // Publish again and verify subscriber still receives messages after clearing
    await publishMessages(page, topic, '{"test": "after-clear"}', 1)
    await scrollToPane(page, 'Subscriber')
    await expect(subscriberPane.locator('.message').first()).toBeVisible({ timeout: 15000 })
  })

  test('should clear messages in tree mode', async ({ page }) => {
    test.setTimeout(90000)
    const topic = 'test/mqtt-board/clear-tree-' + Date.now()

    // Configure subscriber
    const subscriberPane = page.locator('.mqtt-client__subscriber').first()
    await expect(subscriberPane).toBeVisible()

    const subscriberTopicInput = subscriberPane.getByLabel('Topic')
    await subscriberTopicInput.clear()
    await subscriberTopicInput.fill(topic)

    // Switch to tree mode before subscribing
    await subscriberPane.locator('.q-btn-toggle').getByText('Tree').click()

    // Subscribe
    await subscriberPane.locator('.q-btn').filter({ has: page.locator('[class*="mdi-play"]') }).first().click()
    await expect(subscriberPane.locator('.q-btn').filter({ has: page.locator('[class*="mdi-pause"]') }).first()).toBeVisible({ timeout: 10000 })

    // Publish messages
    await publishMessages(page, topic, '{"test": "tree-mode"}')

    // Navigate back to subscriber and verify tree view is populated
    await scrollToPane(page, 'Subscriber')
    await page.waitForTimeout(500)
    await expect(subscriberPane.locator('.subscriber__list--tree')).toBeVisible({ timeout: 15000 })

    // Clear messages
    await clearSubscriberMessages(page, subscriberPane)

    // Tree should be gone, "No messages" should appear
    await expect(subscriberPane.locator('.subscriber__list--tree')).not.toBeVisible({ timeout: 5000 })
    await expect(subscriberPane.locator('.subscriber__list--empty')).toBeVisible({ timeout: 5000 })
    await expect(subscriberPane.locator('.subscriber__list--empty')).toHaveText('No messages')

    // Publish again and verify tree view re-populates after clearing
    await publishMessages(page, topic, '{"test": "after-clear"}', 1)
    await scrollToPane(page, 'Subscriber')
    await expect(subscriberPane.locator('.subscriber__list--tree')).toBeVisible({ timeout: 15000 })
  })
})
