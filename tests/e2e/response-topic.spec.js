import { test, expect } from '@playwright/test'
import { spawn } from 'child_process'
import path from 'path'

const RESPONDER_SCRIPT = path.resolve('tests/helpers/mqtt-responder.js')

const BROKER_HOST_BROWSER = 'wss://mqtt.flespi.io'
const BROKER_HOST_NODE = 'wss://mqtt.flespi.io'
const BROKER_USERNAME = process.env.MQTT_TOKEN

test.describe('MQTT 5.0 Response Topic', () => {
  test.skip(!BROKER_USERNAME, 'MQTT_TOKEN env var is required. Run with: MQTT_TOKEN=<your-token> npx playwright test response-topic')
  test.use({ ignoreHTTPSErrors: true })

  let responderProcess

  test.afterEach(async () => {
    if (responderProcess) {
      responderProcess.kill('SIGINT')
      responderProcess = null
    }
  })

  test('should receive response via response topic from responder', async ({ page }) => {
    test.setTimeout(120000)

    const testId = Math.random().toString(36).slice(2, 8)
    const requestTopic = `test/${testId}/request`
    const responseTopic = `test/${testId}/response`

    // Start mqtt-responder.js as background process (uses WSS same as browser)
    responderProcess = spawn('node', [RESPONDER_SCRIPT], {
      env: {
        ...process.env,
        MQTT_BROKER: BROKER_HOST_NODE,
        MQTT_TOPIC: requestTopic,
        MQTT_USERNAME: BROKER_USERNAME,
      },
    })

    // Wait until the responder is subscribed
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Responder did not subscribe in time')), 15000)
      responderProcess.stdout.on('data', (data) => {
        console.log('[responder]', data.toString().trim())
        if (data.toString().includes('Subscribed to')) {
          clearTimeout(timeout)
          resolve()
        }
      })
      responderProcess.stderr.on('data', (data) => {
        console.error('[responder:err]', data.toString().trim())
      })
    })

    // Set up MQTT Board client in the browser
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.reload()
    await page.waitForTimeout(2000) // pause so user can see initial state

    // Create client with local broker
    await page.locator('.q-btn--fab').click()
    await expect(page.locator('.q-dialog')).toBeVisible()

    const hostInput = page.getByLabel('Host')
    await hostInput.clear()
    await hostInput.fill(BROKER_HOST_BROWSER)

    const usernameInput = page.getByLabel('Username')
    await usernameInput.clear()
    await usernameInput.fill(BROKER_USERNAME)

    await page.waitForTimeout(2000) // pause to see connection settings

    await page.getByRole('button', { name: /save/i }).click()
    await page.locator('.client__item .q-card').click()
    await expect(page.getByText(/online/i).first()).toBeVisible({ timeout: 10000 })
    await page.waitForTimeout(2000) // pause to see connected client

    // --- Use the default subscriber, change topic to response topic ---
    const subscriberPane = page.locator('.mqtt-client__subscriber')
    const subTopicInput = subscriberPane.getByLabel('Topic', { exact: true })
    await subTopicInput.clear()
    await subTopicInput.fill(responseTopic)

    await page.waitForTimeout(1500) // pause to see subscriber topic

    // Click subscribe (play button)
    await subscriberPane.locator('.q-btn').filter({ has: page.locator('[class*="mdi-play"]') }).click()
    await expect(subscriberPane.locator('.q-btn').filter({ has: page.locator('[class*="mdi-stop"]') })).toBeVisible({ timeout: 10000 })
    await page.waitForTimeout(2000) // pause to see subscribed state

    // --- Use the default publisher, reconfigure it ---
    const publisherPane = page.locator('.mqtt-client__publisher')

    const pubTopicInput = publisherPane.getByLabel('Topic', { exact: true })
    await pubTopicInput.clear()
    await pubTopicInput.fill(requestTopic)

    await publisherPane.getByLabel('Message', { exact: true }).clear()
    await publisherPane.getByLabel('Message', { exact: true }).fill('hello from test')

    // Expand Properties panel and set response topic
    await publisherPane.getByText('Properties', { exact: true }).click()
    await publisherPane.getByLabel('Response topic').fill(responseTopic)

    await page.waitForTimeout(3000) // pause to see publisher configured with response topic

    // Publish the message
    await publisherPane.locator('.q-toolbar .q-btn').filter({ has: page.locator('[class*="mdi-send"]') }).click()

    await page.waitForTimeout(5000) // pause to see the result

    // Poll internal state for the response message
    const pollResult = await page.evaluate(async (expectedTopic) => {
      const findComp = (el) => {
        if (!el) return null
        if (el.__vueParentComponent?.ctx?.clients) return el.__vueParentComponent.ctx
        for (const child of el.children || []) {
          const found = findComp(child)
          if (found) return found
        }
        return null
      }
      const comp = findComp(document.getElementById('q-app'))
      if (!comp) return { error: 'component not found' }

      for (let i = 0; i < 20; i++) {
        await new Promise(r => setTimeout(r, 500))
        const clientKeys = Object.keys(comp.clients)
        const client = comp.clients[clientKeys[0]]
        if (!client) continue
        const messages = client.messages[0]
        if (!Array.isArray(messages) || messages.length === 0) continue
        const responseMessages = messages.filter(m => m.topic === expectedTopic)
        if (responseMessages.length > 0) {
          return {
            found: true,
            totalMessages: messages.length,
            response: {
              topic: responseMessages[0].topic,
              payload: responseMessages[0].payload
            }
          }
        }
      }
      return { found: false, timeout: true }
    }, responseTopic)

    console.log('[result]', JSON.stringify(pollResult, null, 2))

    await page.waitForTimeout(3000) // final pause to inspect

    // Assert the response topic feature worked
    expect(pollResult.found).toBe(true)
    expect(pollResult.response.payload.status).toBe('ok')
    expect(pollResult.response.payload.requestPayload).toBe('hello from test')
    expect(pollResult.response.payload.requestTopic).toBe(requestTopic)
    expect(pollResult.response.topic).toBe(responseTopic)
  })
})
