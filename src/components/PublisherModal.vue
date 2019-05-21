<template>
  <q-modal ref="modal" @show="$emit('show')" @hide="$emit('hide')" class="mqtt-board-modal mqtt-board-publisher-modal">
    <q-modal-layout>
      <q-toolbar slot="header" color="indigo" class="q-px-none">
        <q-toolbar-title>Publisher</q-toolbar-title>
        <q-btn round :disable="!isValidPublisher" flat icon="mdi-send" @click="$emit('publish', config), hide()">
          <q-tooltip>Publish</q-tooltip>
        </q-btn>
        <q-btn round flat icon="mdi-close" @click="hide"/>
      </q-toolbar>
      <div class="mqtt-client__publisher" style="width: 50vw; height: 70vh">
        <div class="q-pa-md">
          <q-input color="dark" v-model="config.topic" float-label="Topic" :error="!isValidPublisher"/>
          <q-input
            color="dark"
            type="textarea"
            :max-height="200"
            v-model="config.payload"
            float-label="Message"
          />
          <q-collapsible opened class="q-mt-sm q-mb-sm bg-grey-2" label="Options">
            <div>
              <div class="q-mb-sm">
                QoS
                <q-btn-toggle flat rounded toggle-text-color="dark" text-color="grey-6" class="q-ml-sm" v-model="config.options.qos" :options="[{label: '0', value: 0},{label: '1', value: 1},{label: '2', value: 2}]"/>
              </div>
            </div>
            <q-checkbox style="display: flex;" color="dark" class="q-mt-sm q-mb-sm" v-model="config.options.retain" label="Retain"/>
            <q-checkbox style="display: flex;" color="dark" class="q-mt-sm q-mb-sm" v-model="config.options.dup" label="Duplicate flag"/>
            <q-collapsible v-if="version === 5" class="q-mt-sm q-mb-sm bg-grey-4" label="Properties" opened>
              <q-checkbox color="dark" class="q-mt-sm q-mb-sm" v-model="config.options.properties.payloadFormatIndicator" label="Payload format indicator"/>
              <q-input color="dark" type="number" v-model="config.options.properties.messageExpiryInterval" float-label="Message expiry interval" clearable :clear-value="undefined" :error="!isNil(config.options.properties.messageExpiryInterval) && (config.options.properties.messageExpiryInterval < 0 || config.options.properties.messageExpiryInterval > 0xffffffff)"/>
              <q-input color="dark" type="number" v-model="config.options.properties.topicAlias" float-label="Topic alias" clearable :clear-value="undefined" :error="!isNil(config.options.properties.topicAlias) && (config.options.properties.topicAlias <= 0 || config.options.properties.topicAlias > 0xffff)"/>
              <q-input color="dark" v-model="config.options.properties.responseTopic" float-label="Response topic"/>
              <q-input color="dark" type="textarea" :max-height="50" v-model="config.options.properties.correlationData" float-label="Correlation data"/>
              <div>
                <div class="q-mt-md">User Properties</div>
                <div>
                  <q-list v-if="config.options.properties.userProperties">
                    <q-item v-for="(value, name) in config.options.properties.userProperties" :key="`${name}: ${value}`">
                      <q-icon class="q-mr-sm cursor-pointer" size='1rem' @click.native="removePublishUserProperty(name)" name="mdi-close-circle"/>
                      <span>{{`${name}: ${value}`}}</span>
                    </q-item>
                  </q-list>
                  <q-input color="dark" v-model="publishUserProperty.name" float-label="User property name"/>
                  <q-input color="dark" v-model="publishUserProperty.value" float-label="User property value"/>
                  <q-btn :disable="!publishUserProperty.name || !publishUserProperty.value" style="width: 100%" class="q-mt-sm" color="dark" @click="addPublishUserProperty()">Add</q-btn>
                </div>
              </div>
              <q-input color="dark" v-model="config.options.properties.contentType" float-label="Content type"/>
            </q-collapsible>
          </q-collapsible>
        </div>
      </div>
    </q-modal-layout>
  </q-modal>
</template>

<script>
import Vue from 'vue'
import validateTopic from '../mixins/validateTopic.js'
import isNil from 'lodash/isNil'
import cloneDeep from 'lodash/cloneDeep'

export default {
  name: 'PublisherModal',
  props: [
    'message',
    'version'
  ],
  data () {
    return {
      config: {
        topic: this.message.topic,
        payload: this.message.payload.toString(),
        options: {
          qos: this.message.qos,
          retain: this.message.retain,
          dup: this.message.dup,
          properties: cloneDeep(this.message.properties)
        }
      },
      publishUserProperty: {
        value: '',
        name: ''
      }
    }
  },
  computed: {
    isValidPublisher () {
      return !!this.config.topic && this.validateTopic(this.config.topic) &&
        (this.version === 4 || (this.version === 5 &&
          (isNil(this.config.options.properties.messageExpiryInterval) || (this.config.options.properties.messageExpiryInterval >= 0 && this.config.options.properties.messageExpiryInterval <= 0xffffffff)) &&
          (isNil(this.config.options.properties.topicAlias) || (this.config.options.properties.topicAlias > 0 && this.config.options.properties.topicAlias <= 0xffff))
        ))
    }
  },
  methods: {
    isNil,
    addPublishUserProperty () {
      if (!this.config.options.properties.userProperties) {
        Vue.set(this.config.options.properties, 'userProperties', {})
      }
      Vue.set(this.config.options.properties.userProperties, this.publishUserProperty.name, this.publishUserProperty.value)
      this.publishUserProperty = {
        value: '',
        name: ''
      }
    },
    removePublishUserProperty (name) {
      Vue.delete(this.config.options.properties.userProperties, name)
      if (!Object.keys(this.config.options.properties.userProperties).length) {
        Vue.set(this.config.options.properties, 'userProperties', null)
      }
    },
    show () { this.$refs.modal.show() },
    hide () { this.$refs.modal.hide() }
  },
  mixins: [validateTopic]
}
</script>

<style lang="stylus">
  .mqtt-client__publisher
    .publisher__item
      border 2px solid #3f51b5
      height calc(100% - 16px)
      position relative
    .publisher__main
      position relative
      height calc(100% - 50px)
</style>
