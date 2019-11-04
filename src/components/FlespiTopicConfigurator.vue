<template>
  <q-dialog v-model='opened' class="mqtt-board-modal mqtt-board-topic-modal" :maximized="$q.platform.is.mobile">
     <q-card :style="{minWidth: $q.platform.is.mobile ? '100%' : '30vw'}">
      <q-card-section class="q-pa-none">
        <q-toolbar :class="{[`bg-${color}`]: true, 'text-white': !!color}">
          <q-btn flat dense v-close-popup icon="keyboard_arrow_left" @click="clear"/>
          <q-toolbar-title>
            Topic config
          </q-toolbar-title>
        </q-toolbar>
      </q-card-section>
      <q-separator />
      <q-card-section :style="{ height: $q.platform.is.mobile ? 'calc(100% - 94px)' : '55vh'}" class="scroll">
        <div>
          <div class="q-mb-md q-py-sm" style="overflow: auto;">{{topic}}</div>
          <div class="q-mb-md">
            <div class="q-mb-xs">Type:</div>
            <q-btn-toggle toggle-color="grey-9" :dense="$q.platform.is.mobile" size="sm" v-model="type" :options="[{label: 'any', value: '+'}, ...types.map(type => ({label: type, value: type}))]"/>
          </div>
          <div class="q-mb-md">
            <div class="q-mb-xs">API:</div>
            <q-btn-toggle toggle-color="grey-9" :dense="$q.platform.is.mobile" size="sm" v-model="api" :options="apis.map(api => ({label: api, value: api}))"/>
          </div>
          <div class="q-mb-md">
            <div class="q-mb-xs">Entity:</div>
            <q-btn-toggle v-if="entities.length" :dense="$q.platform.is.mobile" toggle-color="grey-9" size="sm" v-model="entity" :options="[{label: 'any', value: '+'}, ...entities.map(entity => ({label: entity, value: entity}))]"/>
            <span v-else>Choose API</span>
          </div>
          <q-input color="grey-9" v-model="id" label="Identifier" outlined class="q-mb-md"/>
          <q-input v-if="isNeedPostfix" color="grey-9" v-model="postfix" outlined label="Postfix" />
        </div>
      </q-card-section>
      <q-separator />
      <q-card-actions align="right" :class="{[`bg-${color}`]: true, 'text-white': !!color}">
        <q-btn flat dense v-close-popup @click="clear">Close</q-btn>
        <q-btn flat dense v-close-popup @click="saveSettingsHandler">Save</q-btn>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script>
export default {
  name: 'FlespiTopicConfigurator',
  props: {
    color: {
      type: String,
      default: 'grey-9'
    }
  },
  data () {
    return {
      opened: false,
      topicBase: 'flespi/',
      type: '+',
      types: ['message', 'log', 'state'],
      api: '',
      posibleApis: ['platform', 'gw', 'storage', 'mqtt'],
      entity: '+',
      posibleEntities: {
        gw: ['channels', 'devices', 'streams', 'modems'],
        storage: ['containers'],
        mqtt: ['sessions'],
        platform: ['customer']
      },
      id: '',
      postfixModel: ''
    }
  },
  computed: {
    apis () {
      let apis = this.posibleApis
      if (this.type === 'message') { apis = ['gw'] }
      if (this.type === 'state') { apis = ['platform', 'gw', 'storage'] }
      this.setApi(apis[0])
      return apis
    },
    entities () {
      if (this.type === 'message') { return ['channels', 'devices', 'modems'] }
      return this.api ? this.posibleEntities[this.api] : []
    },
    postfix: {
      get () {
        if (this.postfixModel) { return this.postfixModel }
        if (this.type === 'state') { return '' }
        return '#'
      },
      set (value) {
        if (value) {
          this.postfixModel = value
        } else {
          if (this.type === 'state') {
            this.postfixModel = ''
          } else {
            this.postfixModel = '#'
          }
        }
      }
    },
    topic () {
      let topic = this.topicBase
      topic += this.type || '+'
      topic += '/'
      topic += this.api || '+'
      topic += '/'
      topic += this.entity || '+'
      topic += '/'
      topic += this.id || '+'
      topic += this.postfix && this.isNeedPostfix ? `/${this.postfix}` : ''
      return topic
    },
    isNeedPostfix () {
      return !(this.type === 'message' && this.api === 'gw' && this.entity === 'devices')
    }
  },
  methods: {
    saveSettingsHandler () {
      this.$emit('topic', this.topic)
      this.clear()
    },
    clear () {
      this.type = '+'
      this.api = ''
      this.entity = '+'
      this.id = ''
      this.postfix = ''
    },
    open () {
      this.opened = true
    },
    setApi (api) { this.api = api }
  },
  watch: {
    type () {
      this.api = ''
      this.entity = '+'
      this.id = ''
      this.postfix = ''
    },
    api () {
      this.entity = '+'
      this.id = ''
      this.postfix = ''
    },
    entity () {
      this.id = ''
      this.postfix = ''
    }
  }
}
</script>

<style>
</style>
