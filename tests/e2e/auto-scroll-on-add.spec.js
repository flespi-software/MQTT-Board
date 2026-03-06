import { test, expect } from '@playwright/test'

const BROKER_HOST = 'wss://mqtt.flespi.io'
const BROKER_USERNAME = process.env.MQTT_TOKEN

test.describe('Auto-scroll on pane add', () => {
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

  async function addPane (page, type) {
    await page.locator('.q-toolbar .q-btn').filter({ has: page.locator('[class*="mdi-plus"]') }).click()
    await page.locator('.q-menu').getByText(type).click()
    await expect(page.locator('.q-menu')).not.toBeVisible()
  }

  function getWrapper (page) {
    return page.locator('.client__wrapper')
  }

  function getPanes (page) {
    return page.locator('.client__wrapper > div.col')
  }

  async function isPaneVisible (page, paneIndex) {
    const wrapper = getWrapper(page)
    return wrapper.evaluate((wrapperEl, idx) => {
      const panes = wrapperEl.querySelectorAll(':scope > div.col')
      const pane = panes[idx]
      if (!pane) return false
      const wrapperRect = wrapperEl.getBoundingClientRect()
      const paneRect = pane.getBoundingClientRect()
      return paneRect.right <= wrapperRect.right + 5 && paneRect.left >= wrapperRect.left - 5
    }, paneIndex)
  }

  async function isLastPaneVisible (page) {
    const count = await getPanes(page).count()
    return isPaneVisible(page, count - 1)
  }

  function getFooterDots (page) {
    return page.locator('.wrapper__footer .q-btn--round')
  }

  async function openDrawerIfNeeded (page) {
    const drawer = page.locator('.q-drawer')
    if (!await drawer.isVisible()) {
      await page.locator('.q-toolbar .q-btn').filter({ has: page.locator('.mdi-menu') }).click()
      await expect(drawer).toBeVisible()
    }
    return drawer
  }

  test('should auto-scroll to show newly added publisher', async ({ page }) => {
    // Add enough publishers to overflow the full screen
    for (let i = 0; i < 6; i++) {
      await addPane(page, 'Publisher')
    }
    await page.waitForTimeout(500)
    expect(await isLastPaneVisible(page)).toBe(true)

    // Navigate to the first pane via footer dot
    const firstDot = getFooterDots(page).first()
    await firstDot.click()
    await page.waitForTimeout(500)
    expect(await isPaneVisible(page, 0)).toBe(true)

    // Add another publisher — should auto-scroll to show it
    await addPane(page, 'Publisher')
    await page.waitForTimeout(500)
    expect(await isLastPaneVisible(page)).toBe(true)
  })

  test('should auto-scroll to show newly added subscriber', async ({ page }) => {
    for (let i = 0; i < 6; i++) {
      await addPane(page, 'Subscriber')
    }
    await page.waitForTimeout(500)
    expect(await isLastPaneVisible(page)).toBe(true)

    // Navigate to the first pane via entities menu
    const drawer = await openDrawerIfNeeded(page)
    const firstEntity = drawer.locator('.q-item').first()
    await firstEntity.click()
    await page.waitForTimeout(500)
    expect(await isPaneVisible(page, 0)).toBe(true)

    // Add another subscriber — should auto-scroll to show it
    await addPane(page, 'Subscriber')
    await page.waitForTimeout(500)
    expect(await isLastPaneVisible(page)).toBe(true)
  })

  test('should scroll wrapper to the right after each pane addition', async ({ page }) => {
    const wrapper = getWrapper(page)
    const scrollPositions = []

    // Add 6 publishers, tracking scroll position after each
    for (let i = 0; i < 6; i++) {
      await addPane(page, 'Publisher')
      await page.waitForTimeout(500)
      scrollPositions.push(await wrapper.evaluate(el => el.scrollLeft))
    }

    // Each addition should scroll further right (or stay at max)
    for (let i = 1; i < scrollPositions.length; i++) {
      expect(scrollPositions[i]).toBeGreaterThanOrEqual(scrollPositions[i - 1])
    }

    // The wrapper should actually be scrolled (not at 0) since panes overflow
    expect(scrollPositions[scrollPositions.length - 1]).toBeGreaterThan(0)
  })
})
