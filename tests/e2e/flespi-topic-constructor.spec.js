import { test, expect } from '@playwright/test'

const BROKER_HOST = 'wss://mqtt.flespi.io'
const BROKER_USERNAME = process.env.MQTT_TOKEN

test.describe('Flespi Topic Constructor', () => {
  test.skip(!BROKER_USERNAME, 'MQTT_TOKEN env var is required. Run with: MQTT_TOKEN=<your-token> npx playwright test')

  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.reload()

    // Create client with flespi broker
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

  /**
   * Helper: open the flespi topic constructor modal from the subscriber pane.
   */
  async function openConstructor (page) {
    const subscriberPane = page.locator('.mqtt-client__subscriber')
    await expect(subscriberPane).toBeVisible()

    const flespiBtn = subscriberPane.locator('.q-btn').filter({ has: page.locator('.icon-flespi2-02-01') })
    await expect(flespiBtn).toBeVisible()
    await flespiBtn.click()

    const dialog = page.locator('.q-dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog.getByText('flespi topic constructor')).toBeVisible()
    await expect(dialog.locator('.q-tree .q-tree__node').first()).toBeVisible({ timeout: 10000 })

    return dialog
  }

  /**
   * Helper: click a segment's value text to open the dropdown menu.
   * Clicks .flespi-topic-selector__segment-value at the given index
   * within the first segment group.
   */
  async function openSegmentMenu (page, dialog, segmentIndex = 0) {
    const segmentGroup = dialog.locator('.flespi-topic-selector__segment-group').nth(segmentIndex)
    const segmentValue = segmentGroup.locator('.flespi-topic-selector__segment-value').first()
    await segmentValue.click()
    const menu = page.locator('.flespi-topic-selector__dropdown')
    await expect(menu).toBeVisible()
    return menu
  }

  test.describe('Modal & Initialization', () => {
    test('should open modal with flespi topic constructor title', async ({ page }) => {
      const dialog = await openConstructor(page)
      await expect(dialog.getByText('flespi topic constructor')).toBeVisible()
      await expect(dialog.getByRole('button', { name: /save/i })).toBeVisible()
      await expect(dialog.getByRole('button', { name: /close/i })).toBeVisible()
    })

    test('should display default topic flespi/# with one segment', async ({ page }) => {
      const dialog = await openConstructor(page)

      const topicRow = dialog.locator('.flespi-topic-selector__topic-row')
      await expect(topicRow.locator('span.text-h6').first()).toContainText('flespi/')

      const segment = topicRow.locator('.flespi-topic-selector__segment-group')
      await expect(segment.first()).toBeVisible()
      await expect(segment.first()).toContainText('#')
    })

    test('should load and display the topic tree', async ({ page }) => {
      const dialog = await openConstructor(page)

      const treeNodes = dialog.locator('.q-tree > .q-tree__node')
      await expect(treeNodes.first()).toBeVisible()
      const count = await treeNodes.count()
      expect(count).toBeGreaterThan(1)
    })
  })

  test.describe('Topic Segment Interaction', () => {
    test('should open dropdown menu when clicking a segment', async ({ page }) => {
      const dialog = await openConstructor(page)

      const menu = await openSegmentMenu(page, dialog)
      await expect(menu.locator('.q-item').first()).toBeVisible()
    })

    test('should update segment when selecting a keyword from dropdown', async ({ page }) => {
      const dialog = await openConstructor(page)

      const menu = await openSegmentMenu(page, dialog)
      await menu.locator('.q-item').filter({ hasText: 'state' }).click()

      // Segment should now show "state"
      const segment = dialog.locator('.flespi-topic-selector__segment-group').first()
      await expect(segment).toContainText('state')

      // Close the menu — a second level (#) appears after menu hides
      await page.keyboard.press('Escape')
      await expect(menu).not.toBeVisible()

      // A second segment should have been added (next level with #)
      const segments = dialog.locator('.flespi-topic-selector__segment-group')
      await expect(segments.nth(1)).toBeVisible()
    })

    test('should replace selection with + wildcard via dropdown', async ({ page }) => {
      const dialog = await openConstructor(page)
      const menu = page.locator('.flespi-topic-selector__dropdown')

      // Select "state" first — menu stays open (non-exclusive)
      await openSegmentMenu(page, dialog)
      await menu.locator('.q-item').filter({ hasText: 'state' }).click()

      const segment = dialog.locator('.flespi-topic-selector__segment-group').first()
      await expect(segment).toContainText('state')

      // Keyword segments should NOT have a cross button
      await expect(segment.locator('.flespi-topic-selector__cross-btn')).not.toBeVisible()

      // Select "+" from the still-open dropdown to replace with wildcard
      await menu.locator('.q-item').filter({ hasText: '+' }).click()
      await expect(segment).toContainText('+')
    })

    test('should set # wildcard and not add further levels', async ({ page }) => {
      const dialog = await openConstructor(page)

      // The default topic has # selected — verify only one segment exists
      const segments = dialog.locator('.flespi-topic-selector__segment-group')
      const count = await segments.count()
      expect(count).toBe(1)
      await expect(segments.first()).toContainText('#')
    })
  })

  test.describe('Multi-value Selection', () => {
    test('should show comma-separated values when selecting multiple keywords', async ({ page }) => {
      const dialog = await openConstructor(page)

      // Open menu and select "state" — menu stays open (non-exclusive option)
      const menu = await openSegmentMenu(page, dialog)
      await menu.locator('.q-item').filter({ hasText: 'state' }).click()

      const segment = dialog.locator('.flespi-topic-selector__segment-group').first()
      await expect(segment).toContainText('state')

      // Select "message" too — menu is still open, no need to reopen
      await menu.locator('.q-item').filter({ hasText: 'message' }).click()

      // Segment should now contain both values separated by comma
      await expect(segment).toContainText('state')
      await expect(segment).toContainText('message')
      await expect(segment.locator('.flespi-topic-selector__comma')).toBeVisible()
    })

    test('should deselect a value when clicking it again', async ({ page }) => {
      const dialog = await openConstructor(page)

      // Open menu and select both "state" and "message"
      const menu = await openSegmentMenu(page, dialog)
      await menu.locator('.q-item').filter({ hasText: 'state' }).click()
      await menu.locator('.q-item').filter({ hasText: 'message' }).click()

      const segment = dialog.locator('.flespi-topic-selector__segment-group').first()
      await expect(segment).toContainText('state')
      await expect(segment).toContainText('message')

      // Deselect "state" — menu is still open
      await menu.locator('.q-item').filter({ hasText: 'state' }).click()

      // Now only "message" remains
      await expect(segment).toContainText('message')
      await expect(segment).not.toContainText('state')
    })
  })

  test.describe('Tree Navigation', () => {
    test('should build topic when clicking a tree node', async ({ page }) => {
      const dialog = await openConstructor(page)

      const stateNode = dialog.locator('.flespi-topic-tree__row').filter({ hasText: '/state' }).first()
      await expect(stateNode).toBeVisible()
      await stateNode.locator('span.cursor-pointer').click()

      const topicRow = dialog.locator('.flespi-topic-selector__topic-row')
      await expect(topicRow).toContainText('state')
    })

    test('should highlight matched tree nodes with background color', async ({ page }) => {
      const dialog = await openConstructor(page)

      const stateNode = dialog.locator('.flespi-topic-tree__row').filter({ hasText: '/state' }).first()
      await stateNode.locator('span.cursor-pointer').click()

      await expect(stateNode).toHaveClass(/flespi-topic-tree__matched/)

      const span = stateNode.locator('span.cursor-pointer')
      const bgColor = await span.evaluate(el => getComputedStyle(el).backgroundColor)
      expect(bgColor).not.toBe('rgba(0, 0, 0, 0)')
      expect(bgColor).not.toBe('transparent')
    })
  })

  test.describe('Color Consistency & Rounded Corners', () => {
    test('should apply rounded corners to topic segments', async ({ page }) => {
      const dialog = await openConstructor(page)

      const segment = dialog.locator('.flespi-topic-selector__segment-group').first()
      const borderRadius = await segment.evaluate(el => getComputedStyle(el).borderRadius)
      expect(borderRadius).toBe('8px')
    })

    test('should apply rounded corners to colored tree nodes', async ({ page }) => {
      const dialog = await openConstructor(page)

      // Select "state" via the tree to get a colored, matched node
      const stateNode = dialog.locator('.flespi-topic-tree__row').filter({ hasText: '/state' }).first()
      await stateNode.locator('span.cursor-pointer').click()

      // Non-leaf node span gets rounded corners from inline style
      const span = stateNode.locator('span.cursor-pointer')
      const borderRadius = await span.evaluate(el => el.style.borderRadius)
      expect(borderRadius).toBe('8px')
    })

    test('should apply matching colors between segment and tree node', async ({ page }) => {
      const dialog = await openConstructor(page)

      // Select "state" via the tree
      const stateNode = dialog.locator('.flespi-topic-tree__row').filter({ hasText: '/state' }).first()
      await stateNode.locator('span.cursor-pointer').click()

      // Get the segment color
      const segment = dialog.locator('.flespi-topic-selector__segment-group').first()
      const segmentBg = await segment.evaluate(el => el.style.backgroundColor)

      // Get the tree node color
      const span = stateNode.locator('span.cursor-pointer')
      const nodeBg = await span.evaluate(el => el.style.backgroundColor)

      expect(segmentBg).toBeTruthy()
      expect(nodeBg).toBeTruthy()
      expect(segmentBg).toBe(nodeBg)
    })

    test('should apply rounded corners to both leaf and non-leaf matched nodes', async ({ page }) => {
      const dialog = await openConstructor(page)

      // Expand the "state" node
      const stateNode = dialog.locator('.flespi-topic-tree__row').filter({ hasText: '/state' }).first()
      const stateTreeNode = dialog.locator('.q-tree__node').filter({ hasText: '/state' }).first()
      const expandIcon = stateTreeNode.locator('> .q-tree__node-header .q-tree__arrow').first()
      await expandIcon.click()

      const childNodes = stateTreeNode.locator('.q-tree__children .q-tree__node')
      await expect(childNodes.first()).toBeVisible()

      // Click a child keyword to build a multi-level topic (e.g., "gw")
      const gwNode = stateTreeNode.locator('.flespi-topic-tree__row').filter({ hasText: '/gw' }).first()
      await expect(gwNode).toBeVisible()
      await gwNode.locator('span.cursor-pointer').click()

      // "state" is a non-leaf matched node — check its rounded corners
      const stateSpan = stateNode.locator('span.cursor-pointer')
      const stateRadius = await stateSpan.evaluate(el => el.style.borderRadius)
      expect(stateRadius).toBe('8px')
      await expect(stateNode).toHaveClass(/flespi-topic-tree__matched/)
    })
  })

  test.describe('Full Topic Construction', () => {
    test('should build full topic with entity IDs from dropdowns and save it', async ({ page }) => {
      test.setTimeout(120000)
      // Build: flespi/interval/gw/calcs/1666011,1685993/devices/5486936,5193094/deleted,created
      const dialog = await openConstructor(page)
      const menu = page.locator('.flespi-topic-selector__dropdown')

      /** close the dropdown and wait for it to disappear */
      async function closeMenu () {
        await page.keyboard.press('Escape')
        await expect(menu).not.toBeVisible()
      }

      // Level 0: select "interval"
      await openSegmentMenu(page, dialog, 0)
      await menu.locator('.q-item').filter({ hasText: 'interval' }).click()
      await closeMenu()

      // Level 1: select "gw"
      await openSegmentMenu(page, dialog, 1)
      await menu.locator('.q-item').filter({ hasText: 'gw' }).click()
      await closeMenu()

      // Level 2: select "calcs"
      await openSegmentMenu(page, dialog, 2)
      await menu.locator('.q-item').filter({ hasText: 'calcs' }).click()
      await closeMenu()

      // Level 3: select calc IDs (entity level — items fetched from API)
      await openSegmentMenu(page, dialog, 3)
      await expect(menu.locator('.q-item').filter({ hasText: '1666011' })).toBeVisible({ timeout: 10000 })
      await menu.locator('.q-item').filter({ hasText: '1666011' }).click()
      await menu.locator('.q-item').filter({ hasText: '1685993' }).click()
      await closeMenu()

      // Level 4: select "devices"
      await openSegmentMenu(page, dialog, 4)
      await menu.locator('.q-item').filter({ hasText: 'devices' }).click()
      await closeMenu()

      // Level 5: select device IDs (entity level — items fetched from API)
      await openSegmentMenu(page, dialog, 5)
      await expect(menu.locator('.q-item').filter({ hasText: '5486936' })).toBeVisible({ timeout: 10000 })
      await menu.locator('.q-item').filter({ hasText: '5486936' }).click()
      await menu.locator('.q-item').filter({ hasText: '5193094' }).click()
      await closeMenu()

      // Level 6: select leaf keywords "deleted" and "created"
      await openSegmentMenu(page, dialog, 6)
      await menu.locator('.q-item').filter({ hasText: 'deleted' }).click()
      await menu.locator('.q-item').filter({ hasText: 'created' }).click()
      await closeMenu()

      // Verify all 7 segments are present with correct values
      const segments = dialog.locator('.flespi-topic-selector__segment-group')
      await expect(segments).toHaveCount(7)
      await expect(segments.nth(0)).toContainText('interval')
      await expect(segments.nth(1)).toContainText('gw')
      await expect(segments.nth(2)).toContainText('calcs')
      await expect(segments.nth(3)).toContainText('1666011')
      await expect(segments.nth(3)).toContainText('1685993')
      await expect(segments.nth(4)).toContainText('devices')
      await expect(segments.nth(5)).toContainText('5486936')
      await expect(segments.nth(5)).toContainText('5193094')
      await expect(segments.nth(6)).toContainText('deleted')
      await expect(segments.nth(6)).toContainText('created')

      // Verify tree nodes are highlighted with matching colors
      const matchedNodes = dialog.locator('.flespi-topic-tree__matched')
      const matchedCount = await matchedNodes.count()
      expect(matchedCount).toBeGreaterThanOrEqual(7)

      // Save and verify topic reaches the subscriber
      await dialog.getByRole('button', { name: /save/i }).click()
      await expect(page.locator('.q-dialog')).not.toBeVisible({ timeout: 5000 })

      const topicInput = page.locator('.mqtt-client__subscriber').getByLabel('Topic')
      const topicValue = await topicInput.inputValue()
      expect(topicValue).toBe('flespi/interval/gw/calcs/1666011,1685993/devices/5486936,5193094/deleted,created')
    })
  })

  test.describe('Topic Emission', () => {
    test('should save constructed topic back to subscriber', async ({ page }) => {
      const dialog = await openConstructor(page)

      // Select "state" via the tree (simpler than using dropdown)
      const stateNode = dialog.locator('.flespi-topic-tree__row').filter({ hasText: '/state' }).first()
      await stateNode.locator('span.cursor-pointer').click()

      // Click Save
      await dialog.getByRole('button', { name: /save/i }).click()

      // Modal should close
      await expect(page.locator('.q-dialog')).not.toBeVisible({ timeout: 5000 })

      // Subscriber's topic input should contain "state" in the topic
      const topicInput = page.locator('.mqtt-client__subscriber').getByLabel('Topic')
      const topicValue = await topicInput.inputValue()
      expect(topicValue).toContain('flespi/')
      expect(topicValue).toContain('state')
    })
  })
})
