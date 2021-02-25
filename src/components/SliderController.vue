<template>
  <div class="wrapper__footer row no-wrap items-center justify-between bg-grey-9">
    <q-resize-observer @resize="({ width }) => wrapperWidth = width"/>
    <div>
      <q-btn
        :disable="buttonsDisable.prev" v-if="needScrollButtons"
        color="white" icon="mdi-chevron-left" dense flat size="21px"
        @click="$emit('swipe', 'right')"
      >
        <q-tooltip>Previous pannel</q-tooltip>
      </q-btn>
    </div>
    <div class="flex relative-position">
      <q-btn v-if="needShowMore[0]" class="wrapper__left-more"
        color="white" icon="mdi-dots-horizontal" dense flat size="10px"
        @click="$emit('swipe-to', 0)"
      >
        <q-tooltip>Go to first pannel</q-tooltip>
      </q-btn>
      <div v-for="item in shownItems" :key="item.queue" @click="$emit('swipe-to', item.queue)" class="q-py-xs row inline" :class="getItemClasses(item.queue)">
        <q-btn round size="4px" class="q-mx-xs" :color="colors[item.type]" unelevated>
          <q-tooltip :content-class="[`bg-${colors[item.type]}`]" max-width="250px">
            <div>
              <div class="text-bold">{{item.type.toUpperCase()}}</div>
              <div class="ellipsis" v-if="item.config && item.config.topic">Topic: {{item.config.topic}}</div>
              <div class="ellipsis" v-if="item.config && item.config.payload">Payload: {{item.config.payload}}</div>
            </div>
          </q-tooltip>
        </q-btn>
      </div>
      <q-btn v-if="needShowMore[1]" class="wrapper__right-more"
        color="white" icon="mdi-dots-horizontal" dense flat size="10px"
        @click="$emit('swipe-to', entities.length - 1)"
      >
        <q-tooltip>Go to last pannel</q-tooltip>
      </q-btn>
    </div>
    <div>
      <q-btn
        :disable="buttonsDisable.next" v-if="needScrollButtons"
        color="white" icon="mdi-chevron-right" dense flat size="21px"
        @click="$emit('swipe', 'left')"
      >
        <q-tooltip>Next pannel</q-tooltip>
      </q-btn>
    </div>
  </div>
</template>

<style lang="stylus">
  .wrapper__footer
    position absolute
    bottom 0
    left 0
    right 0
    height 50px
  .item--active
    background-color $grey-3
  .item--active-left
    border-radius 50% 0 0 50%
  .item--active-right
    border-radius 0 50% 50% 0
  .item--active-all
    border-radius 50%
  .wrapper__left-more
    position absolute
    left -4px
    top -1px
    height 100%
    z-index 1
    background-color $grey-9
  .wrapper__right-more
    position absolute
    right -4px
    top -1px
    height 100%
    z-index 1
    background-color $grey-9
</style>

<script>
export default {
  props: {
    entities: Array,
    buttonsDisable: Object,
    active: Array
  },
  data () {
    return {
      colors: {
        logs: 'blue',
        subscriber: 'orange',
        publisher: 'indigo',
        unresolved: 'red-6'
      },
      wrapperWidth: 0
    }
  },
  computed: {
    viewedItemsCount () {
      return Math.floor((this.wrapperWidth - (48 * 2)) / 20)
    },
    visibleItemsRange () {
      const sidesVisibleItemsCount = Math.floor((this.viewedItemsCount - ((this.active[1] - this.active[0]) + 1)) / 2)
      const min = 0
      const max = this.entities.length - 1
      const maxVisible = (sidesVisibleItemsCount * 2) + ((this.active[1] - this.active[0]) + 1)
      let minVisibleIndex = this.active[0] - sidesVisibleItemsCount < 0 ? 0 : this.active[0] - sidesVisibleItemsCount
      let maxVisibleIndex = this.active[1] + sidesVisibleItemsCount > max ? max : this.active[1] + sidesVisibleItemsCount
      if (minVisibleIndex === min) { maxVisibleIndex = maxVisible - 1 }
      if (maxVisibleIndex === max) { minVisibleIndex = (max - maxVisible) + 1 }
      return [minVisibleIndex, maxVisibleIndex]
    },
    shownItems () {
      return this.entities.reduce((res, entity, index) => {
        if (this.visibleItemsRange[0] <= index && this.visibleItemsRange[1] >= index) {
          res.push({ queue: index, ...entity })
        }
        return res
      }, [])
    },
    needScrollButtons () {
      return this.shownItems.length < this.entities.length
    },
    needShowMore () {
      const flags = [false, false]
      if (this.visibleItemsRange[0] > 0) { flags[0] = true }
      if (this.visibleItemsRange[1] < this.entities.length - 1) { flags[1] = true }
      return flags
    }
  },
  methods: {
    getItemClasses (index) {
      const classes = []
      if (this.active[0] <= index && this.active[1] >= index) { classes.push('item--active') }
      if (this.active[1] === index && this.active[0] === index) {
        classes.push('item--active-all')
      } else if (this.active[0] === index) {
        classes.push('item--active-left')
      } else if (this.active[1] === index) {
        classes.push('item--active-right')
      }
      return classes
    }
  }
}
</script>
