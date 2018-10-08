<template>
  <q-page>
    <mqtt-client/>
  </q-page>
</template>

<style>
</style>

<script>
import MqttClient from '../components/MqttClient'
export default {
  name: 'PageIndex',
  components: {
    MqttClient
  }
}
</script>
