<template>
  <q-card class="message">
    <div class="message__title q-pt-sm q-pl-sm q-pr-sm">
      <div :title="message.topic" class="message__topic ellipsis">
        {{message.topic}}
      </div>
      <div class="message__sys text-grey-7">
        {{`qos: ${message.qos}, dup: ${message.dup ? '+' : '-'}`}}
      </div>
    </div>
    <div class="message__payload q-pa-sm q-mr-xs q-ml-xs bg-grey-2">{{message.payload.toString()}}</div>
    <div class="message__properties q-pa-sm text-grey-7">{{JSON.stringify(message.properties)}}</div>
  </q-card>
</template>

<script>
export default {
  name: 'Message',
  props: ['message']
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
    .message__sys
      font-size 0.8rem
    .message__payload
      height calc(100% - 20px)
      word-break break-all
      font-size 0.85rem
    .message__properties
      word-break break-all
      font-size: 0.7rem
</style>
