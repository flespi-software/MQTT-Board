<template>
  <div class="mqtt-client__not-resolved-msgs col-xl-3 col-md-6 col-sm-12 col-xs-12" >
    <div class="not-resolved-msgs__main q-ma-sm q-card">
      <q-toolbar style="border-bottom: 1px solid #999;" color="white" text-color="dark">
        <q-toolbar-title>Unresolved messages</q-toolbar-title>
      </q-toolbar>
      <q-input placeholder="Topic filter" color="dark" v-model="filter" class="q-mx-sm q-mt-xs"/>
      <virtual-list
        :size="110"
        :remain="15"
        class="not-resolved-msgs__list"
        ref="scroller"
        :onscroll="listScroll"
      >
        <message :message="message" v-for="(message, msgIndex) in filteredNotResolvedMessages" :key="`subNRMsg${msgIndex}`"/>
      </virtual-list>
    </div>
  </div>
</template>

<script>
import VirtualList from 'vue-virtual-scroll-list'
import Message from './Message'

export default {
  name: 'Unresolved',
  props: ['messages'],
  data () {
    return {
      filter: '',
      needAutoScroll: true
    }
  },
  computed: {
    filteredNotResolvedMessages () {
      return this.messages.filter(msg => msg.topic.indexOf(this.filter) !== -1)
    }
  },
  methods: {
    listScroll: function (e, data) {
      let el = this.$refs.scroller.$el
      if (el.scrollTop < el.scrollHeight - el.clientHeight) {
        this.needAutoScroll = false
      } else {
        this.needAutoScroll = true
      }
    }
  },
  components: { VirtualList, Message },
  updated () {
    if (this.messages && !this.messages.length) {
      this.currentScrollTop = 0
    } else {
      if (this.needAutoScroll && this.$refs.scroller) {
        let el = this.$refs.scroller.$el
        el.scrollTop = el.scrollHeight - el.clientHeight
      }
    }
  }
}
</script>

<style lang="stylus">
  .mqtt-client__not-resolved-msgs
    .not-resolved-msgs__main
      position relative
      border 2px solid #f2c037
      height calc(100% - 32px)
    .not-resolved-msgs__list
      position absolute
      top 102px
      bottom 0
      right 0
      left 0
      height auto!important
</style>
