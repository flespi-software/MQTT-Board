#!/usr/bin/env node

const mqtt = require('mqtt')

// Configuration
const BROKER_URL = process.env.MQTT_BROKER || 'mqtt://localhost:11003'
const SUBSCRIBE_TOPIC = process.env.MQTT_TOPIC || 'requests/#'
const CLIENT_ID = `responder-${Math.random().toString(16).slice(2, 8)}`

const connectOptions = {
  clientId: CLIENT_ID,
  protocolVersion: 5, // MQTT 5.0 required for response topic
}

if (process.env.MQTT_USERNAME) {
  connectOptions.username = process.env.MQTT_USERNAME
}
if (process.env.MQTT_PASSWORD) {
  connectOptions.password = process.env.MQTT_PASSWORD
}

const client = mqtt.connect(BROKER_URL, connectOptions)

client.on('connect', () => {
  console.log(`Connected to ${BROKER_URL} as ${CLIENT_ID}`)
  client.subscribe(SUBSCRIBE_TOPIC, { qos: 1 }, (err) => {
    if (err) {
      console.error('Subscribe error:', err)
      process.exit(1)
    }
    console.log(`Subscribed to "${SUBSCRIBE_TOPIC}"`)
  })
})

client.on('message', (topic, payload, packet) => {
  const responseTopic = packet.properties && packet.properties.responseTopic
  const correlationData = packet.properties && packet.properties.correlationData

  console.log(`Received on "${topic}": ${payload.toString()}`)

  if (!responseTopic) {
    console.log('  No response topic set, skipping response')
    return
  }

  // Build your response here
  const response = JSON.stringify({
    status: 'ok',
    requestTopic: topic,
    requestPayload: payload.toString(),
    timestamp: new Date().toISOString(),
  })

  const publishOptions = {
    qos: 1,
    properties: {},
  }

  // Forward correlation data if present so the requester can match the response
  if (correlationData) {
    publishOptions.properties.correlationData = correlationData
  }

  client.publish(responseTopic, response, publishOptions, (err) => {
    if (err) {
      console.error(`  Failed to publish to "${responseTopic}":`, err)
    } else {
      console.log(`  Response sent to "${responseTopic}"`)
    }
  })
})

client.on('error', (err) => {
  console.error('MQTT error:', err)
})

client.on('close', () => {
  console.log('Connection closed')
})

process.on('SIGINT', () => {
  console.log('\nDisconnecting...')
  client.end(false, () => process.exit(0))
})
