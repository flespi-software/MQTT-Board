<template>
  <div class="mqtt-client__publisher col-md-6 col-sm-12 col-xs-12">
    <q-card class="publisher__item q-ma-sm">
      <q-card-title class="q-pa-none">
        <q-toolbar color="indigo" class="q-px-none">
          <q-toolbar-title>Publisher</q-toolbar-title>
          <q-btn round flat icon="mdi-send" @click="$emit('publish')">
            <q-tooltip>Publish</q-tooltip>
          </q-btn>
          <q-btn round flat icon="mdi-dots-vertical">
            <q-popover anchor="bottom right" self="top right">
              <q-list>
                <q-item class="cursor-pointer" highlight @click.native="$emit('remove')">
                  <q-item-side color="red" icon="mdi-delete-outline" />
                  <q-item-main label="Remove"/>
                </q-item>
              </q-list>
            </q-popover>
          </q-btn>
        </q-toolbar>
      </q-card-title>
      <q-card-main class="publisher__main q-pb-none">
        <div>
          <q-input color="dark" v-model="config.topic" float-label="Topic" :error="!config.topic"/>
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
            <q-collapsible v-if="version === 5" class="q-mt-sm q-mb-sm bg-grey-4" label="Properties">
              <q-checkbox color="dark" class="q-mt-sm q-mb-sm" v-model="config.options.properties.payloadFormatIndicator" label="Payload format indicator"/>
              <q-input color="dark" type="number" v-model="config.options.properties.messageExpiryInterval" float-label="Message expiry interval"/>
              <q-input color="dark" type="number" v-model="config.options.properties.topicAlias" float-label="Topic alias"/>
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
      </q-card-main>
    </q-card>
  </div>
</template>

<script>
import Vue from 'vue'

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
  methods: {
    addPublishUserProperty () {
      if (!this.config.options.properties.userProperties) {
        this.config.options.properties.userProperties = {}
      }
      this.config.options.properties.userProperties[this.publishUserProperty.name] = this.publishUserProperty.value
      this.publishUserProperty = {
        value: '',
        name: ''
      }
    },
    removePublishUserProperty (name) {
      Vue.delete(this.config.options.properties.userProperties, name)
      if (!Object.keys(this.config.options.properties.userProperties).length) {
        this.config.options.properties.userProperties = null
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
  }
}
</script>

<style lang="stylus">
  .mqtt-client__publisher
    .publisher__item
      border 2px solid #3f51b5
      height calc(100% - 32px)
      position relative
    .publisher__remove
      position absolute
      top 5px
      right 5px
    .publisher__main
      position relative
      height calc(100% - 54px)
      overflow auto
</style>
