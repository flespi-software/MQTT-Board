<template>
  <q-page>
    <mqtt-client
      v-if="inited"
      ref="client"
      :useLocalStorage="useLS"
      :initEntities="entities"
      :initSettings="settings"
      :needInitNewClient="!!settings"
      :whiteLabel="whiteLabel"
      :secure="secure"
      :accentColor="accentColor"
      :configuredClients="configuredClients"
      :clientsCloseable="clientsCloseable"
      @change="update"
    />
  </q-page>
</template>

<style>
</style>

<script>
import MqttClient from '../components/MqttClient'
export default {
  name: 'PageIntegration',
  data () {
    return {
      inited: false,
      settings: undefined,
      clientsCloseable: undefined,
      useLS: undefined,
      entities: undefined,
      whiteLabel: undefined,
      secure: undefined,
      color: undefined,
      accentColor: undefined,
      configuredClients: undefined
    }
  },
  created () {
    this.$integrationBus.on('SetSettings', (config) => {
      for (const name in config) {
        this[name] = config[name]
      }
      this.inited = true
    })
    this.$integrationBus.on('SetActive', (index) => {
      this.$refs.client.setActiveClient(index)
    })
    this.$integrationBus.on('AddPublisher', (config) => {
      this.$refs.client.addPublisher(config)
    })
    this.$integrationBus.on('AddSubscriber', (config) => {
      this.$refs.client.addSubscriber(config)
    })
    this.$integrationBus.send('ready')
  },
  methods: {
    update (configuredClients) {
      this.$integrationBus.send('updateSettings', { configuredClients })
    }
  },
  components: {
    MqttClient
  }
}
</script>
