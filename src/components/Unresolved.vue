<template>
  <div class="mqtt-client__not-resolved-msgs col-md-6 col-sm-12 col-xs-12" >
    <q-card class="not-resolved-msgs__main q-ma-sm">
      <q-card-section class="q-pa-none">
        <q-toolbar v-if="!filterMode" class="q-pr-none text-white bg-red-6">
          <q-toolbar-title>Unresolved messages</q-toolbar-title>
          <q-btn round flat icon="mdi-magnify" @click="filterMode = true"/>
          <q-btn round flat icon="mdi-dots-vertical">
            <q-menu anchor="bottom right" self="top right">
              <q-list>
                <q-item v-close-popup @click.native="clearMessagesHandler" clickable v-ripple>
                  <q-item-section avatar><q-icon name="mdi-playlist-remove" /></q-item-section>
                  <q-item-section><q-item-label>Clear messages</q-item-label></q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-btn>
        </q-toolbar>
        <q-input
          v-else
          class="q-ma-sm q-mb-xs"
          color="grey-9" outlined hide-bottom-space
          v-model="filter"
          label="Filter by topic"
          autofocus
        >
          <q-btn slot="prepend" color="grey-9" icon="mdi-arrow-left" @click="filterMode = false, filter = ''" flat round/>
          <q-btn slot="append" color="grey-9" icon="mdi-close" @click="filter = ''" flat round v-if="!!filter"/>
        </q-input>
      </q-card-section>
      <virtual-list
        v-autoscroll="needAutoScroll"
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
import Message from './Message.vue'

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
      let el = this.$refs.scroller && this.$refs.scroller.$el
      if (!el) { return false }
      if (el.scrollTop < el.scrollHeight - el.clientHeight) {
        this.needAutoScroll = false
      } else {
        this.needAutoScroll = true
      }
    },
    clearMessagesHandler () {
      this.$emit('clear')
    }
  },
  components: { VirtualList, Message },
  directives: {
    autoscroll: {
      inserted (el, { value }) {
        if (value) {
          el.scrollTop = el.scrollHeight - el.clientHeight
        }
      },
      componentUpdated (el, { value }) {
        setTimeout(() => {
          if (value) {
            el.scrollTop = el.scrollHeight - el.clientHeight
          }
        }, 50)
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
      height calc(100% - 16px)
    .not-resolved-msgs__list
      position absolute
      top 50px
      bottom 0
      right 0
      left 0
      height auto!important
</style>
