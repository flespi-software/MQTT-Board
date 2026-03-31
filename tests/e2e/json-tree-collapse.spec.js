import { test, expect } from '@playwright/test'

const BROKER_HOST = 'wss://mqtt.flespi.io'
const BROKER_USERNAME = process.env.MQTT_TOKEN

test.describe('JsonTree collapsible objects and arrays', () => {
  test.skip(!BROKER_USERNAME, 'MQTT_TOKEN env var is required. Run with: MQTT_TOKEN=<your-token> npx playwright test')

  test('should collapse and expand array and object in received message', async ({ page }) => {
    // Step 1: Connect to flespi mqtt broker
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.reload()

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

    // Step 2: Use the first (default) subscriber and subscribe to my/topic
    const subscriberPane = page.locator('.mqtt-client__subscriber').first()
    await expect(subscriberPane).toBeVisible()

    const subscriberTopicInput = subscriberPane.getByLabel('Topic')
    await subscriberTopicInput.clear()
    await subscriberTopicInput.fill('my/topic')

    // Click subscribe (play button)
    await subscriberPane.locator('.q-btn').filter({ has: page.locator('[class*="mdi-play"]') }).first().click()
    // Wait for subscribed state (pause button appears)
    await expect(subscriberPane.locator('.q-btn').filter({ has: page.locator('[class*="mdi-pause"]') }).first()).toBeVisible({ timeout: 10000 })


    // Step 3: Use the first (default) publisher and send JSON message to my/topic
    const publisherPane = page.locator('.mqtt-client__publisher').first()
    await expect(publisherPane).toBeVisible()

    const publisherTopicInput = publisherPane.getByLabel('Topic', { exact: true })
    await publisherTopicInput.clear()
    await publisherTopicInput.fill('my/topic')

    const messageInput = publisherPane.getByLabel('Message', { exact: true })
    await messageInput.clear()
    await messageInput.fill('{"array": [1,2,3], "object":{"key1": "value1", "key2": "value2"}}')

    // Click publish (send button)
    await publisherPane.locator('.q-btn').filter({ has: page.locator('[class*="mdi-send"]') }).first().click()


    // Step 4: Verify the message is received and JSON tree nodes are collapsible
    const messageCard = subscriberPane.locator('.message').first()
    await expect(messageCard).toBeVisible({ timeout: 10000 })

    // The JsonTree should render "array" and "object" keys with expand/collapse triangles
    // Initially all nodes are expanded (mdi-menu-down icons visible)
    const arrayToggle = messageCard.locator('.cursor-pointer').filter({ hasText: 'array' })
    const objectToggle = messageCard.locator('.cursor-pointer').filter({ hasText: 'object' })

    await expect(arrayToggle).toBeVisible()
    await expect(objectToggle).toBeVisible()

    // Both should have mdi-menu-down (expanded) initially
    await expect(arrayToggle.locator('.mdi-menu-down')).toBeVisible()
    await expect(objectToggle.locator('.mdi-menu-down')).toBeVisible()


    // Collapse the array by clicking its toggle
    await arrayToggle.click()
    // Array should now show mdi-menu-right (collapsed)
    await expect(arrayToggle.locator('.mdi-menu-right')).toBeVisible()
    // Object should still be expanded
    await expect(objectToggle.locator('.mdi-menu-down')).toBeVisible()


    // Collapse the object by clicking its toggle
    await objectToggle.click()
    await expect(objectToggle.locator('.mdi-menu-right')).toBeVisible()


    // Expand the array back
    await arrayToggle.click()
    await expect(arrayToggle.locator('.mdi-menu-down')).toBeVisible()


    // Expand the object back
    await objectToggle.click()
    await expect(objectToggle.locator('.mdi-menu-down')).toBeVisible()

  })
})
