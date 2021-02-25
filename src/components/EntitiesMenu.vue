<template>
  <q-list>
    <q-item-label header>Panes</q-item-label>
    <div class="scroll absolute full-width" style="height: calc(100% - 48px);">
      <q-item
        v-for="(entity, index) in visibleItems" :key="`${entity.type}-${entity.id}`"
        :active="entity.rendered" clickable @click="$emit('pick', index)"
        class="q-ma-xs rounded-borders" style="overflow: hidden;"
        :class="getItemClasses(entity)"
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
import isNil from 'lodash/isNil'
import validateTopic from '../mixins/validateTopic.js'
export default {
  props: ['entities', 'active'],
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
      }
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
      return !!settings.topic && this.validateTopic(settings.topic) &&
        (isNil(settings.options.properties.messageExpiryInterval) || (settings.options.properties.messageExpiryInterval >= 0 && settings.options.properties.messageExpiryInterval <= 0xffffffff)) &&
        (isNil(settings.options.properties.topicAlias) || (settings.options.properties.topicAlias > 0 && settings.options.properties.topicAlias <= 0xffff))
    },
    isValidSubscriber (settings) {
      return !!settings.topic && this.validateTopic(settings.topic) &&
        (isNil(settings.options.properties.subscriptionIdentifier) || (settings.options.properties.subscriptionIdentifier > 0 && settings.options.properties.subscriptionIdentifier <= 268435455))
    },
    getItemClasses (entity) {
      const classes = [`bg-${entity.rendered ? `${this.colorByType[entity.type]}-6` : 'grey-13'}`]
      if (this.active[0] > entity.visibleIndex || this.active[1] < entity.visibleIndex || entity.visibleIndex === undefined) {
        classes.push('q-ml-md')
      }
      return classes
    }
  },
  mixins: [validateTopic]
}
</script>
