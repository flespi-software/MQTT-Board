<template>
  <q-dialog ref="modal" @show="$emit('show')" @hide="$emit('hide')" content-class="mqtt-board__popup" :maximized="$q.platform.is.mobile">
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
            <q-input no-error-icon color="grey-9" v-model="config.topic" label="Topic" :error="validateSetting('topic')" :error-message="getValidateMessage('topic')" outlined class="q-mb-xs" hide-bottom-space>
              <q-icon slot="after" name="mdi-information-outline"><q-tooltip>{{getDescription('topic')}}</q-tooltip></q-icon>
            </q-input>
            <q-input
              color="grey-9" outlined class="q-mb-xs q-textarea--fix" hide-bottom-space autogrow
              type="textarea"
              v-model="config.payload"
              label="Message"
            >
              <q-icon slot="after" name="mdi-information-outline"><q-tooltip>{{getDescription('payload')}}</q-tooltip></q-icon>
            </q-input>
            <q-expansion-item :value="true" class="bg-grey-2" label="Options">
              <div>
                <div class="q-mx-md" style="line-height: 34px;">
                  <div style="width: calc(100% - 36px);display:inline-flex;">
                    QoS
                    <q-btn-toggle flat rounded toggle-text-color="grey-9" text-color="grey-6" class="q-ml-sm" v-model="config.options.qos" :options="[{label: '0', value: 0},{label: '1', value: 1},{label: '2', value: 2}]"/>
                  </div>
                  <q-icon size="24px" color="grey-7" style="margin-left: 12px" slot="after" name="mdi-information-outline"><q-tooltip>{{getDescription('options.qos')}}</q-tooltip></q-icon>
                </div>
                <div class="q-mr-md q-ml-sm">
                  <q-checkbox style="width: calc(100% - 36px)" color="grey-9" v-model="config.options.retain" label="Retain"/>
                  <q-icon size="24px" color="grey-7" style="margin-left: 12px" slot="after" name="mdi-information-outline"><q-tooltip max-width="200px">{{getDescription('options.retain')}}</q-tooltip></q-icon>
                </div>
                <div class="q-mr-md q-ml-sm">
                  <q-checkbox style="width: calc(100% - 36px)" color="grey-9" v-model="config.options.dup" label="Duplicate flag"/>
                  <q-icon size="24px" color="grey-7" style="margin-left: 12px" slot="after" name="mdi-information-outline"><q-tooltip max-width="200px">{{getDescription('options.dup')}}</q-tooltip></q-icon>
                </div>
                <q-expansion-item v-if="version === 5" :value="true" class="q-mt-sm q-mb-sm bg-grey-4" label="Properties">
                  <div class="q-px-md q-pb-sm">
                    <div>
                      <q-checkbox style="width: calc(100% - 36px)" color="grey-9" class="q-mt-sm q-mb-sm" v-model="config.options.properties.payloadFormatIndicator" label="Payload format indicator"/>
                      <q-icon size="24px" color="grey-7" style="margin-left: 12px" slot="after" name="mdi-information-outline"><q-tooltip>{{getDescription('options.properties.payloadFormatIndicator')}}</q-tooltip></q-icon>
                    </div>
                    <q-input
                      color="grey-9" type="number" label="Message expiry interval" outlined class="q-mb-xs" hide-bottom-space
                      v-model.number="config.options.properties.messageExpiryInterval"
                      @input="(val) => { if (!val) { config.options.properties.messageExpiryInterval = undefined } }"
                      :error="validateSetting('options.properties.messageExpiryInterval')"
                      :error-message="getValidateMessage('options.properties.messageExpiryInterval')"
                      no-error-icon
                    >
                      <q-icon slot="after" name="mdi-information-outline"><q-tooltip>{{getDescription('options.properties.messageExpiryInterval')}}</q-tooltip></q-icon>
                    </q-input>
                    <q-input
                      color="grey-9" type="number" label="Topic alias" outlined class="q-mb-xs" hide-bottom-space
                      v-model.number="config.options.properties.topicAlias"
                      @input="(val) => { if (!val) { config.options.properties.topicAlias = undefined } }"
                      :error="validateSetting('options.properties.topicAlias')"
                      :error-message="getValidateMessage('options.properties.topicAlias')"
                      no-error-icon
                    >
                      <q-icon slot="after" name="mdi-information-outline"><q-tooltip>{{getDescription('options.properties.topicAlias')}}</q-tooltip></q-icon>
                    </q-input>
                    <q-input color="grey-9" v-model="config.options.properties.responseTopic" label="Response topic" outlined class="q-mb-xs" hide-bottom-space>
                      <q-icon slot="after" name="mdi-information-outline"><q-tooltip>{{getDescription('options.properties.responseTopic')}}</q-tooltip></q-icon>
                    </q-input>
                    <q-input color="grey-9" outlined class="q-textarea--fix q-mb-xs" hide-bottom-space type="textarea" autogrow v-model="config.options.properties.correlationData" label="Correlation data">
                      <q-icon slot="after" name="mdi-information-outline"><q-tooltip max-width="200px">{{getDescription('options.properties.correlationData')}}</q-tooltip></q-icon>
                    </q-input>
                    <q-input color="grey-9" outlined class="q-mb-xs" hide-bottom-space v-model="config.options.properties.contentType" label="Content type">
                      <q-icon slot="after" name="mdi-information-outline"><q-tooltip>{{getDescription('options.properties.contentType')}}</q-tooltip></q-icon>
                    </q-input>
                    <div class="q-mb-sm">
                      <div class="q-mt-md q-mb-sm">
                        <div style="width: calc(100% - 36px);display:inline-flex;">User Properties</div>
                        <q-icon size="24px" color="grey-7" style="margin-left: 12px" slot="after" name="mdi-information-outline">
                          <q-tooltip>{{getDescription('options.properties.userProperties')}}</q-tooltip>
                        </q-icon>
                      </div>
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
import validateEntities from '../mixins/validateEntities.js'
import { publisher as declarations } from '../mixins/declarations.js'
import get from 'lodash/get'
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
      declarations,
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
    validationModel () {
      return this.validatePublisher(this.config, true)
    },
    isValidPublisher () {
      return !Object.keys(this.validationModel).length
    }
  },
  methods: {
    isNil,
    addPublishUserProperty () {
      if (!this.config.options.properties.userProperties) {
        this.$set(this.config.options.properties, 'userProperties', {})
      }
      const userProperties = this.config.options.properties.userProperties
      if (userProperties[this.publishUserProperty.name]) {
        if (Array.isArray(userProperties[this.publishUserProperty.name])) {
          userProperties[this.publishUserProperty.name].push(this.publishUserProperty.value)
        } else {
          this.$set(userProperties, this.publishUserProperty.name, [userProperties[this.publishUserProperty.name], this.publishUserProperty.value])
        }
      } else {
        this.$set(userProperties, this.publishUserProperty.name, this.publishUserProperty.value)
      }
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
    hide () { this.$refs.modal.hide() },
    validateSetting (path) {
      return !!get(this.validationModel, path, false)
    },
    getValidateMessage (path) {
      return get(this.validationModel, path, '')
    },
    getDescription (path) {
      return get(this.declarations, `${path}.desc`, '')
    }
  },
  mixins: [validateEntities]
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
