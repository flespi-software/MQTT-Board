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
          <q-input color="grey-9" outlined v-model="currentSettings.clientName" label="Client name" class="q-mb-xs"/>
          <q-input color="grey-9" outlined v-model="currentSettings.clientId" label="Client ID" :error="!currentSettings.clientId" hide-bottom-space class="q-mb-xs">
            <q-btn slot="append" color="grey-9" icon="mdi-refresh" @click="currentSettings.clientId = `mqtt-board-${Math.random().toString(16).substr(2, 8)}`" flat round/>
          </q-input>
          <q-input color="grey-9" outlined v-model="currentSettings.host" label="Host" :error="!currentSettings.host || (secure && currentSettings.host.indexOf('ws:') === 0)" error-message="Host must be not empty and only over secured sockets" hide-bottom-space class="q-mb-xs"/>
          <q-input color="grey-9" outlined class="q-mb-xs" hide-bottom-space v-model.number="currentSettings.keepalive" type="number" label="Keep alive" :error="!isNil(currentSettings.keepalive) && (currentSettings.keepalive <= 0 || currentSettings.keepalive > 0xffff)"/>
          <q-select color="grey-9" outlined popup-content-class="mqtt-board__popup" class="q-mb-xs" v-model="currentSettings.protocolVersion" map-options emit-value :options="[{label: '3.1.1', value: 4}, {label: '5.0', value: 5}]" label="Version of MQTT" hide-bottom-space options-selected-class="bg-grey-2 text-grey-9"/>
          <q-checkbox color="grey-9" class="q-mt-sm q-mb-sm" v-model="currentSettings.clean" :label="currentSettings.protocolVersion === 5 ? 'Clean start' : 'Clean session'"/>
          <q-input color="grey-9" outlined class="q-mb-xs" hide-bottom-space v-model="currentSettings.username" label="Username">
            <q-btn slot="append" color="grey-9" icon="mdi-login" @click="flespiLoginHandler" flat round v-if="currentSettings.host.indexOf('flespi') !== -1"/>
          </q-input>
          <q-input color="grey-9" outlined class="q-mb-xs" hide-bottom-space v-model="currentSettings.password" label="Password"/>
          <q-expansion-item class="q-mt-sm q-mb-sm bg-grey-2" label="Properties" v-if="currentSettings.protocolVersion === 5">
            <div class="q-px-md q-py-sm">
              <q-input
                color="grey-9" outlined class="q-mb-xs" hide-bottom-space type="number" :min="0" clearable
                v-model.number="currentSettings.properties.sessionExpiryInterval"
                @clear="currentSettings.properties.sessionExpiryInterval = undefined"
                label="Session expiry interval"
                :error="!isNil(currentSettings.properties.sessionExpiryInterval) && (currentSettings.properties.sessionExpiryInterval < 0 || currentSettings.properties.sessionExpiryInterval > 0xffffffff)"
              />
              <q-input
                color="grey-9" type="number" label="Receive maximum" clearable outlined class="q-mb-xs" hide-bottom-space
                v-model.number="currentSettings.properties.receiveMaximum"
                @clear="currentSettings.properties.receiveMaximum = undefined"
                :error="!isNil(currentSettings.properties.receiveMaximum) && (currentSettings.properties.receiveMaximum <= 0 || currentSettings.properties.receiveMaximum > 0xffff)"
              />
              <q-input
                color="grey-9" type="number" label="Maximum packet size" clearable outlined class="q-mb-xs" hide-bottom-space
                v-model.number="currentSettings.properties.maximumPacketSize"
                @clear="currentSettings.properties.maximumPacketSize = undefined"
                :error="!isNil(currentSettings.properties.maximumPacketSize) && (currentSettings.properties.maximumPacketSize <= 0 || currentSettings.properties.maximumPacketSize > 0xffffffff)"
              />
              <q-input
                color="grey-9" type="number" label="Topic alias maximum" clearable outlined class="q-mb-xs" hide-bottom-space
                v-model.number="currentSettings.properties.topicAliasMaximum"
                :error="!isNil(currentSettings.properties.topicAliasMaximum) && (currentSettings.properties.topicAliasMaximum < 0 || currentSettings.properties.topicAliasMaximum > 0xffff)"
              />
              <q-checkbox style="display: flex;" color="grey-9" class="q-mt-sm q-mb-sm" v-model="currentSettings.properties.requestResponseInformation" label="Request-Response information"/>
              <q-checkbox style="display: flex;" color="grey-9" class="q-mt-sm q-mb-sm" v-model="currentSettings.properties.requestProblemInformation" label="Request problem information"/>
              <div class="q-mb-sm">
                <div class="q-mt-md">User Properties</div>
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
              <q-input color="grey-9" v-model="currentSettings.properties.authenticationMethod" label="Authentication method" outlined class="q-mb-xs" hide-bottom-space/>
              <q-input color="grey-9" v-model="currentSettings.properties.authenticationData" type="textarea" label="Authentication data" outlined class="q-mb-xs q-textarea--fix" hide-bottom-space autogrow/>
            </div>
          </q-expansion-item>
          <q-expansion-item class="q-mt-sm q-mb-sm bg-grey-2" label="Will">
            <div class="q-px-md q-py-sm">
              <q-input color="grey-9" v-model="currentSettings.will.topic" :error="!currentSettings.will.topic && !!currentSettings.will.payload" label="Will topic" outlined class="q-mb-xs" hide-bottom-space/>
              <q-input color="grey-9" v-model="currentSettings.will.payload" :error="!!currentSettings.will.topic && !currentSettings.will.payload" type="textarea" label="Will payload" outlined class="q-mb-xs q-textarea--fix" hide-bottom-space autogrow/>
              <div class="q-my-sm">
                QoS
                <q-btn-toggle flat rounded toggle-text-color="grey-9" text-color="grey-6" class="q-ml-sm" v-model="currentSettings.will.qos" :options="[{label: '0', value: 0},{label: '1', value: 1},{label: '2', value: 2}]"/>
              </div>
              <q-checkbox color="grey-9" class="q-mt-sm q-mb-sm" v-model="currentSettings.will.retain" label="Will retain" />
              <q-expansion-item class="bg-grey-4" label="Will properties" v-if="currentSettings.protocolVersion === 5">
                <div class="q-px-md q-py-sm">
                  <q-input
                    color="grey-9" outlined clearable class="q-mb-xs" hide-bottom-space type="number" label="Will delay interval"
                    v-model.number="currentSettings.will.properties.willDelayInterval"
                    @clear="currentSettings.will.properties.willDelayInterval = undefined"
                  />
                  <q-checkbox color="grey-9" class="q-mt-sm q-mb-sm" v-model="currentSettings.will.properties.payloadFormatIndicator" label="Payload format indicator"/>
                  <q-input
                    color="grey-9" type="number" label="Message expiry interval" clearable outlined class="q-mb-xs" hide-bottom-space
                    v-model.number="currentSettings.will.properties.messageExpiryInterval"
                    @clear="currentSettings.will.properties.messageExpiryInterval = undefined"
                  />
                  <q-input color="grey-9" v-model="currentSettings.will.properties.contentType" label="Content type" outlined class="q-mb-xs" hide-bottom-space/>
                  <q-input color="grey-9" v-model="currentSettings.will.properties.responseTopic" label="Response topic" outlined class="q-mb-xs" hide-bottom-space/>
                  <q-input color="grey-9" v-model="currentSettings.will.properties.correlationData" type="textarea" label="Correlation data" outlined class="q-mb-xs q-textarea--fix" hide-bottom-space autogrow />
                  <div>
                    <div class="q-mt-md">Will user properties</div>
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
import validateEntities from '../mixins/validateEntities.js'
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
    isCurrentSettingsValid () {
      const settings = this.currentSettings
      return this.validateSettings(this.currentSettings) && !(!!this.secure && settings.host.indexOf('ws:') === 0)
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
    }
  }
}
</script>
