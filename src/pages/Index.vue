<template>
  <q-page>
    <mqtt-client :useLocalStorage="needUseLS" :initSettings="initSettings" :needInitNewClient="needInitNewClient"/>
  </q-page>
</template>

<style>
</style>

<script>
import MqttClient from '../components/MqttClient'
import { defaultSettings } from '../mixins/defaults.js'
import merge from 'lodash/merge'
import cloneDeep from 'lodash/cloneDeep'
export default {
  name: 'PageIndex',
  data () {
    return {
      initSettings: undefined,
      needUseLS: undefined,
      needInitNewClient: undefined
    }
  },
  created () {
    let mode = this.$route.params.mode,
      token = this.$route.params.token,
      sessionSettings = this.$q.sessionStorage.getItem('mqtt-board-session-settings')
    if (sessionSettings) {
      mode = sessionSettings.mode
      token = sessionSettings.token
    }
    if (mode === 'onetime') {
      this.initSettings = cloneDeep(merge({}, defaultSettings, { username: token }))
      this.needUseLS = false
      this.needInitNewClient = true
      !sessionSettings && this.$router.push('/')
      this.$q.sessionStorage.set('mqtt-board-session-settings', { mode, token })
    }
  },
  components: {
    MqttClient
  }
}
</script>
