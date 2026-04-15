<template>
  <q-dialog :model-value='opened' content-class="mqtt-board__popup" :maximized="$q.platform.is.mobile" persistent>
    <q-card :style="{width: $q.platform.is.mobile ? '100%' : cardWidth, maxWidth: $q.platform.is.mobile ? '100%' : '50vw'}"
      :class="{'flespi-topic-modal--mobile': $q.platform.is.mobile}"
    >
      <q-card-section class="q-pa-none flespi-topic-modal__header">
        <q-toolbar :class="{[`bg-${color}`]: true, 'text-white': !!color}">
          <q-toolbar-title>
            flespi topic constructor
          </q-toolbar-title>
        </q-toolbar>
      </q-card-section>
      <q-separator />
      <q-card-section class="q-pb-none" :class="{'flespi-topic-modal__content': $q.platform.is.mobile}">
        <flespi-topic-constructor
          :model-value="currentTopic"
          @update:model-value="currentTopic = $event"
          @topicLength="onTopicLength"
          :color="color"
          :connector="connector"
          :tree-height="$q.platform.is.mobile ? null : '50vh'"
          :mobile="$q.platform.is.mobile"
        />
      </q-card-section>
      <q-separator />
      <q-card-actions align="right" class="flespi-topic-modal__footer" :class="{[`bg-${color}`]: true, 'text-white': !!color}">
        <q-btn flat dense v-close-popup @click="$emit('close')">Close</q-btn>
        <q-btn flat dense v-close-popup @click="saveTopicHandler">Save</q-btn>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script>
import { defineComponent } from 'vue'
import FlespiTopicConstructor from './FlespiTopicConstructor.vue'

const paddingToTheRight = 80 // px, some space from the topic's end to the right edge of the modal, for visual harmony

export default defineComponent({
  name: 'FlespiTopicModal',
  components: { FlespiTopicConstructor },
  props: {
    color: {
      type: String,
      default: 'grey-9'
    },
    modelValue: String,
    opened: Boolean,
    connector: {
      type: Object,
      default: null
    }
  },
  emits: ['update:modelValue', 'close'],
  data () {
    return {
      currentTopic: this.modelValue,
      baseWidth: 50, // vw, starting width
      maxWidth: 0,
      windowWidth: typeof window !== 'undefined' ? window.innerWidth : 1200
    }
  },
  watch: {
    modelValue (val) {
      this.currentTopic = val
    }
  },
  computed: {
    cardWidth () {
      const basePixels = (this.baseWidth / 100) * this.windowWidth
      const maxVw = this.windowWidth * 0.5
      return Math.min(Math.max(basePixels, this.maxWidth), maxVw) + 'px'
    }
  },
  methods: {
    onTopicLength (length) {
      this.maxWidth = length + paddingToTheRight
    },
    saveTopicHandler () {
      this.$emit('update:modelValue', this.currentTopic)
      this.$emit('close')
    },
    _onResize () {
      if (this._resizeRaf) { return }
      this._resizeRaf = requestAnimationFrame(() => {
        this.windowWidth = window.innerWidth
        this._resizeRaf = null
      })
    }
  },
  created () {
    this._resizeRaf = null
  },
  mounted () {
    window.addEventListener('resize', this._onResize)
  },
  beforeUnmount () {
    window.removeEventListener('resize', this._onResize)
    if (this._resizeRaf) { cancelAnimationFrame(this._resizeRaf) }
  }
})
</script>

<style scoped>
.flespi-topic-modal--mobile {
  display: flex;
  flex-direction: column;
  height: 100dvh;
  max-height: 100dvh;
  overflow: hidden;
}
.flespi-topic-modal--mobile > .q-separator {
  flex-shrink: 0;
}
.flespi-topic-modal--mobile .flespi-topic-modal__header {
  flex-shrink: 0;
}
.flespi-topic-modal--mobile .flespi-topic-modal__content {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}
.flespi-topic-modal--mobile .flespi-topic-modal__content > :deep(*) {
  height: 100%;
}
.flespi-topic-modal--mobile .flespi-topic-modal__footer {
  flex-shrink: 0;
}
</style>
