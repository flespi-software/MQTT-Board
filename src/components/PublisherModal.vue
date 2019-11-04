<template>
  <q-dialog ref="modal" @show="$emit('show')" @hide="$emit('hide')" class="mqtt-board-modal mqtt-board-publisher-modal" :maximized="$q.platform.is.mobile">
     <q-card :style="{width: $q.platform.is.mobile ? '100%' : '50vw'}">
      <q-card-section class="q-pa-none">
        <q-toolbar class="q-pr-none bg-indigo text-white">
          <q-toolbar-title>Publisher</q-toolbar-title>
          <q-btn round :disable="!isValidPublisher" flat icon="mdi-send" @click="$emit('publish', config), hide()">
            <q-tooltip>Publish</q-tooltip>
          </q-btn>
          <q-btn round flat icon="mdi-close" @click="hide"/>
        </q-toolbar>
      </q-card-section>
      <q-separator />
      <q-card-section :style="{ height: $q.platform.is.mobile ? 'calc(100% - 50px)' : '70vh'}" class="scroll q-pa-none">
        <div class="mqtt-client__publisher">
          <div class="q-pa-md">
            <q-input color="grey-9" outlined class="q-mb-xs" hide-bottom-space v-model="config.topic" label="Topic" :error="!isValidPublisher"/>
            <q-input
              color="grey-9" outlined class="q-mb-xs" hide-bottom-space autogrow
              type="textarea q-textarea--fix"
              v-model="config.payload"
              label="Message"
            />
            <q-expansion-item :value="true" class="q-mt-sm q-mb-sm bg-grey-2" label="Options">
              <div class="q-pa-sm">
                <div class="q-px-md q-py-sm">
                  <div class="q-mb-sm">
                    QoS
                    <q-btn-toggle flat rounded toggle-text-color="grey-9" text-color="grey-6" class="q-ml-sm" v-model="config.options.qos" :options="[{label: '0', value: 0},{label: '1', value: 1},{label: '2', value: 2}]"/>
                  </div>
                </div>
                <q-checkbox style="display: flex;" color="grey-9" class="q-mt-sm q-mb-sm" v-model="config.options.retain" label="Retain"/>
                <q-checkbox style="display: flex;" color="grey-9" class="q-mt-sm q-mb-sm" v-model="config.options.dup" label="Duplicate flag"/>
                <q-expansion-item v-if="version === 5" class="q-mt-sm q-mb-sm bg-grey-4" label="Properties" :value="true">
                  <div class="q-px-md q-py-sm">
                    <q-checkbox color="grey-9" class="q-mt-sm q-mb-sm" v-model="config.options.properties.payloadFormatIndicator" label="Payload format indicator"/>
                    <q-input
                      color="grey-9" type="number" label="Message expiry interval" clearable outlined class="q-mb-xs" hide-bottom-space
                      v-model="config.options.properties.messageExpiryInterval"
                      @clear="config.options.properties.messageExpiryInterval = undefined"
                      :error="!isNil(config.options.properties.messageExpiryInterval) && (config.options.properties.messageExpiryInterval < 0 || config.options.properties.messageExpiryInterval > 0xffffffff)"
                    />
                    <q-input
                      color="grey-9" type="number" label="Topic alias" clearable outlined class="q-mb-xs" hide-bottom-space
                      v-model="config.options.properties.topicAlias"
                      @clear="config.options.properties.topicAlias = undefined"
                      :error="!isNil(config.options.properties.topicAlias) && (config.options.properties.topicAlias <= 0 || config.options.properties.topicAlias > 0xffff)"
                    />
                    <q-input color="grey-9" v-model="config.options.properties.responseTopic" label="Response topic" outlined class="q-mb-xs" hide-bottom-space/>
                    <q-input color="grey-9" type="textarea" autogrow v-model="config.options.properties.correlationData" label="Correlation data" outlined class="q-mb-xs q-textarea--fix" hide-bottom-space/>
                    <div class="q-mb-sm">
                      <div class="q-mt-md">User Properties</div>
                      <div>
                        <q-list v-if="config.options.properties.userProperties" class="q-mb-xs">
                          <q-item v-for="(value, name) in config.options.properties.userProperties" :key="`${name}: ${value}`" style="min-height: 17px;">
                            <q-icon class="q-mr-sm cursor-pointer" size='1rem' @click.native="removePublishUserProperty(name)" name="mdi-close-circle"/>
                            <span>{{`${name}: ${value}`}}</span>
                          </q-item>
                        </q-list>
                        <q-input color="grey-9" outlined class="q-mb-xs" hide-bottom-space v-model="publishUserProperty.name" label="User property name"/>
                        <q-input color="grey-9" outlined class="q-mb-xs" hide-bottom-space v-model="publishUserProperty.value" label="User property value"/>
                        <q-btn :disable="!publishUserProperty.name || !publishUserProperty.value" style="width: 100%" class="q-mt-sm" color="grey-9" @click="addPublishUserProperty()">Add</q-btn>
                      </div>
                    </div>
                    <q-input color="grey-9" outlined class="q-mb-xs" hide-bottom-space v-model="config.options.properties.contentType" label="Content type"/>
                  </div>
                </q-expansion-item>
              </div>
            </q-expansion-item>
          </div>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script>
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
        payload: JSON.stringify(this.message.payload),
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
        this.$set(this.config.options.properties, 'userProperties', {})
      }
      this.$set(this.config.options.properties.userProperties, this.publishUserProperty.name, this.publishUserProperty.value)
      this.publishUserProperty = {
        value: '',
        name: ''
      }
    },
    removePublishUserProperty (name) {
      this.$delete(this.config.options.properties.userProperties, name)
      if (!Object.keys(this.config.options.properties.userProperties).length) {
        this.$set(this.config.options.properties, 'userProperties', null)
      }
    },
    show () { this.$refs.modal.show() },
    hide () { this.$refs.modal.hide() }
  },
  mixins: [validateTopic]
}
</script>

<style lang="stylus">
  .q-textarea--fix
    &.q-textarea.q-field--labeled textarea.q-field__native
      min-height 27px
  .mqtt-client__publisher
    .publisher__item
      border 2px solid #3f51b5
      height calc(100% - 16px)
      position relative
    .publisher__main
      position relative
      height calc(100% - 50px)
</style>
