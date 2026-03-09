import { test, expect } from '@playwright/test'

const BROKER_HOST = 'wss://mqtt.flespi.io'
const BROKER_USERNAME = process.env.MQTT_TOKEN

test.describe('Pane navigation and visibility sync', () => {
  test.skip(!BROKER_USERNAME, 'MQTT_TOKEN env var is required. Run with: MQTT_TOKEN=<your-token> npx playwright test')

  test('drawer, dots navigator and main window stay in sync after clicks and hides', async ({ page }) => {
    // --- Setup: connect and create 10 panes ---
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

    // Default client has: logs, 1 publisher, 1 subscriber = 3 panes
    // Add 7 more panes to reach 10 total
    for (let i = 0; i < 4; i++) {
      await addPane(page, 'Publisher')
    }
    for (let i = 0; i < 3; i++) {
      await addPane(page, 'Subscriber')
    }

    // Verify 10 rendered panes
    await expect(getPanes(page)).toHaveCount(10)

    // Open right drawer
    await openDrawerIfNeeded(page)

    // --- Step 3: Click 4th pane in drawer (1-based), verify sync ---
    await clickDrawerItem(page, 3) // 0-based index 3 = 4th pane
    await page.waitForTimeout(500)

    await verifySync(page)

    // --- Step 4: Navigate to Logs pane and hide it ---
    // Logs is always the first drawer item
    await clickDrawerItem(page, 0)
    await page.waitForTimeout(500)

    // Hide the Logs pane via its dots menu
    const logsPane = page.locator('.mqtt-client__logs')
    await logsPane.locator('.q-btn').filter({ has: page.locator('[class*="mdi-dots-vertical"]') }).click()
    await page.locator('.q-menu').getByText('Hide panel').click()
    await expect(page.locator('.q-menu')).not.toBeVisible()
    await page.waitForTimeout(500)

    // --- Step 5: Hide the second pane in the main window ---
    // After hiding logs, the second pane (index 1) in the main window is a publisher or subscriber
    const secondPane = getPanes(page).nth(1)
    await secondPane.locator('.q-btn').filter({ has: page.locator('[class*="mdi-dots-vertical"]') }).click()
    await page.locator('.q-menu').getByText('Hide panel').click()
    await expect(page.locator('.q-menu')).not.toBeVisible()
    await page.waitForTimeout(500)

    // --- Step 6: Click 4th drawer item again, verify sync ---
    // (count starts from 1, hidden panes also count in the drawer)
    await clickDrawerItem(page, 3) // 0-based index 3 = 4th item
    await page.waitForTimeout(500)

    await verifySync(page)

    // --- Step 7-8: Click 6th item in drawer (1-based, hidden panes count), verify ---
    await clickDrawerItem(page, 5) // 0-based index 5 = 6th item
    await page.waitForTimeout(500)

    await verifySync(page)
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

function getWrapper (page) {
  return page.locator('.client__wrapper')
}

async function openDrawerIfNeeded (page) {
  const drawer = page.locator('.q-drawer')
  if (!await drawer.isVisible()) {
    await page.locator('.q-toolbar .q-btn').filter({ has: page.locator('.mdi-menu') }).click()
    await expect(drawer).toBeVisible()
  }
  return drawer
}

function getDrawerItems (page) {
  return page.locator('.q-drawer .q-item')
}

async function clickDrawerItem (page, index) {
  await openDrawerIfNeeded(page)
  const item = getDrawerItems(page).nth(index)
  await item.click()
}

/**
 * Returns indices (0-based) of rendered panes visible in the main wrapper viewport.
 */
async function getVisiblePaneIndices (page) {
  const wrapper = getWrapper(page)
  return wrapper.evaluate(wrapperEl => {
    const panes = wrapperEl.querySelectorAll(':scope > div.col')
    const wrapperRect = wrapperEl.getBoundingClientRect()
    const visible = []
    for (let i = 0; i < panes.length; i++) {
      const paneRect = panes[i].getBoundingClientRect()
      // Pane is visible if it overlaps the wrapper by more than half its width
      const overlapLeft = Math.max(paneRect.left, wrapperRect.left)
      const overlapRight = Math.min(paneRect.right, wrapperRect.right)
      const overlapWidth = overlapRight - overlapLeft
      if (overlapWidth > paneRect.width * 0.5) {
        visible.push(i)
      }
    }
    return visible
  })
}

/**
 * Returns 0-based indices of protruding (non-indented) items in the entities drawer.
 * Protruding items do NOT have the q-ml-md class.
 */
/**
 * Returns 0-based indices of active (highlighted) dots in the footer.
 * Active dots have the item--active class on their parent wrapper div.
 */
async function getActiveFooterDotIndices (page) {
  return page.evaluate(() => {
    const dotWrappers = document.querySelectorAll('.wrapper__footer .q-py-xs.row.inline')
    const active = []
    for (let i = 0; i < dotWrappers.length; i++) {
      if (dotWrappers[i].classList.contains('item--active')) {
        active.push(i)
      }
    }
    return active
  })
}

/**
 * Maps protruding drawer items to rendered pane indices by matching entity types,
 * then verifies all three indicators (main window, drawer, footer dots) are in sync.
 */
async function verifySync (page) {
  const visiblePaneIndices = await getVisiblePaneIndices(page)
  expect(visiblePaneIndices.length).toBeGreaterThan(0)

  // Verify the clicked pane is in the leftmost position
  // (the first visible pane should be the one we scrolled to)

  // Get active dot indices in the footer
  const activeDotIndices = await getActiveFooterDotIndices(page)
  expect(activeDotIndices.length).toBeGreaterThan(0)

  // Footer dots correspond to rendered entities only, so active dot indices
  // should match visible pane indices
  expect(activeDotIndices).toEqual(visiblePaneIndices)

  // Get protruding drawer items — these are rendered entities within the active viewport range
  // Drawer items map to ALL entities (including hidden), while panes/dots map to rendered only.
  // We need to convert: protruding drawer indices → which rendered pane indices they correspond to.
  const drawerData = await page.locator('.q-drawer').evaluate(drawerEl => {
    const items = drawerEl.querySelectorAll('.q-item')
    const result = []
    let renderedIndex = 0
    for (let i = 0; i < items.length; i++) {
      // Check if the item is rendered (not bg-grey-13 background = rendered)
      const isRendered = !items[i].classList.contains('bg-grey-13')
      const isProtruding = !items[i].classList.contains('q-ml-md')
      if (isRendered) {
        result.push({ drawerIndex: i, renderedIndex, isProtruding })
        renderedIndex++
      } else {
        result.push({ drawerIndex: i, renderedIndex: -1, isProtruding })
      }
    }
    return result
  })

  // Protruding rendered entities should map to the visible pane indices
  const protrudingRenderedIndices = drawerData
    .filter(d => d.isProtruding && d.renderedIndex >= 0)
    .map(d => d.renderedIndex)

  expect(protrudingRenderedIndices).toEqual(visiblePaneIndices)
}
