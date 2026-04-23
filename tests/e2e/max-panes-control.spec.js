import { test, expect } from '@playwright/test'

const PANEL_MIN_WIDTH = 350
const DEFAULT_MAX_PANES = 6

function getControl (page) {
  return page.locator('.max-panes-control')
}
function getBars (page) {
  return page.locator('.max-panes-control__bar')
}
function getFilledBars (page) {
  return page.locator('.max-panes-control__bar--filled')
}
function getPanes (page) {
  return page.locator('.client__wrapper > div.col')
}

async function createClient (page) {
  await page.locator('.q-btn--fab').click()
  await expect(page.locator('.q-dialog')).toBeVisible()
  await page.getByRole('button', { name: /save/i }).click()
  await expect(page.locator('.client__item').first()).toBeVisible()
}

async function activateFirstClient (page) {
  await page.locator('.client__item .q-card').first().click()
  await expect(page.getByText(/online|offline/i).first()).toBeVisible()
}

async function closeDrawer (page) {
  const drawer = page.locator('.q-drawer')
  if (await drawer.isVisible()) {
    await page.locator('.q-toolbar .q-btn').filter({ has: page.locator('.mdi-menu') }).click()
    await expect(drawer).not.toBeVisible()
  }
}

async function returnToClientList (page) {
  await page.locator('.q-toolbar .q-btn').filter({ has: page.locator('[class*="mdi-close"]') }).click()
  await expect(page.locator('.client__item').first()).toBeVisible()
}

async function addPane (page, type) {
  await page.locator('.q-toolbar .q-btn').filter({ has: page.locator('[class*="mdi-plus"]') }).click()
  await page.locator('.q-menu').getByText(type).click()
  await expect(page.locator('.q-menu')).not.toBeVisible()
}

async function getWrapperWidth (page) {
  return await page.locator('.client__wrapper').evaluate(el => el.clientWidth)
}

function expectedBarCount (wrapperWidth) {
  if (wrapperWidth < 600) { return 1 }
  return Math.min(DEFAULT_MAX_PANES, Math.max(1, Math.floor(wrapperWidth / PANEL_MIN_WIDTH)))
}

async function readSavedClients (page) {
  const raw = await page.evaluate(() => localStorage.getItem('clients'))
  if (!raw) { return null }
  const json = raw.startsWith('__q_objt|') ? raw.slice('__q_objt|'.length) : raw
  return JSON.parse(json)
}

test.describe('Max Panels Control', () => {
  test.use({ viewport: { width: 1400, height: 800 } })

  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.reload()
  })

  test('1. control is hidden without an active client and visible after activation', async ({ page }) => {
    await expect(getControl(page)).toHaveCount(0)

    await createClient(page)
    await expect(getControl(page)).toHaveCount(0)

    await activateFirstClient(page)
    await expect(getControl(page)).toBeVisible()
  })

  test('2. fresh client defaults to max limit 6 (all bars filled when width allows)', async ({ page }) => {
    await page.setViewportSize({ width: 2400, height: 800 })
    await createClient(page)
    await activateFirstClient(page)
    await closeDrawer(page)

    const bars = getBars(page)
    await expect(bars).toHaveCount(DEFAULT_MAX_PANES)
    await expect(getFilledBars(page)).toHaveCount(DEFAULT_MAX_PANES)
  })

  test('3. bar count never exceeds 6 regardless of window width', async ({ page }) => {
    await page.setViewportSize({ width: 2600, height: 800 })
    await createClient(page)
    await activateFirstClient(page)
    await closeDrawer(page)

    const wrapperWidth = await getWrapperWidth(page)
    // Sanity: the wrapper should theoretically fit more than 6 panels.
    expect(Math.floor(wrapperWidth / PANEL_MIN_WIDTH)).toBeGreaterThanOrEqual(7)

    await expect(getBars(page)).toHaveCount(DEFAULT_MAX_PANES)
  })

  test('4. bar count tracks window width', async ({ page }) => {
    await createClient(page)
    await activateFirstClient(page)
    await closeDrawer(page)

    const widths = [500, 800, 1200, 1500, 1800, 2200]
    for (const width of widths) {
      await page.setViewportSize({ width, height: 800 })
      // Wait for q-resize-observer to propagate
      await page.waitForFunction((w) => {
        const el = document.querySelector('.client__wrapper')
        return el && Math.abs(el.clientWidth - w) < 5
      }, width, { timeout: 2000 })

      const wrapperWidth = await getWrapperWidth(page)
      const expected = expectedBarCount(wrapperWidth)
      await expect(getBars(page), `viewport ${width}px, wrapperWidth ${wrapperWidth}px`)
        .toHaveCount(expected)
    }
  })

  test('5. clicking Nth bar sets limit to N (filled/outlined reflects state)', async ({ page }) => {
    await page.setViewportSize({ width: 2000, height: 800 })
    await createClient(page)
    await activateFirstClient(page)
    await closeDrawer(page)

    const totalBars = await getBars(page).count()
    expect(totalBars).toBeGreaterThanOrEqual(5)

    // Click the 3rd bar (0-indexed 2)
    await getBars(page).nth(2).click()

    await expect(getFilledBars(page)).toHaveCount(3)
    // Remaining bars should be outlined
    await expect(
      page.locator('.max-panes-control__bar:not(.max-panes-control__bar--filled)')
    ).toHaveCount(totalBars - 3)

    // Persist to localStorage (debounced 500ms)
    await expect.poll(async () => {
      const saved = await readSavedClients(page)
      return saved?.[0]?.maxPanes
    }, { timeout: 2000 }).toBe(3)
  })

  test('6. clicking the 6th bar sets limit to 6 and re-clicking keeps it at 6', async ({ page }) => {
    await page.setViewportSize({ width: 2400, height: 800 })
    await createClient(page)
    await activateFirstClient(page)
    await closeDrawer(page)

    await expect(getBars(page)).toHaveCount(DEFAULT_MAX_PANES)

    // Click the 6th bar (0-indexed 5)
    await getBars(page).nth(5).click()
    await expect(getFilledBars(page)).toHaveCount(DEFAULT_MAX_PANES)

    // Click it again — still 6
    await getBars(page).nth(5).click()
    await expect(getFilledBars(page)).toHaveCount(DEFAULT_MAX_PANES)

    await expect.poll(async () => {
      const saved = await readSavedClients(page)
      return saved?.[0]?.maxPanes
    }, { timeout: 2000 }).toBe(6)
  })

  test('7. limit constrains the number of simultaneously displayed panes', async ({ page }) => {
    await page.setViewportSize({ width: 2400, height: 800 })
    await createClient(page)
    await activateFirstClient(page)
    await closeDrawer(page)

    // Default client has 3 entities (logs, publisher, subscriber). Add 5 more so
    // there are 8 entities total — more than the 6-panel cap.
    await addPane(page, 'Publisher')
    await addPane(page, 'Publisher')
    await addPane(page, 'Publisher')
    await addPane(page, 'Subscriber')
    await addPane(page, 'Subscriber')
    await expect(getPanes(page)).toHaveCount(8)

    const wrapperWidth = await getWrapperWidth(page)
    const firstPane = getPanes(page).first()

    async function expectVisibleColsCount (expected) {
      await expect.poll(async () => {
        const paneWidth = await firstPane.evaluate(el => el.getBoundingClientRect().width)
        return Math.round(wrapperWidth / paneWidth)
      }, { timeout: 2000 }).toBe(expected)
    }

    // Default limit (6) caps the simultaneously visible panes at 6 even though
    // 8 are rendered.
    await expectVisibleColsCount(6)

    // Set limit to 2 — each pane should occupy ~half the wrapper
    await getBars(page).nth(1).click()
    await expectVisibleColsCount(2)

    // Increase to 4 — each pane should occupy ~a quarter
    await getBars(page).nth(3).click()
    await expectVisibleColsCount(4)

    // Raise back to 6 (click the last bar) — capped at 6 despite 8 entities
    await getBars(page).nth(5).click()
    await expectVisibleColsCount(6)
  })

  test('8. when max-possible is less than the limit, all bars are filled', async ({ page }) => {
    await page.setViewportSize({ width: 2200, height: 800 })
    await createClient(page)
    await activateFirstClient(page)
    await closeDrawer(page)

    // Start wide so we can set the limit to 5
    await expect(getBars(page)).toHaveCount(DEFAULT_MAX_PANES)
    await getBars(page).nth(4).click()
    await expect(getFilledBars(page)).toHaveCount(5)

    // Shrink so that only 3 bars fit; limit 5 >= 3, so all should be filled
    await page.setViewportSize({ width: 1100, height: 800 })
    await page.waitForFunction(() => {
      const el = document.querySelector('.client__wrapper')
      return el && el.clientWidth < 1200
    }, null, { timeout: 2000 })

    const wrapperWidth = await getWrapperWidth(page)
    const expected = expectedBarCount(wrapperWidth)
    expect(expected).toBeLessThan(5)

    await expect(getBars(page)).toHaveCount(expected)
    await expect(getFilledBars(page)).toHaveCount(expected)
  })

  test('9. per-client isolation: each client remembers its own limit across reload', async ({ page }) => {
    await page.setViewportSize({ width: 2200, height: 800 })

    // Client A
    await createClient(page)
    await activateFirstClient(page)
    await closeDrawer(page)
    await getBars(page).nth(1).click() // limit = 2
    await expect(getFilledBars(page)).toHaveCount(2)
    await returnToClientList(page)

    // Client B
    await createClient(page)
    // Now two cards — click the second one
    await page.locator('.client__item').nth(1).locator('.q-card').click()
    await expect(page.getByText(/online|offline/i).first()).toBeVisible()
    await closeDrawer(page)
    await getBars(page).nth(4).click() // limit = 5
    await expect(getFilledBars(page)).toHaveCount(5)

    // Back to A — its limit should still be 2
    await returnToClientList(page)
    await page.locator('.client__item').first().locator('.q-card').click()
    await expect(page.getByText(/online|offline/i).first()).toBeVisible()
    await expect(getFilledBars(page)).toHaveCount(2)

    // Wait for debounced save to include both values
    await expect.poll(async () => {
      const saved = await readSavedClients(page)
      if (!saved) { return null }
      return { length: saved.length, a: saved[0]?.maxPanes, b: saved[1]?.maxPanes }
    }, { timeout: 2000 }).toEqual({ length: 2, a: 2, b: 5 })

    // Reload and verify persistence
    await page.reload()
    const saved = await readSavedClients(page)
    expect(saved).toHaveLength(2)
    expect(saved[0].maxPanes).toBe(2)
    expect(saved[1].maxPanes).toBe(5)

    // Verify through UI too
    await page.locator('.client__item').first().locator('.q-card').click()
    await expect(page.getByText(/online|offline/i).first()).toBeVisible()
    await closeDrawer(page)
    await expect(getFilledBars(page)).toHaveCount(2)

    await returnToClientList(page)
    await page.locator('.client__item').nth(1).locator('.q-card').click()
    await expect(page.getByText(/online|offline/i).first()).toBeVisible()
    await closeDrawer(page)
    await expect(getFilledBars(page)).toHaveCount(5)
  })
})
