<template>
  <div :style="$q.platform.is.desktop ? {'display': 'inline-block', minWidth: '100%'} : []">
    <template v-for="(value, key, index) in data">
      <div
        :key="`${key}-${index}`"
        :style="{
          paddingLeft: `${10 * nesting + (value.children ? 0 : 14)}px`,
          display: $q.platform.is.desktop ? 'inline-block' : '',
          minWidth: $q.platform.is.desktop ? '100%' : '',
          overflow: $q.platform.is.desktop ? '' : 'hidden',
          textOverflow: $q.platform.is.desktop ? '' : 'ellipsis'
        }"
        @click="toggle(key, index)" class="cursor-pointer" :class="{'bg-grey-2': topic && topic === value.topic}">
        <template v-if="value.children"
      >
          <q-icon color="dark" v-if="showObj[index]" name="mdi-menu-down" style="vertical-align: baseline" />
          <q-icon color="dark" v-else name="mdi-menu-right" style="vertical-align: baseline" />
        </template>
        <span>{{key}}</span>
      </div>
      <uniq-tree :key="`nest-${key}-${index}`" :nesting="nesting + 1" :topic="topic" v-if="showObj[index] && value.children" :data='value.children' @change="(value) => { $emit('change', value) }"/>
    </template>
  </div>
</template>

<script>
import Vue from 'vue'
export default {
  name: 'UniqTree',
  props: {
    data: Object,
    topic: String,
    nesting: {
      type: Number,
      default: 0
    }
  },
  data () {
    const showObj = []
    const len = Object.keys(this.data).length
    for (let i = 0, l = len; i < l; i++) {
      showObj.push(false)
    }
    return {
      showObj: showObj
    }
  },
  methods: {
    toggle (key, index) {
      Vue.set(this.showObj, index, !this.showObj[index])
      this.$emit('change', this.data[key].topic)
    }
  }
}
</script>
