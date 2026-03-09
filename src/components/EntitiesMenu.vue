<template>
  <q-list>
    <q-item-label header>Panes</q-item-label>
    <div class="scroll absolute full-width" style="height: calc(100% - 48px);" @dragover.prevent @drop.prevent="onDropContainer">
      <q-item
        v-for="(entity, index) in visibleItems" :key="`${entity.type}-${entity.id}`"
        :active="entity.rendered" clickable @click="$emit('pick', index)"
        class="q-ma-xs rounded-borders" style="overflow: hidden;"
        :class="[getItemClasses(entity), { 'entities-menu__drag-over': dragOverIndex === index }]"
        :draggable="isDraggable(entity)"
        @dragstart="onDragStart(index, $event)"
        @dragend="onDragEnd"
        @dragover.prevent="onDragOver(index, entity, $event)"
        @dragleave="onDragLeave(index)"
        @drop.prevent="onDrop(index)"
      >
        <div class="absolute-top-left absolute-bottom-left" :class="[`bg-${`${colorByType[entity.type]}-6`}`]" style="width: 10px;"></div>
        <q-item-section>
          <q-item-label header class="q-pa-none text-bold" :class="[`text-${entity.rendered ? 'white' : `${colorByType[entity.type]}-10`}`]">{{labelByType[entity.type]}}</q-item-label>
          <q-item-label class="ellipsis" caption :class="[`text-${entity.rendered ? 'grey-2' : `${colorByType[entity.type]}-10`}`]" v-if="entity.type === 'subscriber' || entity.type === 'publisher'">{{entity.settings.topic}}</q-item-label>
          <q-item-label class="ellipsis" caption :class="[`text-${entity.rendered ? 'grey-2' : `${colorByType[entity.type]}-10`}`]" v-if="entity.type === 'publisher'"><small>{{entity.settings.payload}}</small></q-item-label>
        </q-item-section>
        <q-item-section v-if="entity.type === 'subscriber' || entity.type === 'publisher'" side>
          <q-btn dense outline color="white" v-if="entity.type === 'publisher'" :disable="!isValidPublisher(entity.settings)" icon="mdi-send" @click.stop="$emit('publish', entity.settings)">
            <q-tooltip>Publish</q-tooltip>
          </q-btn>
          <q-btn dense outline color="white" v-if="entity.type === 'subscriber'" :disable="!isValidSubscriber(entity.settings)" :icon="entity.status ? 'mdi-stop' : 'mdi-play'" @click.stop="$emit(entity.status ? 'subscriber:stop' : 'subscriber:play', entity.index)">
            <q-tooltip>{{entity.status ? 'Stop' : 'Subscribe'}}</q-tooltip>
          </q-btn>
        </q-item-section>
      </q-item>
    </div>
  </q-list>
</template>

<script>
import { defineComponent } from 'vue'
import validateEntities from '../mixins/validateEntities.js'
export default defineComponent({
  props: ['entities', 'active'],
  emits: ['pick', 'publish', 'subscriber:stop', 'subscriber:play', 'reorder'],
  data () {
    return {
      colorByType: {
        subscriber: 'orange',
        publisher: 'indigo',
        logs: 'blue',
        unresolved: 'red'
      },
      labelByType: {
        subscriber: 'Subscriber',
        publisher: 'Publisher',
        logs: 'Logs',
        unresolved: 'Unresolved'
      },
      dragFromIndex: null,
      dragOverIndex: null
    }
  },
  computed: {
    visibleItems () {
      let visibleIndex = 0
      return this.entities.reduce((res, entity) => {
        const item = { ...entity }
        if (entity.rendered) {
          item.visibleIndex = visibleIndex
          visibleIndex++
        }
        res.push(item)
        return res
      }, [])
    }
  },
  methods: {
    isValidPublisher (settings) {
      return !Object.keys(this.validatePublisher(settings, true)).length
    },
    isValidSubscriber (settings) {
      return !Object.keys(this.validateSubscriber(settings, true)).length
    },
    getItemClasses (entity) {
      const classes = [`bg-${entity.rendered ? `${this.colorByType[entity.type]}-6` : 'grey-13'}`]
      if (this.active[0] > entity.visibleIndex || this.active[1] < entity.visibleIndex || entity.visibleIndex === undefined) {
        classes.push('q-ml-md')
      }
      return classes
    },
    isDraggable (entity) {
      return entity.type === 'publisher' || entity.type === 'subscriber'
    },
    onDragStart (index, event) {
      this.dragFromIndex = index
      event.dataTransfer.effectAllowed = 'move'
    },
    onDragEnd () {
      this.dragFromIndex = null
      this.dragOverIndex = null
    },
    onDragOver (index, entity, event) {
      if (this.dragFromIndex === null || this.dragFromIndex === index) { return }
      if (!this.isDraggable(entity)) { return }
      event.dataTransfer.dropEffect = 'move'
      this.dragOverIndex = index
    },
    onDragLeave () {
      // intentionally empty: dragOverIndex is managed by onDragOver, onDrop, and onDragEnd
    },
    onDrop (index) {
      if (this.dragFromIndex === null || this.dragFromIndex === index) { return }
      const target = this.visibleItems[index]
      if (!this.isDraggable(target)) { return }
      this.$emit('reorder', this.dragFromIndex, index)
      this.dragFromIndex = null
      this.dragOverIndex = null
    },
    onDropContainer () {
      if (this.dragOverIndex !== null) {
        this.onDrop(this.dragOverIndex)
      }
    }
  },
  mixins: [validateEntities]
})
</script>

<style scoped>
.entities-menu__drag-over {
  margin-top: 30px;
  transition: margin-top 0.15s ease;
}
</style>
