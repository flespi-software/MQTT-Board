<template>
  <div class="mqtt-client__not-resolved-msgs" >
    <q-card class="not-resolved-msgs__main q-ma-sm">
      <q-card-section class="q-pa-none">
        <q-toolbar v-if="!filterMode" class="q-pr-none text-white bg-red-6">
          <q-toolbar-title>Unresolved messages</q-toolbar-title>
          <q-btn round flat icon="mdi-magnify" @click="filterMode = true">
            <q-tooltip>Search</q-tooltip>
          </q-btn>
          <q-btn round flat icon="mdi-eye-off-outline" @click="$emit('hide')">
            <q-tooltip>Hide panel</q-tooltip>
          </q-btn>
          <q-btn round flat icon="mdi-dots-vertical">
            <q-menu anchor="bottom right" self="top right" content-class="mqtt-board__popup">
              <q-list>
                <q-item v-close-popup @click="clearMessagesHandler" clickable v-ripple>
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
          <template #prepend>
            <q-btn color="grey-9" icon="mdi-arrow-left" @click="filterMode = false, filter = ''" flat round/>
          </template>
          <template #append>
            <q-btn color="grey-9" icon="mdi-close" @click="filter = ''" flat round v-if="!!filter"/>
          </template>
        </q-input>
      </q-card-section>
      <q-virtual-scroll
        ref="scroller"
        class="not-resolved-msgs__list"
        :items="filteredNotResolvedMessages"
        @virtual-scroll="onScroll"
        virtual-scroll-item-size="110"
      >
        <template v-slot="{ item, index }">
          <message :message="item" :key="`subNRMsg${index}`"/>
        </template>
      </q-virtual-scroll>
    </q-card>
  </div>
</template>

<script>
import { defineComponent } from 'vue'
import Message from './Message.vue'

export default defineComponent({
  name: 'Unresolved',
  props: ['messages'],
  emits: ['hide', 'clear'],
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
    onScroll (e) {
      if (e.index < (this.filteredNotResolvedMessages.length - 2) && e.direction === 'decrease') {
        this.needAutoScroll = false
      } else if (e.index >= (this.filteredNotResolvedMessages.length - 2) && e.direction === 'increase') {
        this.needAutoScroll = true
      }
    },
    clearMessagesHandler () {
      this.$emit('clear')
    }
  },
  watch: {
    filteredNotResolvedMessages () {
      this.$nextTick(() => {
        if (this.needAutoScroll && this.filteredNotResolvedMessages.length > 0 && this.$refs.scroller) {
          this.$refs.scroller.scrollTo(this.filteredNotResolvedMessages.length - 1)
        }
      })
    }
  },
  components: { Message }
})
</script>

<style lang="scss">
  .mqtt-client__not-resolved-msgs {
    .not-resolved-msgs__main {
      position: relative;
      border: 2px solid red;
      height: calc(100% - 16px);
    }
    .not-resolved-msgs__list {
      position: absolute;
      top: 50px;
      bottom: 0;
      right: 0;
      left: 0;
      height: auto !important;
    }
  }
</style>
