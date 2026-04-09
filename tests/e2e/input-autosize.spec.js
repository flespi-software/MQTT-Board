import { test, expect } from '@playwright/test'

const LONG_TOPIC = 'devices/sensor-001/telemetry/temperature/readings/hourly/2026/04/09/location/building-a/floor-3/room-317'
const LONG_MESSAGE = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.'

/**
 * Checks that a textarea's visible height fully contains its content
 * (i.e., scrollHeight <= clientHeight — nothing is clipped).
 */
async function assertTextareaFullyVisible (page, selector) {
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(200)

  const isFullyVisible = await page.evaluate((sel) => {
    const textarea = document.querySelector(sel)
    if (!textarea) throw new Error(`Textarea not found: ${sel}`)
    return textarea.scrollHeight <= textarea.clientHeight
  }, selector)
  expect(isFullyVisible).toBe(true)
}

test.describe('Input auto-sizing on load', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.reload()

    // Create client via UI (default client includes a subscriber and a publisher)
    await page.locator('.q-btn--fab').click()
    await expect(page.locator('.q-dialog')).toBeVisible()
    await page.getByRole('button', { name: /save/i }).click()
    await expect(page.locator('.client__item')).toBeVisible()

    // Open client
    await page.locator('.client__item .q-card').click()
    await expect(page.getByText(/online|offline/i).first()).toBeVisible()

    // Navigate to publisher pane and fill with long content
    const publisherPane = page.locator('.mqtt-client__publisher')
    // Click on publisher in footer dots to make it visible
    const footerDots = page.locator('.wrapper__footer .q-btn--round')
    // Default order: subscriber(0), publisher(1), logs(2)
    // Publisher is typically the second pane
    await footerDots.nth(1).click()
    await expect(publisherPane).toBeVisible()

    const publisherTopicInput = publisherPane.locator('.topic-font textarea').first()
    await publisherTopicInput.fill(LONG_TOPIC)
    const publisherMessageInput = publisherPane.locator('textarea').nth(1)
    await publisherMessageInput.fill(LONG_MESSAGE)

    // Navigate to subscriber pane and fill with long topic
    await footerDots.nth(0).click()
    const subscriberPane = page.locator('.mqtt-client__subscriber')
    await expect(subscriberPane).toBeVisible()

    const subscriberTopicInput = subscriberPane.locator('.topic-font textarea').first()
    await subscriberTopicInput.fill(LONG_TOPIC)

    // Wait for localStorage save (500ms debounce)
    await page.waitForTimeout(700)

    // Reload to test the initial render with saved long values
    await page.reload()
  })

  test('publisher topic and message textareas should fully display long content after load', async ({ page }) => {
    await page.locator('.client__item .q-card').click()
    const footerDots = page.locator('.wrapper__footer .q-btn--round')
    await footerDots.nth(1).click()

    const publisherPane = page.locator('.mqtt-client__publisher')
    await expect(publisherPane).toBeVisible()

    await assertTextareaFullyVisible(page, '.mqtt-client__publisher .topic-font textarea')
    await assertTextareaFullyVisible(page, '.mqtt-client__publisher .q-field:nth-of-type(2) textarea')

    // Toggle drawer closed then open — pane width changes, textareas must re-fit
    const menuBtn = page.locator('.q-toolbar .q-btn').filter({ has: page.locator('.mdi-menu') })
    const drawer = page.locator('.q-drawer')

    // Open drawer if not already visible
    if (!await drawer.isVisible()) { await menuBtn.click() }
    await expect(drawer).toBeVisible()
    // Close drawer
    await menuBtn.click()
    await expect(drawer).not.toBeVisible()

    await assertTextareaFullyVisible(page, '.mqtt-client__publisher .topic-font textarea')
    await assertTextareaFullyVisible(page, '.mqtt-client__publisher .q-field:nth-of-type(2) textarea')

    // Re-open drawer
    await menuBtn.click()
    await expect(drawer).toBeVisible()

    await assertTextareaFullyVisible(page, '.mqtt-client__publisher .topic-font textarea')
    await assertTextareaFullyVisible(page, '.mqtt-client__publisher .q-field:nth-of-type(2) textarea')
  })

  test('subscriber topic textarea should fully display long content after load', async ({ page }) => {
    await page.locator('.client__item .q-card').click()
    const footerDots = page.locator('.wrapper__footer .q-btn--round')
    await footerDots.nth(0).click()

    const subscriberPane = page.locator('.mqtt-client__subscriber')
    await expect(subscriberPane).toBeVisible()

    await assertTextareaFullyVisible(page, '.mqtt-client__subscriber .topic-font textarea')

    // Toggle drawer closed then open — pane width changes, textareas must re-fit
    const menuBtn = page.locator('.q-toolbar .q-btn').filter({ has: page.locator('.mdi-menu') })
    const drawer = page.locator('.q-drawer')

    if (!await drawer.isVisible()) { await menuBtn.click() }
    await expect(drawer).toBeVisible()
    await menuBtn.click()
    await expect(drawer).not.toBeVisible()

    await assertTextareaFullyVisible(page, '.mqtt-client__subscriber .topic-font textarea')

    await menuBtn.click()
    await expect(drawer).toBeVisible()

    await assertTextareaFullyVisible(page, '.mqtt-client__subscriber .topic-font textarea')
  })
})
