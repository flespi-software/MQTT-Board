import { test, expect } from '@playwright/test'

function getDrawer (page) {
  return page.locator('.q-drawer')
}

function getMenuToggle (page) {
  return page.locator('.q-toolbar .q-btn').filter({ has: page.locator('.mdi-menu') })
}

function getChevronCloseBtn (page) {
  return page.locator('.q-drawer .q-btn').filter({ has: page.locator('.mdi-chevron-right') })
}

async function createClient (page) {
  await page.locator('.q-btn--fab').click()
  await expect(page.locator('.q-dialog')).toBeVisible()
  await page.getByRole('button', { name: /save/i }).click()
  await expect(page.locator('.client__item').first()).toBeVisible()
}

async function activateClientAt (page, index) {
  await page.locator('.client__item').nth(index).locator('.q-card').click()
  await expect(page.getByText(/online|offline/i).first()).toBeVisible()
}

async function returnToClientList (page) {
  await page.locator('.q-toolbar .q-btn').filter({ has: page.locator('[class*="mdi-close"]') }).click()
  await expect(page.locator('.client__item').first()).toBeVisible()
}

async function readSavedClients (page) {
  const raw = await page.evaluate(() => localStorage.getItem('clients'))
  if (!raw) { return null }
  const json = raw.startsWith('__q_objt|') ? raw.slice('__q_objt|'.length) : raw
  return JSON.parse(json)
}

test.describe('Right drawer state', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.reload()
  })

  test('1. drawer default tracks layout width when never toggled', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await createClient(page)
    await activateClientAt(page, 0)

    // Wide layout: drawer is open by default
    await expect(getDrawer(page)).toBeVisible()

    // Wait for the debounced save to complete, then assert no explicit drawerRight
    await expect.poll(async () => {
      const saved = await readSavedClients(page)
      return saved?.length ?? 0
    }, { timeout: 2000 }).toBe(1)
    const initial = await readSavedClients(page)
    expect(initial[0].drawerRight).toBeUndefined()

    // Narrow layout (<= 500): drawer closes via the computed default
    await page.setViewportSize({ width: 480, height: 800 })
    await expect(getDrawer(page)).not.toBeVisible()

    // Wide again: drawer reopens automatically since no explicit value was set
    await page.setViewportSize({ width: 1280, height: 800 })
    await expect(getDrawer(page)).toBeVisible()

    const after = await readSavedClients(page)
    expect(after[0].drawerRight).toBeUndefined()
  })

  test('2. explicit toggle persists across reload', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await createClient(page)
    await activateClientAt(page, 0)
    await expect(getDrawer(page)).toBeVisible()

    // Close the drawer via the header menu button
    await getMenuToggle(page).click()
    await expect(getDrawer(page)).not.toBeVisible()

    // Persisted to localStorage (debounced ~500ms)
    await expect.poll(async () => {
      const saved = await readSavedClients(page)
      return saved?.[0]?.drawerRight
    }, { timeout: 2000 }).toBe(false)

    await page.reload()
    await activateClientAt(page, 0)

    // Drawer remains closed because the explicit value beats the layout default
    await expect(getDrawer(page)).not.toBeVisible()
  })

  test('3. chevron close button works in overlay mode and is absent above the breakpoint', async ({ page }) => {
    await page.setViewportSize({ width: 480, height: 800 })
    await createClient(page)
    await activateClientAt(page, 0)

    // Default closed at narrow viewport
    await expect(getDrawer(page)).not.toBeVisible()

    // Open the drawer via the header menu button — chevron is now visible in overlay
    await getMenuToggle(page).click()
    await expect(getDrawer(page)).toBeVisible()
    await expect(getChevronCloseBtn(page)).toBeVisible()

    // Click chevron to close
    await getChevronCloseBtn(page).click()
    await expect(getDrawer(page)).not.toBeVisible()

    await expect.poll(async () => {
      const saved = await readSavedClients(page)
      return saved?.[0]?.drawerRight
    }, { timeout: 2000 }).toBe(false)

    // Resize wide — chevron is conditionally rendered (v-if), so it is no longer in DOM
    await page.setViewportSize({ width: 1280, height: 800 })
    await expect(getChevronCloseBtn(page)).toHaveCount(0)
  })

  test('4. per-client isolation of drawer state', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })

    // Client A — close the drawer (writes drawerRight: false on A)
    await createClient(page)
    await activateClientAt(page, 0)
    await expect(getDrawer(page)).toBeVisible()
    await getMenuToggle(page).click()
    await expect(getDrawer(page)).not.toBeVisible()
    await returnToClientList(page)

    // Client B — never toggled, falls back to layout default → open at 1280px
    await createClient(page)
    await activateClientAt(page, 1)
    await expect(getDrawer(page)).toBeVisible()

    // Switch back to A — drawer remains closed
    await returnToClientList(page)
    await activateClientAt(page, 0)
    await expect(getDrawer(page)).not.toBeVisible()

    // Verify localStorage: A explicit false, B never written
    await expect.poll(async () => {
      const saved = await readSavedClients(page)
      if (!saved || saved.length !== 2) { return null }
      return saved[0]?.drawerRight
    }, { timeout: 2000 }).toBe(false)

    const saved = await readSavedClients(page)
    expect(saved[1]?.drawerRight).toBeUndefined()
  })
})
