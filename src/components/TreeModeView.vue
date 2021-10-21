<template>
  <div :style="$q.platform.is.desktop ? {'display': 'inline-block', minWidth: '100%'} : []" style="user-select: none;">
    <template v-for="(key, index) in limitedKeys">
      <div
        :key="`${key}`"
        :style="{
          paddingLeft: `${10 * nesting + (data[key].children ? 0 : 14)}px`,
          display: $q.platform.is.desktop ? 'inline-block' : '',
          minWidth: $q.platform.is.desktop ? '100%' : '',
          overflow: $q.platform.is.desktop ? '' : 'hidden',
          textOverflow: $q.platform.is.desktop ? '' : 'ellipsis'
        }"
        @click="toggle(key, index)" class="cursor-pointer" :class="{'bg-grey-2': topic && topic === data[key].topic}"
      >
        <template v-if="data[key].children">
          <q-icon color="grey-9" v-if="showObj[key]" name="mdi-menu-down" style="vertical-align: baseline" />
          <q-icon color="grey-9" v-else name="mdi-menu-right" style="vertical-align: baseline" />
        </template>
        <span :class="{'text-grey-9': true, 'text-italic': !key, 'text-grey-10': data[key].value, 'text-bold': data[key].value}" style="white-space: nowrap;">
          {{key || '*Empty*'}}
          <q-icon color="grey-9" v-if="getRetainFlag(key)" name="mdi-content-save-outline" style="vertical-align: baseline">
            <q-tooltip>Retain message</q-tooltip>
          </q-icon>
        </span>
      </div>
      <tree-mode-view :key="`nest-${key}`" :nesting="nesting + 1" :expandByValue="expand" :topic="topic" v-if="showObj[key] && data[key].children" :data='data[key].children' @change="(value) => { $emit('change', value) }"/>
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

<style lang="stylus">
  .more-button:hover
      background-color $grey-3
</style>

<script>
export default {
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
      this.$set(this.showObj, key, !this.showObj[key])
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
}
</script>
