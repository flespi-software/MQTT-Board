import { test, expect } from '@playwright/test'

const BROKER_HOST = 'wss://mqtt.flespi.io'
const BROKER_USERNAME = process.env.MQTT_TOKEN

test.describe('Pane Back/Forth Reordering', () => {
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
    // Wait for menu to close
    await expect(page.locator('.q-menu')).not.toBeVisible()
  }

  function getPanes (page) {
    // Each pane is a direct child div.col of .client__wrapper
    return page.locator('.client__wrapper > div.col')
  }

  function getPaneType (pane) {
    // Returns a promise resolving to the pane type based on its child class
    return pane.evaluate(el => {
      if (el.querySelector('.mqtt-client__publisher')) return 'publisher'
      if (el.querySelector('.mqtt-client__subscriber')) return 'subscriber'
      if (el.querySelector('.mqtt-client__not-resolved-msgs')) return 'unresolved'
      if (el.querySelector('.mqtt-client__logs')) return 'logs'
      return 'unknown'
    })
  }

  async function getPaneTypes (page) {
    const panes = getPanes(page)
    const count = await panes.count()
    const types = []
    for (let i = 0; i < count; i++) {
      types.push(await getPaneType(panes.nth(i)))
    }
    return types
  }

  function getMoveForthBtn (pane) {
    return pane.locator('.pane-move-btn').filter({ has: pane.page().locator('[class*="mdi-menu-right"]') })
  }

  function getMoveBackBtn (pane) {
    return pane.locator('.pane-move-btn').filter({ has: pane.page().locator('[class*="mdi-menu-left"]') })
  }

  test('should move leftmost pane to rightmost and back', async ({ page }) => {
    // Default client comes with 1 publisher and 1 subscriber
    // Add 2 more publishers and 2 more subscribers
    await addPane(page, 'Publisher')
    await addPane(page, 'Publisher')
    await addPane(page, 'Subscriber')
    await addPane(page, 'Subscriber')

    // Wait for all panes to render
    const panes = getPanes(page)
    await expect(panes).toHaveCount(7) // logs + 1 default pub + 2 new pubs + 1 default sub + 2 new subs

    // Get initial pane order
    const initialTypes = await getPaneTypes(page)

    // The first pane should be logs, which cannot be moved
    expect(initialTypes[0]).toBe('logs')

    // The first movable pane is at index 1 (right after logs)
    const firstMovableIndex = 1
    const firstMovableType = initialTypes[firstMovableIndex]

    // Move the first movable pane to the rightmost position
    // by repeatedly clicking the forth button
    for (let i = firstMovableIndex; i < initialTypes.length - 1; i++) {
      const currentPanes = getPanes(page)
      const currentPane = currentPanes.nth(i)
      const forthBtn = getMoveForthBtn(currentPane)
      await expect(forthBtn).toBeVisible()
      await forthBtn.click()
      // Small wait for the swap animation
      await page.waitForTimeout(300)
    }

    // Verify the pane is now at the rightmost position
    const afterForthTypes = await getPaneTypes(page)
    expect(afterForthTypes[afterForthTypes.length - 1]).toBe(firstMovableType)

    // The forth button should NOT be visible on the rightmost pane
    const rightmostPane = getPanes(page).nth(afterForthTypes.length - 1)
    await expect(getMoveForthBtn(rightmostPane)).not.toBeVisible()

    // Now move it back to the leftmost position (index 1, after logs)
    for (let i = afterForthTypes.length - 1; i > firstMovableIndex; i--) {
      const currentPanes = getPanes(page)
      const currentPane = currentPanes.nth(i)
      const backBtn = getMoveBackBtn(currentPane)
      await expect(backBtn).toBeVisible()
      await backBtn.click()
      await page.waitForTimeout(300)
    }

    // Verify the pane is back at position 1 (after logs)
    const afterBackTypes = await getPaneTypes(page)
    expect(afterBackTypes[firstMovableIndex]).toBe(firstMovableType)

    // The back button should NOT be visible on the pane right after logs
    const firstMovablePane = getPanes(page).nth(firstMovableIndex)
    await expect(getMoveBackBtn(firstMovablePane)).not.toBeVisible()
  })

  test('should not show forth button on the pane before unresolved', async ({ page }) => {
    // Add extra panes
    await addPane(page, 'Publisher')
    await addPane(page, 'Subscriber')

    // Inject unresolved entity directly via Vue internals
    await page.evaluate(() => {
      const app = document.getElementById('q-app').__vue_app__
      function findComp (vnode) {
        if (vnode?.component?.type?.name === 'MqttClient') return vnode.component
        if (vnode?.component?.subTree) {
          const found = findComp(vnode.component.subTree)
          if (found) return found
        }
        if (vnode?.children && Array.isArray(vnode.children)) {
          for (const child of vnode.children) {
            const found = findComp(child)
            if (found) return found
          }
        }
        if (vnode?.component?.subTree?.children && Array.isArray(vnode.component.subTree.children)) {
          for (const child of vnode.component.subTree.children) {
            const found = findComp(child)
            if (found) return found
          }
        }
        return null
      }
      const comp = findComp(app._instance.vnode)
      if (!comp) throw new Error('MqttClient component not found')
      const ctx = comp.proxy || comp.ctx
      const clientKeys = Object.keys(ctx.clients)
      const client = ctx.clients[clientKeys[0]]
      client.notResolvedFlagInit = true
      client.notResolvedMessages.push({
        topic: 'test/unresolved',
        payload: 'test',
        qos: 0,
        retain: false,
        messageId: 1
      })
      ctx.entities.push({ type: 'unresolved', rendered: true })
    })

    // Wait for unresolved pane to appear
    await expect(page.locator('.mqtt-client__not-resolved-msgs')).toBeVisible({ timeout: 5000 })

    // Verify unresolved is the rightmost pane
    const types = await getPaneTypes(page)
    expect(types[types.length - 1]).toBe('unresolved')

    // The pane just before unresolved should NOT have a forth button
    const paneBeforeUnresolved = getPanes(page).nth(types.length - 2)
    await expect(getMoveForthBtn(paneBeforeUnresolved)).not.toBeVisible()
  })
})
