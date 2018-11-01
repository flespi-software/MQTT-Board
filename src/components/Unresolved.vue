<template>
  <div class="mqtt-client__not-resolved-msgs col-md-6 col-sm-12 col-xs-12" >
    <q-card class="not-resolved-msgs__main q-ma-sm">
      <q-card-title class="q-pa-none">
        <q-toolbar v-if="!filterMode" color="red-6" class="q-px-none">
          <q-toolbar-title>Unresolved messages</q-toolbar-title>
          <q-btn round flat icon="mdi-magnify" @click="filterMode = true"/>
        </q-toolbar>
        <q-input
          v-else
          class="q-ma-sm"
          color="dark"
          v-model="filter"
          placeholder="Filter by topic"
          autofocus
          :before="[
            {
              icon: 'mdi-arrow-left',
              handler () {
                filterMode = false
                filter = ''
              }
            }
          ]"
          :after="[
            {
              icon: 'mdi-close',
              condition: !!filter,
              handler () { filter = '' }
            }
          ]"
        />
      </q-card-title>
      <virtual-list
        :size="110"
        :remain="15"
        class="not-resolved-msgs__list"
        ref="scroller"
        :onscroll="listScroll"
      >
        <message :message="message" v-for="(message, msgIndex) in filteredNotResolvedMessages" :key="`subNRMsg${msgIndex}`"/>
      </virtual-list>
    </q-card>
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
      needAutoScroll: true,
      filterMode: false
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
      border 2px solid red
      height calc(100% - 32px)
    .not-resolved-msgs__list
      position absolute
      top 50px
      bottom 0
      right 0
      left 0
      height auto!important
</style>
