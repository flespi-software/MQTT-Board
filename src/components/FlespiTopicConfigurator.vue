<template>
  <q-dialog :value='opened' content-class="mqtt-board__popup" :maximized="$q.platform.is.mobile">
     <q-card :style="{minWidth: $q.platform.is.mobile ? '100%' : '30vw'}">
      <q-card-section class="q-pa-none">
        <q-toolbar :class="{[`bg-${color}`]: true, 'text-white': !!color}">
          <q-toolbar-title>
            Flespi topic generator
          </q-toolbar-title>
        </q-toolbar>
      </q-card-section>
      <q-separator />
      <q-card-section :style="{ height: $q.platform.is.mobile ? 'calc(100% - 96px)' : ''}" class="scroll">
        <flespi-selector :value="this.currentTopic" :connector="bus" @input="update" :theme="{ color: 'orange' }"/>
      </q-card-section>
      <q-separator />
      <q-card-actions align="right" :class="{[`bg-${color}`]: true, 'text-white': !!color}">
        <q-btn flat dense v-close-popup @click="$emit('close')">Close</q-btn>
        <q-btn flat dense v-close-popup @click="saveSettingsHandler">Save</q-btn>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script>
import FlespiSelector from './selectors/Selectors'
export default {
  name: 'FlespiTopicConfigurator',
  props: {
    color: {
      type: String,
      default: 'grey-9'
    },
    value: String,
    bus: Object,
    opened: Boolean
  },
  data () {
    return {
      currentTopic: this.value
    }
  },
  methods: {
    saveSettingsHandler () {
      this.$emit('input', this.currentTopic)
      this.$emit('close')
    },
    update (topic) {
      const currentTopic = topic.topicPattern
      if (currentTopic) {
        this.currentTopic = currentTopic
      }
    }
  },
  components: { FlespiSelector }
}
</script>

<style>
</style>
