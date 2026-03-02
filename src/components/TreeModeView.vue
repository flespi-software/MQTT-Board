<template>
  <div :style="$q.platform.is.desktop ? {'display': 'block', width: '100%'} : []" style="user-select: none;line-height:16px;">
    <template v-for="(key, index) in limitedKeys" :key="`${key}`">
      <div
        :style="{
          paddingLeft: `${10 * nesting + (data[key].children ? 0 : 14)}px`,
          width: $q.platform.is.desktop ? `calc(100% -10px)` : '',
          overflow: $q.platform.is.desktop ? '' : 'hidden',
          textOverflow: $q.platform.is.desktop ? '' : 'ellipsis',
          position: 'relative'
        }"
        @click="toggle(key, index)" class="cursor-pointer hover-highlight" :class="{'bg-grey-2': topic && topic === data[key].topic}"
      >

        <div :class="{'text-italic': !key, 'text-orange-6': data[key].value}"  style="white-space: nowrap;width:calc(100% - 150px);">
          <template v-if="data[key].children">
            <q-icon color="grey-9" v-if="showObj[key]" name="mdi-menu-down" style="vertical-align: baseline" />
            <q-icon color="grey-9" v-else name="mdi-menu-right" style="vertical-align: baseline" />
          </template>
          <div class="topic-font-element inline-block" :style="`white-space: pre-wrap;width:calc(100% - ${data[key].children ? 22 : 10}px);overflow:hidden;text-overflow: ellipsis;`">{{key || '*Empty*'}}</div>
          <q-icon color="grey-9" v-if="getRetainFlag(key)" name="mdi-content-save-outline" style="vertical-align:top">
            <q-tooltip>Retain message</q-tooltip>
          </q-icon>
        </div>
        <div v-if="data[key].value && data[key].value['']" class="absolute-right ellipsis text-grey vertical-middle q-px-md q-pt-xs text-right" style="font-size:10px;width:150px;" :title="JSON.stringify(data[key].value[''].payload)">{{ data[key].value && data[key].value[''] && data[key].value[''].payload }}</div>
      </div>
      <tree-mode-view :nesting="nesting + 1" :expandByValue="expand" :topic="topic" v-if="showObj[key] && data[key].children" :data='data[key].children' @change="(value) => { $emit('change', value) }"/>
    </template>
    <div
      @click="limit += 1000"
      v-if="keys.length > limitedKeys.length"
      class="more-button cursor-pointer text-bold"
      style="display: inline-block;"
      :style="{
        marginLeft: `${10 * nesting + 14}px`
      }"
    >
      more {{keys.length - limit >= 1000 ? 1000 : keys.length - limit}}
    </div>
  </div>
</template>

<style lang="scss">
  .more-button:hover {
    background-color: var(--q-grey-4, #bdbdbd);
  }
  .hover-highlight:hover {
    background-color: var(--q-grey-3, #eeeeee);
  }
</style>

<script>
import { defineComponent } from 'vue'
export default defineComponent({
  name: 'TreeModeView',
  props: {
    data: Object,
    topic: String,
    nesting: {
      type: Number,
      default: 0
    },
    expandByValue: {
      type: Boolean,
      default: false
    }
  },
  emits: ['change'],
  data () {
    const showObj = {}
    const keys = Object.keys(this.data)
    const len = keys.length
    let expand = this.expandByValue
    for (let i = 0, l = len; i < l; i++) {
      if (expand && (this.data[keys[i]].value || keys.length > 1)) {
        expand = false
      }
      showObj[keys[i]] = expand
    }
    return {
      showObj: showObj,
      limit: 10000,
      expand
    }
  },
  computed: {
    keys () {
      return Object.keys(this.data).sort((a, b) => {
        a = a.toLowerCase()
        b = b.toLowerCase()
        if (a !== b) {
          const na = Number(a),
            ba = Number(b)
          if (na + '' === a && ba + '' === b) {
            return na - ba
          } else {
            return (a > b) ? 1 : -1
          }
        }
      })
    },
    limitedKeys () {
      return this.keys.slice(0, this.limit)
    }
  },
  methods: {
    toggle (key, index) {
      this.showObj[key] = !this.showObj[key]
      this.$emit('change', this.data[key].topic)
    },
    getRetainFlag (key) {
      const value = this.data[key].value
      if (!value) { return false }
      return Object.values(value).reduce((res, packet) => {
        if (!res) { return res }
        res = packet.retain
        return res
      }, true)
    }
  }
})
</script>
