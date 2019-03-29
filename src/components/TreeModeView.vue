<template>
  <div :style="$q.platform.is.desktop ? {'display': 'inline-block', minWidth: '100%'} : []" style="user-select: none;">
    <template v-for="(key, index) in keys">
      <div
        :key="`${key}`"
        :style="{
          paddingLeft: `${10 * nesting + (data[key].children ? 0 : 14)}px`,
          display: $q.platform.is.desktop ? 'inline-block' : '',
          minWidth: $q.platform.is.desktop ? '100%' : '',
          overflow: $q.platform.is.desktop ? '' : 'hidden',
          textOverflow: $q.platform.is.desktop ? '' : 'ellipsis'
        }"
        @click="toggle(key, index)" class="cursor-pointer" :class="{'bg-grey-2': topic && topic === data[key].topic}">
        <template v-if="data[key].children"
      >
          <q-icon color="dark" v-if="showObj[key]" name="mdi-menu-down" style="vertical-align: baseline" />
          <q-icon color="dark" v-else name="mdi-menu-right" style="vertical-align: baseline" />
        </template>
        <span>{{key}}</span>
      </div>
      <tree-mode-view :key="`nest-${key}`" :nesting="nesting + 1" :topic="topic" v-if="showObj[key] && data[key].children" :data='data[key].children' @change="(value) => { $emit('change', value) }"/>
    </template>
  </div>
</template>

<script>
import Vue from 'vue'
export default {
  name: 'TreeModeView',
  props: {
    data: Object,
    topic: String,
    nesting: {
      type: Number,
      default: 0
    }
  },
  data () {
    const showObj = {}
    const keys = Object.keys(this.data)
    const len = keys.length
    for (let i = 0, l = len; i < l; i++) {
      showObj[keys[i]] = false
    }
    return {
      showObj: showObj
    }
  },
  computed: {
    keys () {
      return Object.keys(this.data).sort()
    }
  },
  methods: {
    toggle (key, index) {
      Vue.set(this.showObj, key, !this.showObj[key])
      this.$emit('change', this.data[key].topic)
    }
  }
}
</script>
