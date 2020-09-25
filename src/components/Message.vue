<template>
  <q-card class="message q-my-sm q-mx-sm">
    <div class="message__title q-pt-sm q-pl-sm q-pr-sm">
      <div :title="message.topic" class="message__topic ellipsis">
        {{message.topic}}
      </div>
      <div class="message__sys text-grey-7">
        {{`qos: ${message.qos}, dup: ${message.dup ? '+' : '-'}, retain: ${message.retain ? '+' : '-'}${timestamp}`}}
      </div>
      <q-btn color="indigo-4" size="sm" @click="$emit('action-send', message)" flat icon="mdi-send" round class="absolute-top-right" style="top: 10px; right: 8px; transform: rotate(-45deg);">
        <q-tooltip class="desktop-only">Resend message</q-tooltip>
      </q-btn>
    </div>
    <div class="message__payload q-pa-sm q-mr-xs q-ml-xs bg-grey-2 relative-position">
      <div v-if="typeof payload === 'string' && !payload.length">No message</div>
      <json-tree v-else-if="highlight" :data="payload"/>
      <div v-else-if="!highlight" class="message__payload q-pa-sm q-mr-xs q-ml-xs bg-grey-2">{{message.payload}}</div>
      <q-btn v-if="canCopy" icon="content_copy" @click="copyPayloadHandler" size="0.7rem" flat color="orange" style="position: absolute; right: 0; bottom: 2px;"/>
    </div>
    <div class="message__properties q-pa-sm text-grey-7">{{JSON.stringify(message.properties)}}</div>
  </q-card>
</template>

<script>
import { date, copyToClipboard } from 'quasar'
import JsonTree from './JsonTree.vue'
export default {
  name: 'Message',
  props: ['message', 'highlight'],
  computed: {
    canCopy () {
      return !(typeof this.payload === 'string' && !this.payload.length) && !!copyToClipboard
    },
    payload () {
      return this.message.payload
    },
    timestamp () {
      return this.message.properties && this.message.properties.userProperties && this.message.properties.userProperties.timestamp
        ? `, ${date.formatDate(this.message.properties.userProperties.timestamp * 1000, 'DD/MM/YYYY HH:mm:ss')}`
        : ''
    }
  },
  methods: {
    copyPayloadHandler () {
      copyToClipboard(typeof this.payload === 'string' ? this.payload : JSON.stringify(this.payload)).then((e) => {
        this.$q.notify({
          color: 'positive',
          icon: 'content_copy',
          message: '<div class="text-center" style="font-size: 1.2rem;">Payload copied</div>',
          html: true,
          timeout: 1000
        })
      }, (e) => {
        this.$q.notify({
          color: 'negative',
          icon: 'content_copy',
          message: '<div class="text-center" style="font-size: 1.2rem;">Coping error</div>',
          html: true,
          timeout: 1000
        })
      })
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
