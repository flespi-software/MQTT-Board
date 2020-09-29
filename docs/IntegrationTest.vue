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
import Integration from '../src/components/Integration'
export default {
  name: 'PageIndex',
  data () {
    return {
      config: {
        settings: undefined,
        useLS: undefined,
        entities: undefined,
        whiteLabel: 'Mqtt',
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
    },
    update (config) {
      this.config = config
    }
  }
}
</script>
