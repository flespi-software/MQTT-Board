import { test, expect } from '@playwright/test'

const BROKER_HOST = 'wss://mqtt.flespi.io'
const BROKER_USERNAME = process.env.MQTT_TOKEN

test.describe('Pane drag-and-drop reordering via drawer', () => {
  test.skip(!BROKER_USERNAME, 'MQTT_TOKEN env var is required. Run with: MQTT_TOKEN=<your-token> npx playwright test')

  test('should reorder panes via drag and drop and reflect in main window and footer dots', async ({ page }) => {
    // --- Setup: connect to broker ---
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

    // Default client: logs, publisher, subscriber = 3 panes
    // Add 1 subscriber and 1 publisher
    await addPane(page, 'Subscriber')
    await addPane(page, 'Publisher')

    // Now we have 5 panes: logs, publisher(default), subscriber(default), subscriber(new), publisher(new)
    await expect(getPanes(page)).toHaveCount(5)

    // Open right drawer
    await openDrawerIfNeeded(page)

    // Record initial order from both main window and drawer
    const initialPaneTypes = await getPaneTypes(page)
    const initialDrawerTypes = await getDrawerItemTypes(page)
    // Drawer includes all entities (logs too); main window shows rendered entities
    // They should match initially (all rendered)
    expect(initialPaneTypes).toEqual(initialDrawerTypes)

    // Find the indices of the first publisher and first subscriber in the drawer
    const firstPubIndex = initialDrawerTypes.indexOf('publisher')
    const firstSubIndex = initialDrawerTypes.indexOf('subscriber')
    expect(firstPubIndex).toBeGreaterThan(0) // not logs at 0
    expect(firstSubIndex).toBeGreaterThan(0)
    expect(firstPubIndex).not.toBe(firstSubIndex)

    // --- First drag: swap the first publisher and first subscriber ---
    // Drag whichever comes first to the position of the other
    const sourceIdx1 = firstPubIndex
    const targetIdx1 = firstSubIndex
    await dragAndDrop(page, getDrawerItems(page).nth(sourceIdx1), getDrawerItems(page).nth(targetIdx1))
    await page.waitForTimeout(500)

    const afterFirstDragPaneTypes = await getPaneTypes(page)
    const afterFirstDragDrawerTypes = await getDrawerItemTypes(page)
    const afterFirstDragDotTypes = await getFooterDotTypes(page)

    // Verify main window, drawer, and footer dots all match
    expect(afterFirstDragPaneTypes).toEqual(afterFirstDragDrawerTypes)
    expect(afterFirstDragDotTypes).toEqual(afterFirstDragPaneTypes)

    // Verify the order actually changed
    expect(afterFirstDragPaneTypes).not.toEqual(initialPaneTypes)

    // --- Second drag: pick two different items and swap again ---
    // Find last subscriber and last publisher in the current order
    const lastSubIdx = afterFirstDragDrawerTypes.lastIndexOf('subscriber')
    const lastPubIdx = afterFirstDragDrawerTypes.lastIndexOf('publisher')
    expect(lastSubIdx).toBeGreaterThan(0)
    expect(lastPubIdx).toBeGreaterThan(0)

    const sourceIdx2 = lastSubIdx
    const targetIdx2 = lastPubIdx
    await dragAndDrop(page, getDrawerItems(page).nth(sourceIdx2), getDrawerItems(page).nth(targetIdx2))
    await page.waitForTimeout(500)

    const afterSecondDragPaneTypes = await getPaneTypes(page)
    const afterSecondDragDrawerTypes = await getDrawerItemTypes(page)
    const afterSecondDragDotTypes = await getFooterDotTypes(page)

    // Verify all three stay in sync
    expect(afterSecondDragPaneTypes).toEqual(afterSecondDragDrawerTypes)
    expect(afterSecondDragDotTypes).toEqual(afterSecondDragPaneTypes)

    // Verify the order changed again
    expect(afterSecondDragPaneTypes).not.toEqual(afterFirstDragPaneTypes)
  })
})

// ----- Helper functions -----

async function addPane (page, type) {
  await page.locator('.q-toolbar .q-btn').filter({ has: page.locator('[class*="mdi-plus"]') }).click()
  await page.locator('.q-menu').getByText(type).click()
  await expect(page.locator('.q-menu')).not.toBeVisible()
}

function getPanes (page) {
  return page.locator('.client__wrapper > div.col')
}

function getDrawerItems (page) {
  return page.locator('.q-drawer .q-item')
}

async function openDrawerIfNeeded (page) {
  const drawer = page.locator('.q-drawer')
  if (!await drawer.isVisible()) {
    await page.locator('.q-toolbar .q-btn').filter({ has: page.locator('.mdi-menu') }).click()
    await expect(drawer).toBeVisible()
  }
  return drawer
}

async function getPaneTypes (page) {
  const panes = getPanes(page)
  const count = await panes.count()
  const types = []
  for (let i = 0; i < count; i++) {
    types.push(await panes.nth(i).evaluate(el => {
      if (el.querySelector('.mqtt-client__publisher')) return 'publisher'
      if (el.querySelector('.mqtt-client__subscriber')) return 'subscriber'
      if (el.querySelector('.mqtt-client__logs')) return 'logs'
      if (el.querySelector('.mqtt-client__not-resolved-msgs')) return 'unresolved'
      return 'unknown'
    }))
  }
  return types
}

async function getDrawerItemTypes (page) {
  return page.locator('.q-drawer').evaluate(drawerEl => {
    const items = drawerEl.querySelectorAll('.q-item')
    return Array.from(items).map(item => {
      const label = item.querySelector('.q-item__label--header')
      if (!label) return 'unknown'
      const text = label.textContent.trim().toLowerCase()
      if (text === 'publisher') return 'publisher'
      if (text === 'subscriber') return 'subscriber'
      if (text === 'logs') return 'logs'
      if (text === 'unresolved') return 'unresolved'
      return 'unknown'
    })
  })
}

async function getFooterDotTypes (page) {
  return page.evaluate(() => {
    const colorToType = {
      'bg-indigo': 'publisher',
      'bg-orange': 'subscriber',
      'bg-blue': 'logs',
      'bg-red-6': 'unresolved'
    }
    const dots = document.querySelectorAll('.wrapper__footer .q-btn--round')
    return Array.from(dots).map(dot => {
      for (const [cls, type] of Object.entries(colorToType)) {
        if (dot.classList.contains(cls)) return type
      }
      return 'unknown'
    })
  })
}

async function dragAndDrop (page, source, target) {
  await source.dragTo(target)
}
