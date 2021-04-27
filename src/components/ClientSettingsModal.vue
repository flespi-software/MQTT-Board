<template>
  <q-dialog
    content-class="mqtt-board__popup"
    v-model="model"
    :maximized="$q.platform.is.mobile"
    no-backdrop-dismiss no-esc-dismiss
  >
    <q-card :style="{minWidth: $q.platform.is.mobile ? '100%' : '50vw'}">
      <q-card-section :class="{[`bg-${color}`]: true, 'text-white': !!color}" class="q-pa-none">
        <q-toolbar :class="{[`bg-${color}`]: true, 'text-white': !!color}">
          <q-btn flat dense v-close-popup icon="keyboard_arrow_left" @click="close"/>
          <q-toolbar-title>
            Connection settings
          </q-toolbar-title>
        </q-toolbar>
      </q-card-section>
      <q-separator />
      <q-card-section class="scroll" :style="{ height: $q.platform.is.mobile ? 'calc(100% - 94px)' : '50vh'}">
        <div>
          <q-input color="grey-9" outlined no-error-icon v-model="currentSettings.clientName" label="Client name" class="q-mb-xs">
            <q-icon slot="after" name="mdi-information-outline"><q-tooltip>{{getDescription('clientName')}}</q-tooltip></q-icon>
          </q-input>
          <q-input color="grey-9" outlined no-error-icon v-model="currentSettings.clientId" label="Client ID" :error="validateSetting('clientId')" :error-message="getValidateMessage('clientId')" hide-bottom-space class="q-mb-xs">
            <q-btn slot="append" color="grey-9" icon="mdi-refresh" @click="currentSettings.clientId = `mqtt-board-${Math.random().toString(16).substr(2, 8)}`" flat round/>
            <q-icon slot="after" name="mdi-information-outline"><q-tooltip>{{getDescription('clientId')}}</q-tooltip></q-icon>
          </q-input>
          <q-input color="grey-9" no-error-icon outlined v-model="currentSettings.host" label="Host" :error="validateSetting('host')" :error-message="getValidateMessage('host')" hide-bottom-space class="q-mb-xs">
            <q-icon slot="after" name="mdi-information-outline"><q-tooltip>{{getDescription('host')}}</q-tooltip></q-icon>
          </q-input>
          <q-input color="grey-9" no-error-icon outlined class="q-mb-xs" hide-bottom-space v-model.number="currentSettings.keepalive" type="number" label="Keep alive" :error="validateSetting('keepalive')" :error-message="getValidateMessage('keepalive')">
            <q-icon slot="after" name="mdi-information-outline"><q-tooltip max-width="200px">{{getDescription('keepalive')}}</q-tooltip></q-icon>
          </q-input>
          <q-select color="grey-9" outlined popup-content-class="mqtt-board__popup" class="q-mb-xs" v-model="currentSettings.protocolVersion" map-options emit-value :options="[{label: '3.1.1', value: 4}, {label: '5.0', value: 5}]" label="Version of MQTT" hide-bottom-space options-selected-class="bg-grey-2 text-grey-9">
            <q-icon slot="after" name="mdi-information-outline"><q-tooltip>{{getDescription('protocolVersion')}}</q-tooltip></q-icon>
          </q-select>
          <div>
            <q-checkbox color="grey-9" class="q-my-sm" style="width: calc(100% - 36px)" v-model="currentSettings.clean" :label="currentSettings.protocolVersion === 5 ? 'Clean start' : 'Clean session'"/>
            <q-icon size="24px" color="grey-7" style="margin-left: 12px" slot="after" name="mdi-information-outline"><q-tooltip>{{getDescription('clean')}}</q-tooltip></q-icon>
          </div>
          <q-input color="grey-9" outlined class="q-mb-xs" hide-bottom-space v-model="currentSettings.username" label="Username">
            <q-btn slot="append" color="grey-9" icon="mdi-login" @click="flespiLoginHandler" flat round v-if="currentSettings.host.indexOf('flespi') !== -1">
              <q-tooltip>Get flespi token</q-tooltip>
            </q-btn>
            <q-icon slot="after" name="mdi-information-outline"><q-tooltip>{{getDescription('username')}}</q-tooltip></q-icon>
          </q-input>
          <q-input color="grey-9" outlined class="q-mb-xs" hide-bottom-space v-model="currentSettings.password" label="Password">
            <q-icon slot="after" name="mdi-information-outline"><q-tooltip>{{getDescription('password')}}</q-tooltip></q-icon>
          </q-input>
          <q-expansion-item class="q-mt-sm q-mb-sm bg-grey-2" label="Properties" v-if="currentSettings.protocolVersion === 5">
            <div class="q-px-md q-py-sm">
              <q-input
                color="grey-9" outlined class="q-mb-xs" hide-bottom-space type="number" :min="0"
                v-model.number="currentSettings.properties.sessionExpiryInterval"
                @input="(val) => { if (!val) { currentSettings.properties.sessionExpiryInterval = undefined } }"
                label="Session expiry interval"
                :error="validateSetting('properties.sessionExpiryInterval')"
                :error-message="getValidateMessage('properties.sessionExpiryInterval')"
                no-error-icon
              >
                <q-icon slot="after" name="mdi-information-outline"><q-tooltip>{{getDescription('properties.sessionExpiryInterval')}}</q-tooltip></q-icon>
              </q-input>
              <q-input
                color="grey-9" type="number" label="Receive maximum" outlined class="q-mb-xs" hide-bottom-space
                v-model.number="currentSettings.properties.receiveMaximum"
                @input="(val) => { if (!val) { currentSettings.properties.receiveMaximum = undefined } }"
                :error="validateSetting('properties.receiveMaximum')"
                :error-message="getValidateMessage('properties.receiveMaximum')"
                no-error-icon
              >
                <q-icon slot="after" name="mdi-information-outline"><q-tooltip>{{getDescription('properties.receiveMaximum')}}</q-tooltip></q-icon>
              </q-input>
              <q-input
                color="grey-9" type="number" label="Maximum packet size" outlined class="q-mb-xs" hide-bottom-space
                v-model.number="currentSettings.properties.maximumPacketSize"
                @input="(val) => { if (!val) { currentSettings.properties.maximumPacketSize = undefined } }"
                :error="validateSetting('properties.maximumPacketSize')"
                :error-message="getValidateMessage('properties.maximumPacketSize')"
                no-error-icon
              >
                <q-icon slot="after" name="mdi-information-outline"><q-tooltip>{{getDescription('properties.maximumPacketSize')}}</q-tooltip></q-icon>
              </q-input>
              <q-input
                color="grey-9" type="number" label="Topic alias maximum" outlined class="q-mb-xs" hide-bottom-space
                v-model.number="currentSettings.properties.topicAliasMaximum"
                @input="(val) => { if (!val) { currentSettings.properties.topicAliasMaximum = undefined } }"
                :error="validateSetting('properties.topicAliasMaximum')"
                :error-message="getValidateMessage('properties.topicAliasMaximum')"
                no-error-icon
              >
                <q-icon slot="after" name="mdi-information-outline"><q-tooltip>{{getDescription('properties.topicAliasMaximum')}}</q-tooltip></q-icon>
              </q-input>
              <div>
                <q-checkbox style="width: calc(100% - 36px)" color="grey-9" v-model="currentSettings.properties.requestResponseInformation" label="Request-Response information"/>
                <q-icon size="24px" color="grey-7" style="margin-left: 12px" slot="after" name="mdi-information-outline"><q-tooltip>{{getDescription('properties.requestResponseInformation')}}</q-tooltip></q-icon>
              </div>
              <div>
                <q-checkbox style="width: calc(100% - 36px)" color="grey-9" v-model="currentSettings.properties.requestProblemInformation" label="Request problem information"/>
                <q-icon size="24px" color="grey-7" style="margin-left: 12px" slot="after" name="mdi-information-outline"><q-tooltip  max-width="200px">{{getDescription('properties.requestProblemInformation')}}</q-tooltip></q-icon>
              </div>
              <div class="q-mb-sm">
                <div class="q-mt-md q-mb-sm">
                  <div style="width: calc(100% - 36px);display:inline-flex;">User Properties</div>
                  <q-icon size="24px" color="grey-7" style="margin-left: 12px" slot="after" name="mdi-information-outline">
                    <q-tooltip>{{getDescription('properties.userProperties')}}</q-tooltip>
                  </q-icon>
                </div>
                <div>
                  <q-list v-if="currentSettings.properties.userProperties" bordered class="q-mb-xs">
                    <q-item v-for="(value, name) in currentSettings.properties.userProperties" :key="`${name}: ${value}`" style="min-height: 17px;">
                      <q-icon class="q-mr-sm cursor-pointer" size='1.2rem' @click.native="removeConnectUserProperty(name)" name="mdi-close-circle"/>
                      <span>{{`${name}: ${value}`}}</span>
                    </q-item>
                  </q-list>
                  <q-input color="grey-9" v-model="connectUserProperty.name" label="User property name" outlined class="q-mb-xs" hide-bottom-space/>
                  <q-input color="grey-9" v-model="connectUserProperty.value" label="User property value" outlined class="q-mb-xs" hide-bottom-space/>
                  <q-btn style="width: 100%" class="q-mt-sm" color="grey-9" @click="addUserProperty">Add</q-btn>
                </div>
              </div>
              <q-input color="grey-9" v-model="currentSettings.properties.authenticationMethod" label="Authentication method" outlined class="q-mb-xs" hide-bottom-space>
                <q-icon slot="after" name="mdi-information-outline"><q-tooltip>{{getDescription('properties.authenticationMethod')}}</q-tooltip></q-icon>
              </q-input>
              <q-input color="grey-9" v-model="currentSettings.properties.authenticationData" type="textarea" label="Authentication data" outlined class="q-mb-xs q-textarea--fix" hide-bottom-space autogrow>
                <q-icon slot="after" name="mdi-information-outline"><q-tooltip>{{getDescription('properties.authenticationData')}}</q-tooltip></q-icon>
              </q-input>
            </div>
          </q-expansion-item>
          <q-expansion-item class="q-mt-sm q-mb-sm bg-grey-2" label="Will">
            <div class="q-px-md q-pb-sm">
              <q-input color="grey-9" no-error-icon v-model="currentSettings.will.topic" :error="validateSetting('will.topic')" :error-message="getValidateMessage('will.topic')" label="Will topic" outlined class="q-mb-xs" hide-bottom-space>
                <q-icon slot="after" name="mdi-information-outline"><q-tooltip>{{getDescription('will.topic')}}</q-tooltip></q-icon>
              </q-input>
              <q-input color="grey-9" no-error-icon v-model="currentSettings.will.payload" :error="validateSetting('will.payload')" :error-message="getValidateMessage('will.payload')" type="textarea" label="Will payload" outlined class="q-mb-xs q-textarea--fix" hide-bottom-space autogrow>
                <q-icon slot="after" name="mdi-information-outline"><q-tooltip>{{getDescription('will.payload')}}</q-tooltip></q-icon>
              </q-input>
              <div class="q-ml-xs" style="line-height: 48px;">
                <div style="width: calc(100% - 36px);display:inline-flex;">
                  QoS
                  <q-btn-toggle flat rounded toggle-text-color="grey-9" text-color="grey-6" class="q-ml-sm" v-model="currentSettings.will.qos" :options="[{label: '0', value: 0},{label: '1', value: 1},{label: '2', value: 2}]"/>
                </div>
                <q-icon size="24px" color="grey-7" style="margin-left: 12px" slot="after" name="mdi-information-outline"><q-tooltip>{{getDescription('will.qos')}}</q-tooltip></q-icon>
              </div>
              <div>
                <q-checkbox style="width: calc(100% - 36px)" color="grey-9" v-model="currentSettings.will.retain" label="Will retain" />
                <q-icon size="24px" color="grey-7" style="margin-left: 12px" slot="after" name="mdi-information-outline"><q-tooltip>{{getDescription('will.retain')}}</q-tooltip></q-icon>
              </div>
              <q-expansion-item class="bg-grey-4" label="Will properties" v-if="currentSettings.protocolVersion === 5">
                <div class="q-px-md q-py-sm">
                  <q-input
                    color="grey-9" outlined class="q-mb-xs" hide-bottom-space type="number" label="Will delay interval"
                    v-model.number="currentSettings.will.properties.willDelayInterval"
                    @input="(val) => { if (!val) { currentSettings.will.properties.willDelayInterval = undefined } }"
                    :error="validateSetting('will.properties.willDelayInterval')"
                    :error-message="getValidateMessage('will.properties.willDelayInterval')"
                    no-error-icon
                  >
                    <q-icon slot="after" name="mdi-information-outline"><q-tooltip>{{getDescription('will.properties.willDelayInterval')}}</q-tooltip></q-icon>
                  </q-input>
                  <div>
                    <q-checkbox style="width: calc(100% - 36px)" color="grey-9" class="q-mt-sm q-mb-sm" v-model="currentSettings.will.properties.payloadFormatIndicator" label="Payload format indicator"/>
                    <q-icon size="24px" color="grey-7" style="margin-left: 12px" slot="after" name="mdi-information-outline"><q-tooltip>{{getDescription('will.properties.payloadFormatIndicator')}}</q-tooltip></q-icon>
                  </div>
                  <q-input
                    color="grey-9" type="number" label="Message expiry interval" outlined class="q-mb-xs" hide-bottom-space
                    v-model.number="currentSettings.will.properties.messageExpiryInterval"
                    @input="(val) => { if (!val) { currentSettings.will.properties.messageExpiryInterval = undefined } }"
                    :error="validateSetting('will.properties.messageExpiryInterval')"
                    :error-message="getValidateMessage('will.properties.messageExpiryInterval')"
                    no-error-icon
                  >
                    <q-icon slot="after" name="mdi-information-outline"><q-tooltip>{{getDescription('will.properties.messageExpiryInterval')}}</q-tooltip></q-icon>
                  </q-input>
                  <q-input color="grey-9" v-model="currentSettings.will.properties.contentType" label="Content type" outlined class="q-mb-xs" hide-bottom-space>
                    <q-icon slot="after" name="mdi-information-outline"><q-tooltip>{{getDescription('will.properties.contentType')}}</q-tooltip></q-icon>
                  </q-input>
                  <q-input color="grey-9" v-model="currentSettings.will.properties.responseTopic" label="Response topic" outlined class="q-mb-xs" hide-bottom-space>
                    <q-icon slot="after" name="mdi-information-outline"><q-tooltip>{{getDescription('will.properties.responseTopic')}}</q-tooltip></q-icon>
                  </q-input>
                  <q-input color="grey-9" v-model="currentSettings.will.properties.correlationData" type="textarea" label="Correlation data" outlined class="q-mb-xs q-textarea--fix" hide-bottom-space autogrow>
                    <q-icon slot="after" name="mdi-information-outline"><q-tooltip max-width="200px">{{getDescription('will.properties.correlationData')}}</q-tooltip></q-icon>
                  </q-input>
                  <div>
                    <div class="q-mt-md q-mb-sm">
                      <div style="width: calc(100% - 36px);display:inline-flex;">Will user properties</div>
                      <q-icon size="24px" color="grey-7" style="margin-left: 12px" slot="after" name="mdi-information-outline">
                        <q-tooltip>{{getDescription('will.properties.userProperties')}}</q-tooltip>
                      </q-icon>
                    </div>
                    <div>
                      <q-list style="border-color: #b7b7b7;" v-if="currentSettings.will.properties.userProperties" class="q-mb-xs">
                        <q-item v-for="(value, name) in currentSettings.will.properties.userProperties" :key="`${name}: ${value}`" style="min-height: 17px;">
                          <q-icon class="q-mr-sm cursor-pointer" size='1.2rem' @click.native="removeWillConnectUserProperty(name)" name="mdi-close-circle"/>
                          <span>{{`${name}: ${value}`}}</span>
                        </q-item>
                      </q-list>
                      <q-input color="grey-9" v-model="willConnectUserProperty.name" label="Will user property name" outlined class="q-mb-xs" hide-bottom-space/>
                      <q-input color="grey-9" v-model="willConnectUserProperty.value"  label="Will user property value" outlined class="q-mb-xs" hide-bottom-space/>
                      <q-btn style="width: 100%" class="q-mt-sm" color="grey-9" @click="addWillUserProperty">Add</q-btn>
                    </div>
                  </div>
                </div>
              </q-expansion-item>
            </div>
          </q-expansion-item>
        </div>
      </q-card-section>
      <q-separator />
      <q-card-actions align="right" :class="{[`bg-${color}`]: true, 'text-white': !!color}">
        <q-btn flat dense v-close-popup class="q-mr-sm" @click="close">Close</q-btn>
        <q-btn flat dense :disable="!isCurrentSettingsValid" @click="save">Save</q-btn>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script>
import { defaultSettings } from '../mixins/defaults.js'
import { settings as declarations } from '../mixins/declarations.js'
import validateEntities from '../mixins/validateEntities.js'
import get from 'lodash/get'
import cloneDeep from 'lodash/cloneDeep'
import merge from 'lodash/merge'
import isNil from 'lodash/isNil'
export default {
  props: {
    initSettings: {
      type: Object,
      default () { return {} }
    },
    settings: {
      type: Object,
      default () { return {} }
    },
    color: String,
    secure: Boolean
  },
  mixins: [validateEntities],
  data () {
    return {
      model: true,
      declarations,
      currentSettings: cloneDeep(merge({}, defaultSettings, this.initSettings, this.settings)),
      connectUserProperty: {
        value: '',
        name: ''
      },
      willConnectUserProperty: {
        value: '',
        name: ''
      }
    }
  },
  computed: {
    validationModel () {
      return this.validateSettings(this.currentSettings, true)
    },
    isCurrentSettingsValid () {
      return !Object.keys(this.validationModel).length
    }
  },
  methods: {
    isNil,
    close () { this.$emit('close') },
    save () {
      this.$emit('save', this.currentSettings)
      this.close()
    },
    addUserProperty () {
      if (!this.currentSettings.properties.userProperties) {
        this.currentSettings.properties.userProperties = {}
      }
      this.currentSettings.properties.userProperties[this.connectUserProperty.name] = this.connectUserProperty.value
      this.connectUserProperty = {
        value: '',
        name: ''
      }
    },
    addWillUserProperty () {
      if (!this.currentSettings.will.properties.userProperties) {
        this.currentSettings.will.properties.userProperties = {}
      }
      this.currentSettings.will.properties.userProperties[this.willConnectUserProperty.name] = this.willConnectUserProperty.value
      this.willConnectUserProperty = {
        value: '',
        name: ''
      }
    },
    removeConnectUserProperty (name) {
      this.$delete(this.currentSettings.properties.userProperties, name)
      if (!Object.keys(this.currentSettings.properties.userProperties).length) {
        this.currentSettings.properties.userProperties = null
      }
    },
    removeWillConnectUserProperty (name) {
      this.$delete(this.currentSettings.will.properties.userProperties, name)
      if (!Object.keys(this.currentSettings.will.properties.userProperties).length) {
        this.currentSettings.will.properties.userProperties = null
      }
    },
    openWindow (url, title) {
      title = title || 'auth'
      const w = 500, h = 600
      const dualScreenLeft = window.screenLeft !== undefined ? window.screenLeft : screen.left
      const dualScreenTop = window.screenTop !== undefined ? window.screenTop : screen.top

      const width = window.innerWidth ? window.innerWidth : document.documentElement.clientWidth ? document.documentElement.clientWidth : screen.width
      const height = window.innerHeight ? window.innerHeight : document.documentElement.clientHeight ? document.documentElement.clientHeight : screen.height

      const left = ((width / 2) - (w / 2)) + dualScreenLeft
      const top = ((height / 2) - (h / 2)) + dualScreenTop
      const newWindow = window.open(url, title, 'toolbar=no,location=no,status=yes,resizable=yes,scrollbars=yes, width=' + w + ', height=' + h + ', top=' + top + ', left=' + left)

      // Puts focus on the newWindow
      if (window.focus) {
        newWindow.focus()
      }
    },
    flespiLoginHandler () {
      const tokenHandler = (event) => {
        if (typeof event.data === 'string' && ~event.data.indexOf('FlespiLogin|token:')) {
          let payload = event.data
          payload = payload.replace('FlespiLogin|token:', '')
          payload = JSON.parse(payload)
          this.currentSettings.username = payload.token
          this.currentSettings.host = `wss://${payload.region['mqtt-ws']}`
          window.removeEventListener('message', tokenHandler)
        }
      }
      window.addEventListener('message', tokenHandler)
      this.openWindow('https://flespi.io/login/#/providers')
    },
    validateSetting (path) {
      return !!get(this.validationModel, path, false)
    },
    getValidateMessage (path) {
      return get(this.validationModel, path, '')
    },
    getDescription (path) {
      return get(this.declarations, `${path}.desc`, '')
    }
  }
}
</script>
