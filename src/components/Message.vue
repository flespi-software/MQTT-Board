<template>
  <q-card class="message">
    <div class="message__title q-pt-sm q-pl-sm q-pr-sm">
      <div :title="message.topic" class="message__topic ellipsis">
        {{message.topic}}
      </div>
      <div class="message__sys text-grey-7">
        {{`qos: ${message.qos}, dup: ${message.dup ? '+' : '-'}, retain: ${message.retain ? '+' : '-'}${timestamp}`}}
      </div>
      <q-btn color="indigo-4" size="sm" @click="$emit('action:send', message)" flat icon="mdi-send" round class="absolute-top-right" style="top: 10px; right: 8px; transform: rotate(-45deg);">
        <q-tooltip>Resend message</q-tooltip>
      </q-btn>
    </div>
    <div class="message__payload q-pa-sm q-mr-xs q-ml-xs bg-grey-2">
      <div v-if="typeof payload === 'string' && !payload.length">No message</div>
      <json-tree v-else-if="highlight" :data="payload"/>
      <div v-else-if="!highlight" class="message__payload q-pa-sm q-mr-xs q-ml-xs bg-grey-2">{{message.payload}}</div>
    </div>
    <div class="message__properties q-pa-sm text-grey-7">{{JSON.stringify(message.properties)}}</div>
  </q-card>
</template>

<script>
import { date } from 'quasar'
import JsonTree from './JsonTree'
export default {
  name: 'Message',
  props: ['message', 'highlight'],
  computed: {
    payload () {
      return this.message.payload
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
  .message
    .message__title
      height 50px
      position relative
    .message__topic
      font-size 0.8rem
      font-weight bold
      width: calc(100% - 30px)
    .message__sys
      font-size 0.8rem
      width: calc(100% - 30px)
    .message__payload
      height calc(100% - 20px)
      word-break break-all
      font-size 0.85rem
    .message__properties
      word-break break-all
      font-size: 0.7rem
</style>
