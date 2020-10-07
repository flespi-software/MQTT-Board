<template>
  <q-page class="flex flex-center">
    <integration
      style="width: 100%; height: 100vh;"
      ref="randomName"
      host="http://mqttboard.flespi.io/#/integration"
      name="randomName"
      @ready="readyHandler"
      @updateSettings="update"
    />
  </q-page>
</template>

<script>
// let config = {
//   settings: {
//     username: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
//   },
//   useLS: false,
//   entities: [
//     {
//       type: 'subscriber',
//       rendered: true,
//       settings: {
//         topic: 'a/b',
//         mode: 0,
//         options: {
//           qos: 0,
//           nl: false,
//           rap: false,
//           rh: 0,
//           properties: {
//             subscriptionIdentifier: undefined,
//             userProperties: undefined
//           }
//         }
//       }
//     },
//     {
//       type: 'subscriber',
//       rendered: true,
//       settings: {
//         topic: 'a/c',
//         mode: 0,
//         options: {
//           qos: 0,
//           nl: false,
//           rap: false,
//           rh: 0,
//           properties: {
//             subscriptionIdentifier: 3,
//             userProperties: undefined
//           }
//         }
//       }
//     }
//   ],
//   whiteLabel: 'MQTT',
//   secure: undefined,
//   clientsCloseable: false,
//   color: undefined,
//   accentColor: undefined,
//   configuredClients: [
//     {
//       status: false,
//       config: {
//         clientId: 'mqtt-board-50dd48be',
//         wsOptions: { objectMode: false, perMessageDeflate: true },
//         host: 'wss://mqtt.flespi.io',
//         keepalive: 420,
//         protocolVersion: 5,
//         resubscribe: false,
//         clean: true,
//         username: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
//         password: '',
//         properties: { requestResponseInformation: false, requestProblemInformation: false }
//       },
//       publishers: [],
//       subscribers: [
//         { topic: 'a/b', mode: 0, treeField: '', highlight: true, options: { qos: 0, nl: false, rap: false, rh: 0, properties: {} }, unsubscribeProperties: {} },
//         { topic: 'a/c', mode: 0, treeField: '', highlight: true, options: { qos: 0, nl: false, rap: false, rh: 0, properties: { subscriptionIdentifier: 3 } }, unsubscribeProperties: {} }
//       ],
//       entities: [{ type: 'logs', rendered: true }, { type: 'subscriber', rendered: true, index: 0, id: '29a45a15' }, { type: 'subscriber', rendered: true, index: 1, id: '29a77ca2' }],
//       subscribersStatuses: [false, false],
//       subscribersConnectivityStatuses: [false, false]
//     }
//   ]
// }

import Integration from '../src/components/Integration'
export default {
  name: 'PageIndex',
  data () {
    return {
      config: {
        settings: undefined,
        useLS: undefined,
        entities: undefined,
        whiteLabel: 'MQTT',
        secure: undefined,
        clientsCloseable: undefined,
        color: undefined,
        accentColor: undefined,
        configuredClients: undefined
      }
    }
  },
  components: { Integration },
  methods: {
    readyHandler () {
      this.$refs.randomName.setSettings(this.config)
      this.$refs.randomName.setActive(0)
      this.$refs.randomName.addPublisher({
        topic: 'topic/to/publish',
        payload: 'test',
        options: {
          qos: 1,
          retain: false,
          dup: false,
          properties: {
            payloadFormatIndicator: undefined,
            messageExpiryInterval: 2323,
            topicAlias: undefined,
            responseTopic: undefined,
            correlationData: undefined,
            userProperties: undefined,
            contentType: undefined
          }
        }
      })
      this.$refs.randomName.addSubscriber({
        topic: 'topic/to/subscribe',
        mode: 1,
        treeField: '',
        highlight: true,
        options: { qos: 1, nl: false, rap: false, rh: 0, properties: {} },
        unsubscribeProperties: {}
      })
    },
    update (config) {
      this.config = { ...this.config, ...config }
    }
  }
}
</script>
