<template>
  <q-modal v-model='opened'>
    <q-modal-layout>
      <q-toolbar slot="header" :color='color'>
        <q-btn flat dense v-close-overlay icon="keyboard_arrow_left" @click="clear"/>
        <q-toolbar-title>
          Topic config
        </q-toolbar-title>
      </q-toolbar>
      <div style="margin: 20px;" :style="{ height: $q.platform.is.mobile ? 'calc(100% - 100px)' : '50vh', width: $q.platform.is.mobile ? 'calc(100% - 40px)' : '30vw'}">
        <div class="q-mb-md q-py-sm" style="overflow: auto;">{{topic}}</div>
        <div class="q-mb-md">
          <div class="q-mb-xs">Type:</div>
          <q-btn-toggle toggle-color="dark" :dense="$q.platform.is.mobile" size="sm" v-model="type" :options="[{label: 'any', value: '+'}, ...types.map(type => ({label: type, value: type}))]"/>
        </div>
        <div class="q-mb-md">
          <div class="q-mb-xs">API:</div>
          <q-btn-toggle toggle-color="dark" :dense="$q.platform.is.mobile" size="sm" v-model="api" :options="apis.map(api => ({label: api, value: api}))"/>
        </div>
        <div>
          <div class="q-mb-xs">Entity:</div>
          <q-btn-toggle v-if="entities.length" :dense="$q.platform.is.mobile" toggle-color="dark" size="sm" v-model="entity" :options="[{label: 'any', value: '+'}, ...entities.map(entity => ({label: entity, value: entity}))]"/>
          <span v-else>Choose API</span>
        </div>
        <q-input color="dark" v-model="id" float-label="Identifier" />
        <q-input v-if="isNeedPostfix" color="dark" v-model="postfix" float-label="Postfix" />
      </div>
      <q-toolbar slot="footer" :color='color'>
        <q-toolbar-title>
        </q-toolbar-title>
        <q-btn flat dense v-close-overlay @click="saveSettingsHandler">Save</q-btn>
      </q-toolbar>
    </q-modal-layout>
  </q-modal>
</template>

<script>
export default {
  name: 'FlespiTopicConfigurator',
  props: {
    color: {
      type: String,
      default: 'dark'
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
        storage: ['abques', 'containers'],
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
