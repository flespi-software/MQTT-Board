<template>
  <q-card class="uniq-message">
    <div class="message__title q-pt-sm q-pl-sm q-pr-sm">
      <div :title="message.topic" class="message__topic ellipsis">
        {{message.topic}}
      </div>
      <div class="message__sys text-grey-7">
        {{`qos: ${message.qos}, retain: ${message.retain ? '+' : '-'}${timestamp}`}}
      </div>
    </div>
    <div class="message__payload q-pa-sm q-mr-xs q-ml-xs bg-grey-2 scroll">
      <json-tree :data="payload"/>
    </div>
  </q-card>
</template>

<script>
import { date } from 'quasar'
import JsonTree from './JsonTree'
export default {
  name: 'UniqMessage',
  props: ['message'],
  computed: {
    payload () {
      let payload = this.message.payload.toString()
      try {
        payload = JSON.parse(payload)
      } catch (e) {}
      return payload
    },
    timestamp () {
      return this.message.properties && this.message.properties.userProperties && this.message.properties.userProperties.timestamp
        ? `, ${date.formatDate(this.message.properties.userProperties.timestamp * 1000, 'DD/MM/YYYY HH:mm:ss')}`
        : ''
    }
  },
  components: { JsonTree }
}
</script>

<style lang="stylus" scoped>
  .uniq-message
    height 100%
    .message__title
      height 50px
      position relative
    .message__topic
      font-size 0.8rem
      font-weight bold
    .message__sys
      font-size 0.8rem
    .message__payload
      height calc(100% - 50px)
      word-break break-all
      font-size 0.85rem
    .message__properties
      word-break break-all
      font-size: 0.7rem
</style>
