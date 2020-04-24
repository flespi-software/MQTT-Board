<template>
  <div class="mqtt-client__publisher col-md-4 col-sm-6 col-xs-12">
    <q-card class="publisher__item q-ma-sm">
      <q-card-section class="q-pa-none">
        <q-toolbar class="q-pr-none text-white bg-indigo">
          <q-toolbar-title>Publisher</q-toolbar-title>
          <q-btn round :disable="!isValidPublisher" flat icon="mdi-send" @click="$emit('publish')">
            <q-tooltip>Publish</q-tooltip>
          </q-btn>
          <q-btn round flat icon="mdi-dots-vertical">
            <q-menu anchor="bottom right" self="top right" content-class="mqtt-board__popup">
              <q-list>
                <q-item v-close-popup @click.native="$emit('remove')" clickable v-ripple>
                  <q-item-section avatar><q-icon color="red" name="mdi-delete-outline" /></q-item-section>
                  <q-item-section><q-item-label>Remove</q-item-label></q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-btn>
        </q-toolbar>
      </q-card-section>
      <q-card-section class="publisher__main q-pb-none">
        <div class="q-mt-md">
          <q-input color="grey-9" v-model="config.topic" label="Topic" :error="!isValidPublisher" outlined class="q-mb-xs q-mt-sm" hide-bottom-space/>
          <q-input
            color="grey-9" outlined class="q-mb-xs q-textarea--fix" hide-bottom-space autogrow
            type="textarea"
            v-model="config.payload"
            label="Message"
          />
          <q-expansion-item :value="true" class="q-my-sm bg-grey-2" label="Options">
            <div class="q-pa-sm">
              <div class="q-px-md q-py-sm">
                <div class="q-mb-sm">
                  QoS
                  <q-btn-toggle flat rounded toggle-text-color="grey-9" text-color="grey-6" class="q-ml-sm" v-model="config.options.qos" :options="[{label: '0', value: 0},{label: '1', value: 1},{label: '2', value: 2}]"/>
                </div>
              </div>
              <q-checkbox style="display: flex;" color="grey-9" class="q-mt-sm q-mb-sm" v-model="config.options.retain" label="Retain"/>
              <q-checkbox style="display: flex;" color="grey-9" class="q-mt-sm q-mb-sm" v-model="config.options.dup" label="Duplicate flag"/>
              <q-expansion-item v-if="version === 5" class="q-mt-sm q-mb-sm bg-grey-4" label="Properties">
                <div class="q-px-md q-py-sm">
                  <q-checkbox color="grey-9" class="q-mt-sm q-mb-sm" v-model="config.options.properties.payloadFormatIndicator" label="Payload format indicator"/>
                  <q-input
                    color="grey-9" type="number" label="Message expiry interval" clearable outlined class="q-mb-xs" hide-bottom-space
                    v-model.number="config.options.properties.messageExpiryInterval"
                    @clear="config.options.properties.messageExpiryInterval = undefined"
                    :error="!isNil(config.options.properties.messageExpiryInterval) && (config.options.properties.messageExpiryInterval < 0 || config.options.properties.messageExpiryInterval > 0xffffffff)"
                  />
                  <q-input
                    color="grey-9" type="number" label="Topic alias" clearable outlined class="q-mb-xs" hide-bottom-space
                    v-model.number="config.options.properties.topicAlias"
                    @clear="config.options.properties.topicAlias = undefined"
                    :error="!isNil(config.options.properties.topicAlias) && (config.options.properties.topicAlias <= 0 || config.options.properties.topicAlias > 0xffff)"
                  />
                  <q-input color="grey-9" v-model="config.options.properties.responseTopic" label="Response topic" outlined class="q-mb-xs" hide-bottom-space/>
                  <q-input color="grey-9" outlined class="q-textarea--fix q-mb-xs" hide-bottom-space type="textarea" autogrow v-model="config.options.properties.correlationData" label="Correlation data"/>
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
      </q-card-section>
    </q-card>
  </div>
</template>

<script>
import validateTopic from '../mixins/validateTopic.js'
import isNil from 'lodash/isNil'

export default {
  name: 'Publisher',
  props: [
    'value',
    'version'
  ],
  data () {
    return {
      config: this.value,
      publishUserProperty: {
        value: '',
        name: ''
      }
    }
  },
  computed: {
    isValidPublisher () {
      return !!this.config.topic && this.validateTopic(this.config.topic) &&
        (isNil(this.config.options.properties.messageExpiryInterval) || (this.config.options.properties.messageExpiryInterval >= 0 && this.config.options.properties.messageExpiryInterval <= 0xffffffff)) &&
        (isNil(this.config.options.properties.topicAlias) || (this.config.options.properties.topicAlias > 0 && this.config.options.properties.topicAlias <= 0xffff))
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
    }
  },
  watch: {
    config: {
      deep: true,
      handler (val) {
        this.$emit('input', val)
      }
    },
    value: {
      deep: true,
      handler (value) {
        this.config = value
      }
    }
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
    .publisher__remove
      position absolute
      top 5px
      right 5px
    .publisher__main
      position relative
      height calc(100% - 50px)
      overflow auto
</style>
