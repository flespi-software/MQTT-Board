import { test, expect } from '@playwright/test'

const BROKER_HOST = 'wss://mqtt.flespi.io'
const BROKER_USERNAME = process.env.MQTT_TOKEN

// Each test uses a unique base topic: the spec's tests run in parallel against the same broker,
// so sharing topics would let one test's subscriber also receive the other's published messages.
function topicsFor (base) {
  return [
    { topic: `${base}/a/1`, payload: 'a1' },
    { topic: `${base}/a/2`, payload: 'a2' },
    { topic: `${base}/b/1`, payload: 'b1' }
  ]
}

test.describe('Subscriber list-mode tree filter', () => {
  test.skip(!BROKER_USERNAME, 'MQTT_TOKEN env var is required. Run with: MQTT_TOKEN=<your-token> npx playwright test')

  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.reload()

    // Connect to the flespi broker
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

  function subscriberPane (page) {
    return page.locator('.mqtt-client__subscriber').first()
  }

  // Messages render as `.message` cards; in filter mode they live in the splitter's after pane,
  // otherwise directly in the list. Counting within the pane covers both.
  function messages (page) {
    return subscriberPane(page).locator('.message')
  }

  async function subscribe (page, topic) {
    const pane = subscriberPane(page)
    const topicInput = pane.getByLabel('Topic')
    await topicInput.clear()
    await topicInput.fill(topic)
    await pane.locator('.q-btn').filter({ has: page.locator('[class*="mdi-play"]') }).first().click()
    await expect(pane.locator('.q-btn').filter({ has: page.locator('[class*="mdi-pause"]') }).first()).toBeVisible({ timeout: 10000 })
  }

  async function publish (page, topic, payload) {
    const pane = page.locator('.mqtt-client__publisher').first()
    const topicInput = pane.getByLabel('Topic', { exact: true })
    await topicInput.clear()
    await topicInput.fill(topic)
    const messageInput = pane.getByLabel('Message', { exact: true })
    await messageInput.clear()
    await messageInput.fill(payload)
    await pane.locator('.q-btn').filter({ has: page.locator('[class*="mdi-send"]') }).first().click()
  }

  // The clickable node label whose text exactly equals `key`, inside the filter tree pane.
  function treeNode (page, key) {
    return subscriberPane(page).locator('.q-splitter__before .topic-font-element')
      .filter({ hasText: new RegExp(`^${key}$`) })
  }

  // The full clickable row for the node labelled `key` (children render as sibling rows, not
  // nested inside it, so filtering by the exact label uniquely identifies the row). Used to reach
  // the expand/collapse triangle, which lives in the row alongside the label.
  function treeRow (page, key) {
    return subscriberPane(page).locator('.q-splitter__before .cursor-pointer')
      .filter({ has: page.locator('.topic-font-element').filter({ hasText: new RegExp(`^${key}$`) }) })
      .first()
  }

  async function openFilter (page) {
    const pane = subscriberPane(page)
    await pane.locator('.q-btn').filter({ has: page.locator('[class*="mdi-file-tree"]') }).first().click()
    await expect(pane.locator('.q-splitter')).toBeVisible()
  }

  test('filters the message list by selected tree nodes (single, multi via Ctrl, deselect)', async ({ page }) => {
    const base = 'mqttboard/filtertest/select'
    await subscribe(page, `${base}/#`)

    for (const { topic, payload } of topicsFor(base)) {
      await publish(page, topic, payload)
    }
    // All three messages arrive in the unfiltered list
    await expect(messages(page)).toHaveCount(3, { timeout: 10000 })

    // Open the filter — splitter + tree appear; the subscription's fixed prefix is auto-expanded,
    // so the 'a' and 'b' branches are visible without manual expansion.
    await openFilter(page)
    await expect(treeNode(page, 'a')).toBeVisible()
    await expect(treeNode(page, 'b')).toBeVisible()

    // Plain click on 'a' → only its subtree (a/1, a/2)
    await treeNode(page, 'a').click()
    await expect(messages(page)).toHaveCount(2)

    // Ctrl+click 'b' → union of both subtrees (a/1, a/2, b/1)
    await treeNode(page, 'b').click({ modifiers: ['Control'] })
    await expect(messages(page)).toHaveCount(3)

    // Plain click 'a' replaces the multi-selection with just 'a'
    await treeNode(page, 'a').click()
    await expect(messages(page)).toHaveCount(2)

    // Plain click the same node again clears the selection → all messages
    await treeNode(page, 'a').click()
    await expect(messages(page)).toHaveCount(3)
  })

  test('Ctrl+click removes a topic from a multi-selection', async ({ page }) => {
    const base = 'mqttboard/filtertest/multiremove'
    await subscribe(page, `${base}/#`)
    for (const { topic, payload } of topicsFor(base)) {
      await publish(page, topic, payload)
    }
    await expect(messages(page)).toHaveCount(3, { timeout: 10000 })

    await openFilter(page)

    // Build a two-topic selection: 'a' (a/1, a/2) then Ctrl+click 'b' (adds b/1)
    await treeNode(page, 'a').click()
    await expect(messages(page)).toHaveCount(2)
    await treeNode(page, 'b').click({ modifiers: ['Control'] })
    await expect(messages(page)).toHaveCount(3)

    // Ctrl+click 'b' again removes only 'b' from the selection, leaving 'a' active
    await treeNode(page, 'b').click({ modifiers: ['Control'] })
    await expect(messages(page)).toHaveCount(2)

    // Ctrl+click 'a' removes the last selected topic → empty selection shows everything
    await treeNode(page, 'a').click({ modifiers: ['Control'] })
    await expect(messages(page)).toHaveCount(3)
  })

  test('the tree triangle expands a node without selecting it', async ({ page }) => {
    const base = 'mqttboard/filtertest/triangle'
    await subscribe(page, `${base}/#`)
    for (const { topic, payload } of topicsFor(base)) {
      await publish(page, topic, payload)
    }
    await expect(messages(page)).toHaveCount(3, { timeout: 10000 })

    await openFilter(page)
    await expect(treeNode(page, 'a')).toBeVisible()
    // 'a' starts collapsed: its leaf '2' (unique to the 'a' subtree) is not rendered yet
    await expect(treeNode(page, '2')).toHaveCount(0)

    // Click the triangle, not the label: the node expands and its children appear,
    // but no filter selection is made — all three messages remain visible.
    await treeRow(page, 'a').locator('[class*="mdi-menu-right"]').click()
    await expect(treeNode(page, '2')).toBeVisible()
    await expect(messages(page)).toHaveCount(3)
  })

  test('the filter tree updates with messages that arrive after it is opened', async ({ page }) => {
    const base = 'mqttboard/filtertest/incremental'
    await subscribe(page, `${base}/#`)

    // Publish only the 'a' branch before opening the filter
    await publish(page, `${base}/a/1`, 'a1')
    await publish(page, `${base}/a/2`, 'a2')
    await expect(messages(page)).toHaveCount(2, { timeout: 10000 })

    await openFilter(page)
    await expect(treeNode(page, 'a')).toBeVisible()
    // The 'b' branch does not exist in the tree yet
    await expect(treeNode(page, 'b')).toHaveCount(0)

    // A message in a new branch arrives after the tree was built → incremental merge adds 'b'
    await publish(page, `${base}/b/1`, 'b1')
    await expect(messages(page)).toHaveCount(3, { timeout: 10000 })
    await expect(treeNode(page, 'b')).toBeVisible()

    // The newly merged node is selectable and filters to just the late message
    await treeNode(page, 'b').click()
    await expect(messages(page)).toHaveCount(1)
  })

  test('selecting leaf nodes filters by the exact topic', async ({ page }) => {
    const base = 'mqttboard/filtertest/leaf'
    // Unique leaf names so a leaf label identifies a single topic across the whole tree
    const topics = [
      { topic: `${base}/a/x`, payload: 'ax' },
      { topic: `${base}/a/y`, payload: 'ay' },
      { topic: `${base}/b/z`, payload: 'bz' }
    ]
    await subscribe(page, `${base}/#`)
    for (const { topic, payload } of topics) {
      await publish(page, topic, payload)
    }
    await expect(messages(page)).toHaveCount(3, { timeout: 10000 })

    await openFilter(page)
    // Expand 'a' via its triangle to reveal the leaves beneath it
    await treeRow(page, 'a').locator('[class*="mdi-menu-right"]').click()
    await expect(treeNode(page, 'x')).toBeVisible()

    // Selecting the leaf 'x' filters to its single message (a/x)
    await treeNode(page, 'x').click()
    await expect(messages(page)).toHaveCount(1)

    // Ctrl+click the sibling leaf 'y' → union of the two exact topics
    await treeNode(page, 'y').click({ modifiers: ['Control'] })
    await expect(messages(page)).toHaveCount(2)
  })

  test('closing the filter returns to the full list', async ({ page }) => {
    const base = 'mqttboard/filtertest/close'
    await subscribe(page, `${base}/#`)
    for (const { topic, payload } of topicsFor(base)) {
      await publish(page, topic, payload)
    }
    await expect(messages(page)).toHaveCount(3, { timeout: 10000 })

    await openFilter(page)
    await treeNode(page, 'a').click()
    await expect(messages(page)).toHaveCount(2)

    // Close the filter via the cross in the tree pane
    const pane = subscriberPane(page)
    await pane.locator('.q-splitter__before .q-btn').filter({ has: page.locator('[class*="mdi-close"]') }).first().click()
    await expect(pane.locator('.q-splitter')).not.toBeVisible()
    await expect(messages(page)).toHaveCount(3)
  })
})
