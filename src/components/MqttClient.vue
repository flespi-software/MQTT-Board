<template>
  <div style="position: absolute; bottom: 0; right: 0; top: 0; left: 0;">
    <flespi-topic ref="felspiModal" @topic="(topic) => { addSubscriber(); subscribers[subscribers.length - 1].topic = topic }"/>
    <q-modal @show="showSettingsModalHandler" v-model='settingsModalModel'>
      <q-modal-layout>
         <q-toolbar slot="header" color='dark'>
          <q-btn flat dense v-close-overlay icon="keyboard_arrow_left" @click="revertSettings"/>
          <q-toolbar-title>
            Connection settings
          </q-toolbar-title>
        </q-toolbar>
        <div style="margin: 20px;" :style="{ height: $q.platform.is.mobile ? 'calc(100% - 100px)' : '50vh', width: $q.platform.is.mobile ? 'calc(100% - 40px)' : '50vw'}">
          <q-input color="dark"  v-model="currentSettings.clientId" float-label="Client ID" :error="!currentSettings.clientId" :after="[{icon: 'mdi-refresh', handler () { currentSettings.clientId = `mqtt-board-${Math.random().toString(16).substr(2, 8)}` }}]"/>
          <q-input color="dark"  v-model="currentSettings.host" float-label="Host" :error="!currentSettings.host || (secure && currentSettings.host.indexOf('ws:') === 0)" :after="[{icon: 'mdi-alert-outline', handler: hostErrorHandler, error: true}]"/>
          <q-input color="dark"  v-model="currentSettings.keepalive" type="number" float-label="Keep alive"/>
          <q-select color="dark" v-model="currentSettings.protocolVersion" :options="[{label: '3.1.1', value: 4}, {label: '5.0', value: 5}]" float-label="Version of MQTT"/>
          <q-checkbox color="dark" class="q-mt-sm q-mb-sm" v-model="currentSettings.clean" :label="currentSettings.protocolVersion === 5 ? 'Clean start' : 'Clean session'"/>
          <q-input color="dark" v-model="currentSettings.username" float-label="Username"/>
          <q-input color="dark" v-model="currentSettings.password" float-label="Password"/>
          <q-collapsible class="q-mt-sm q-mb-sm bg-grey-2" label="Properties" v-if="currentSettings.protocolVersion === 5">
            <div>
              <q-input color="dark" v-model="currentSettings.properties.sessionExpiryInterval" type="number" float-label="Session expiry interval"/>
              <q-input color="dark" v-model="currentSettings.properties.receiveMaximum" type="number" float-label="Receive maximum"/>
              <q-input color="dark" v-model="currentSettings.properties.maximumPacketSize" type="number" float-label="Maximum packet size"/>
              <q-input color="dark" v-model="currentSettings.properties.topicAliasMaximum" type="number" float-label="Topic alias maximum"/>
              <q-checkbox style="display: flex;" color="dark" class="q-mt-sm q-mb-sm" v-model="currentSettings.properties.requestResponseInformation" label="Request-Response information"/>
              <q-checkbox style="display: flex;" color="dark" class="q-mt-sm q-mb-sm" v-model="currentSettings.properties.requestProblemInformation" label="Request problem information"/>
              <div>
                <div class="q-mt-md">User Properties</div>
                <div>
                  <q-list v-if="currentSettings.properties.userProperties">
                    <q-item v-for="(value, name) in currentSettings.properties.userProperties" :key="`${name}: ${value}`">
                      <q-icon class="q-mr-sm cursor-pointer" size='1rem' @click.native="removeConnectUserProperty(name)" name="mdi-close-circle"/>
                      <span>{{`${name}: ${value}`}}</span>
                    </q-item>
                  </q-list>
                  <q-input color="dark" v-model="connectUserProperty.name" float-label="User property name"/>
                  <q-input color="dark" v-model="connectUserProperty.value" float-label="User property value"/>
                  <q-btn style="width: 100%" class="q-mt-sm" color="dark" @click="addUserProperty">Add</q-btn>
                </div>
              </div>
              <q-input color="dark" v-model="currentSettings.properties.authenticationMethod" float-label="Authentication method"/>
              <q-input color="dark" v-model="currentSettings.properties.authenticationData" type="textarea" float-label="Authentication data"/>
            </div>
          </q-collapsible>
          <q-collapsible class="q-mt-sm q-mb-sm bg-grey-2" label="Will">
            <div>
              <q-input color="dark" v-model="currentSettings.will.topic" :error="!this.currentSettings.will.topic && !!this.currentSettings.will.payload" float-label="Will topic"/>
              <q-input color="dark" v-model="currentSettings.will.payload" :error="!!this.currentSettings.will.topic && !this.currentSettings.will.payload" type="textarea" float-label="Will payload"/>
              <div class="q-my-sm">
                QoS
                <q-btn-toggle flat rounded toggle-text-color="dark" text-color="grey-6" class="q-ml-sm" v-model="currentSettings.will.qos" :options="[{label: '0', value: 0},{label: '1', value: 1},{label: '2', value: 2}]"/>
              </div>
              <q-checkbox color="dark" class="q-mt-sm q-mb-sm" v-model="currentSettings.will.retain" label="Will retain"/>
              <q-collapsible class="bg-grey-4" label="Will properties" v-if="currentSettings.protocolVersion === 5">
                <q-input color="dark" v-model="currentSettings.will.properties.willDelayInterval" type="number" float-label="Will delay interval"/>
                <q-checkbox color="dark" class="q-mt-sm q-mb-sm" v-model="currentSettings.will.properties.payloadFormatIndicator" label="Payload format indicator"/>
                <q-input color="dark" v-model="currentSettings.will.properties.messageExpiryInterval" type="number" float-label="Message expiry interval"/>
                <q-input color="dark" v-model="currentSettings.will.properties.contentType" float-label="Content type"/>
                <q-input color="dark" v-model="currentSettings.will.properties.responseTopic" float-label="Response topic"/>
                <q-input color="dark" v-model="currentSettings.will.properties.correlationData" type="textarea" float-label="Correlation data"/>
                <div>
                  <div class="q-mt-md">Will user properties</div>
                  <div>
                    <q-list style="border-color: #b7b7b7;" v-if="currentSettings.will.properties.userProperties">
                      <q-item v-for="(value, name) in currentSettings.will.properties.userProperties" :key="`${name}: ${value}`">
                        <q-icon class="q-mr-sm cursor-pointer" size='1rem' @click.native="removeWillConnectUserProperty(name)" name="mdi-close-circle"/>
                        <span>{{`${name}: ${value}`}}</span>
                      </q-item>
                    </q-list>
                    <q-input color="dark" v-model="willConnectUserProperty.name" float-label="Will user property name"/>
                    <q-input color="dark" v-model="willConnectUserProperty.value"  float-label="Will user property value"/>
                    <q-btn style="width: 100%" class="q-mt-sm" color="dark" @click="addWillUserProperty">Add</q-btn>
                  </div>
                </div>
              </q-collapsible>
            </div>
          </q-collapsible>
        </div>
        <q-toolbar slot="footer" color='dark'>
          <q-toolbar-title>
          </q-toolbar-title>
          <q-btn flat dense v-close-overlay class="q-mr-sm" @click="revertSettings">Close</q-btn>
          <q-btn flat dense v-close-overlay :disable="!validateCurrentSettings" @click="saveSettingsHandler">Save</q-btn>
        </q-toolbar>
      </q-modal-layout>
    </q-modal>
    <q-btn fab v-if="!activeClient" @click.native="addClientHandler" icon="mdi-plus" class="absolute" color="light-blue-7" style="right: 16px; top: 21px; z-index: 1;"/>
    <q-toolbar color="dark">
      <q-btn round v-if="activeClient" flat dense icon="mdi-close" @click="clearActiveClient"/>
      <q-toolbar-title>
        <img v-if="!activeClient && whiteLabel === ''" src="statics/mqttboard.png" alt="MQTT Board" style="height: 30px">
        {{activeClient ? `${activeClient.config.clientId}` : (whiteLabel || 'MQTT Board')}}
        <sup v-if="!activeClient && whiteLabel === ''" style="position: relative; font-size: .9rem; padding-left: 4px">{{version}}</sup>
      </q-toolbar-title>
      <q-btn round flat v-if="activeClient" icon="mdi-settings" @click.stop="editClientHandler(activeClient.id)"/>
      <q-btn round flat v-if="activeClient && !entities.filter(entity => entity.type === 'logs').length" icon="mdi-script" @click="showLogs"/>
      <q-btn round flat v-if="activeClient" icon="mdi-plus">
        <q-popover anchor="bottom right" self="top right">
          <q-list>
            <q-list-header>Add pane</q-list-header>
            <q-item class="cursor-pointer" highlight @click.native="addPublisher">
              <q-item-side icon="mdi-publish" />
              <q-item-main label="Publisher">
                <q-tooltip>Add new publisher</q-tooltip>
              </q-item-main>
            </q-item>
            <q-item class="cursor-pointer" highlight @click.native="addSubscriber">
              <q-item-side icon="mdi-arrow-down-bold" />
              <q-item-main label="Subscriber">
                <q-tooltip>Add new subscriber</q-tooltip>
              </q-item-main>
            </q-item>
            <q-item v-if="activeClient && activeClient.config.host.indexOf('flespi') !== -1" class="cursor-pointer" highlight @click.native="$refs.felspiModal.open()">
              <q-item-side icon="mdi-star-outline" />
              <q-item-main label="Flespi subscriber">
                <q-tooltip>Add new flespi subscriber</q-tooltip>
              </q-item-main>
            </q-item>
          </q-list>
        </q-popover>
      </q-btn>
    </q-toolbar>
    <div v-if="!activeClient" style="overflow: hidden; height: calc(100% - 50px)">
      <div v-if="clients.length" class="mqtt-clients row q-pt-md scroll" style="height: 100%">
        <div class="client__item q-pt-md q-px-md cursor-pointer col-xl-3 col-md-4 col-sm-6 col-xs-12" v-for="(client, index) in clients" :key="index">
          <q-card :class="{'bg-red-2': !statuses[index], 'bg-green-2': statuses[index]}" @click.native="setActiveClient(index)">
            <q-card-title>
              <div class="ellipsis">{{client.config.clientId}}</div>
              <q-tooltip>{{client.config.clientId}}</q-tooltip>
            </q-card-title>
            <q-card-main class="ellipsis">
              <span>
                {{client.config.host}}
                <q-tooltip>{{client.config.host}}</q-tooltip>
              </span>
              </q-card-main>
            <q-card-separator />
            <q-card-actions align="end">
              <q-btn round flat v-if="statuses[index]" icon="mdi-stop" @click.stop="disconnectClientHandler(index)">
                <q-tooltip>Deactivate client</q-tooltip>
              </q-btn>
              <q-btn round flat v-else icon="mdi-play" @click.stop="connectClientHandler(index)">
                <q-tooltip>Activate client</q-tooltip>
              </q-btn>
              <q-btn round flat icon="mdi-settings" @click.stop="editClientHandler(index)"/>
              <q-btn round flat icon="mdi-delete" @click.stop="deleteClientHandler(index)"/>
            </q-card-actions>
          </q-card>
        </div>
      </div>
      <div v-else class="text-center q-mt-lg text-dark text-weight-bold" style="font-size: 2.5rem;">
        <div>No clients</div>
        <q-btn v-if="!activeClient" @click.native="addClientHandler">Create client</q-btn>
      </div>
    </div>
    <div ref="wrapper" v-touch-swipe.horizontal.noMouse="swipeHandler" class="no-wrap row" style="height: calc(100% - 50px); width: 100%; overflow: auto;" v-else>
      <template v-for="(entity, index) in entities">
        <publisher
          :class='[`col-xl-${entities.length < 4 ? 12 / entities.length : 3}`]'
          v-if="statuses[activeClient.id] && entity.type === 'publisher'"
          :key="`publ${index}`"
          :value="publishers[entity.index]"
          @input="(val) => { inputPublisher(entity.index, val) }"
          :version="activeClient.config.protocolVersion"
          @remove="removePublisher(entity.index)"
          @publish="publishMessageHandler(activeClient.id, entity.index)"
        />
        <subscriber
          :class='[`col-xl-${entities.length < 4 ? 12 / entities.length : 3}`]'
          v-else-if="statuses[activeClient.id] && entity.type === 'subscriber'"
          :key="`subs${index}`"
          :value="subscribers[entity.index]"
          @input="(val) => { inputSubscriber(entity.index, val) }"
          :status="subscribersStatuses[entity.index]"
          :messages="subscribersMessages[entity.index]"
          :version="activeClient.config.protocolVersion"
          @remove="removeSubscriber(entity.index)"
          @subscribe="subscribeMessageHandler(activeClient.id, entity.index)"
          @unsubscribe="unsubscribeMessageHandler(activeClient.id, entity.index)"
          @play="playSubscriberHandler(entity.index)"
          @pause="pauseSubscriberHandler(entity.index)"
          @clear="clearMessagesHandler(entity.index)"
        />
        <unresolved
          :class='[`col-xl-${entities.length < 4 ? 12 / entities.length : 3}`]'
          v-else-if="statuses[activeClient.id] && notResolvedMessages.length && entity.type === 'unresolved'"
          :key="`unresolved${index}`"
          :messages="notResolvedMessages"
        />
        <logs
          :class='[`col-xl-${entities.length < 4 ? 12 / entities.length : 3}`]'
          v-else-if="entity.type === 'logs'"
          :key="`subs${index}`"
          :logs="activeClient.logs"
          @hide="hideLogs"
        />
      </template>
    </div>
  </div>
</template>

<style lang="stylus">
  .client__item:last-child
    margin-bottom 88px

</style>

<script>
import mqtt from '../plugins/async-mqtt.js'
import VirtualList from 'vue-virtual-scroll-list'
import merge from 'lodash/merge'
import cloneDeep from 'lodash/cloneDeep'
import debounce from 'lodash/debounce'
import { animate, LocalStorage } from 'quasar'
import Vue from 'vue'
import FlespiTopic from './FlespiTopicConfigurator'
import Subscriber from './Subscriber'
import Publisher from './Publisher'
import Unresolved from './Unresolved'
import Logs from './Logs'
import { version } from '../../package.json'

let saveClientsToLocalStorage = debounce((clients) => {
  LocalStorage.set('clients', clients.map(client => ({
    config: client.config,
    publishers: client.publishers,
    subscribers: client.subscribers,
    entities: client.entities.filter(entity => entity.type !== 'unresolved')
  })))
}, 500, { trailing: true })

const
  defaultSettings = {
    clientId: `mqtt-board-${Math.random().toString(16).substr(2, 8)}`,
    host: 'wss://mqtt.flespi.io',
    keepalive: 60,
    protocolVersion: 5,
    clean: true,
    username: 'FlespiToken XXXXXXXXXXXXXXXXXXX',
    password: '',
    properties: {
      sessionExpiryInterval: undefined,
      receiveMaximum: undefined,
      maximumPacketSize: undefined,
      topicAliasMaximum: undefined,
      requestResponseInformation: false,
      requestProblemInformation: false,
      userProperties: undefined,
      authenticationMethod: undefined,
      authenticationData: undefined
    },
    will: {
      topic: undefined,
      payload: undefined,
      qos: 0,
      retain: false,
      properties: {
        willDelayInterval: undefined,
        payloadFormatIndicator: false,
        messageExpiryInterval: undefined,
        contentType: undefined,
        responseTopic: undefined,
        correlationData: undefined,
        userProperties: undefined
      }
    }
  },
  defaultSubscriber = {
    topic: '#',
    mode: 0,
    options: {
      qos: 0,
      nl: false,
      rap: false,
      rh: 0,
      properties: {
        subscriptionIdentifier: undefined,
        userProperties: undefined
      }
    }
  },
  defaultPublisher = {
    topic: 'my/topic',
    payload: '{"hello": "world"}',
    options: {
      qos: 0,
      retain: false,
      dup: false,
      properties: {
        payloadFormatIndicator: undefined,
        messageExpiryInterval: undefined,
        topicAlias: undefined,
        responseTopic: undefined,
        correlationData: undefined,
        userProperties: undefined,
        contentType: undefined
      }
    }
  }

export default {
  name: 'MqttClient',
  props: {
    initSettings: {
      type: Object
    },
    whiteLabel: {
      type: String,
      default: ''
    },
    useLocalStorage: {
      type: Boolean,
      default: true
    },
    needInitNewClient: {
      type: Boolean,
      default: false
    },
    secure: {
      type: Boolean,
      default: true
    }
  },
  data () {
    return {
      version: version,
      currentSettings: cloneDeep(merge({}, defaultSettings, this.initSettings)),
      prevSettings: null,
      clients: [],
      statuses: [],
      activeClient: null,
      entities: [],
      publishers: [],
      subscribers: [],
      subscribersStatuses: [false],
      subscribersMessages: [[]],
      subscribersMessagesBuffer: [[]],
      connectUserProperty: {
        value: '',
        name: ''
      },
      willConnectUserProperty: {
        value: '',
        name: ''
      },
      settingsModalModel: false,
      activeClientSettings: null,
      renderInterval: 0,
      messagesLimitCount: 1000,
      notResolvedMessages: [],
      isNeedScroll: false
    }
  },
  computed: {
    limitingEnabled () {
      return this.subscribersMessages.reduce((result, messages) => {
        result += messages.length
        return result
      }, 0) > this.messagesLimitCount
    },
    validateCurrentSettings () {
      return !!this.currentSettings.clientId &&
        (!!this.currentSettings.host && this.secure && !(this.currentSettings.host.indexOf('ws:') === 0)) &&
        (
          (!!this.currentSettings.will.topic && !!this.currentSettings.will.payload) ||
          (!this.currentSettings.will.topic && !this.currentSettings.will.payload)
        )
    }
  },
  methods: {
    /* settings modal handlers start */
    showSettingsModalHandler () {
      this.prevSettings = cloneDeep(this.currentSettings)
    },
    revertSettings () {
      this.clearCurrentSettings()
      this.prevSettings = null
    },
    clearCurrentSettings () {
      this.currentSettings = cloneDeep(merge({}, defaultSettings, this.initSettings))
      this.currentSettings.clientId = `mqtt-board-${Math.random().toString(16).substr(2, 8)}`
      this.activeClientSettings = null
    },
    saveSettingsHandler () {
      this.prevSettings = null
      this.createClient(this.activeClientSettings)
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
      Vue.delete(this.currentSettings.properties.userProperties, name)
      if (!Object.keys(this.currentSettings.properties.userProperties).length) {
        this.currentSettings.properties.userProperties = null
      }
    },
    removeWillConnectUserProperty (name) {
      Vue.delete(this.currentSettings.will.properties.userProperties, name)
      if (!Object.keys(this.currentSettings.will.properties.userProperties).length) {
        this.currentSettings.will.properties.userProperties = null
      }
    },
    hostErrorHandler () {
      this.$q.notify({
        message: 'Host must be not empty and only over secured sockets'
      })
    },
    /* settings modal handlers end */
    /* client logic start */
    clearObject (obj) {
      return Object.keys(obj).reduce((result, key) => {
        let value = obj[key]
        if (value instanceof Object) {
          value = this.clearObject(value)
          if (!Object.keys(value).length) {
            value = undefined
          }
        }
        if (value !== undefined && value !== null) {
          result[key] = value
        }
        return result
      }, {})
    },
    resolveSubscription (packet, subscription) {
      /* check topic */
      if (this.resolveTopics(packet.topic, subscription.topic)) {
        /* check to subscription id */
        if (
          packet.properties && packet.properties.subscriptionIdentifier &&
          subscription.options && subscription.options.properties && subscription.options.properties.subscriptionIdentifier &&
          packet.properties.subscriptionIdentifier !== subscription.options.properties.subscriptionIdentifier
        ) {
          return false
        }
        return true
      }
      return false
    },
    getSharedTopicFilter (topic) {
      return topic.replace(/^\$share\/[^/]+\//, '')
    },
    resolveTopics (topic, subTopic) {
      if (subTopic.indexOf('$share') === 0) {
        subTopic = this.getSharedTopicFilter(subTopic)
      }
      let subTopicPath = subTopic.split('/'),
        topicPath = topic.split('/')

      if (topicPath.length === subTopicPath.length || subTopicPath[subTopicPath.length - 1] === '#') {
        return subTopicPath.reduce((result, currentPath, index) => {
          if (currentPath === '#' || currentPath === '+') {
            return result && true
          }
          return result && currentPath === topicPath[index]
        }, true)
      } else {
        return false
      }
    },
    errorHandler (key, e, needShow) {
      let clientObj = this.clients[key]
      clientObj.logs.push({type: 'error', data: { error: e }, timestamp: Date.now()})
      if (needShow) {
        this.showError(e)
      }
    },
    showError (e) {
      this.$q.notify({
        message: e.message,
        color: 'negative',
        icon: 'mdi-alert-outline',
        timeout: 2000
      })
    },
    saveClientsToLocalStorage () {
      if (this.useLocalStorage) {
        saveClientsToLocalStorage(this.clients)
      }
    },
    createConnectPacket (config) {
      config = this.clearObject(config)
      if (config.protocolVersion !== 5) {
        delete config.properties
        if (config.will) {
          delete config.will.properties
        }
      }
      if (config.will && !config.will.topic && !config.will.payload) {
        delete config.will
      }
      return config
    },
    initClient (key, config) {
      let clientObj = this.clients[key]
      let endHandler = () => { Vue.set(this.statuses, key, false) }

      let client = mqtt.connect(config.host, config)
      /* resubscribe to exists topics */
      client.once('connect', () => {
        let currentStatuses = clientObj.subscribersStatuses
        if (currentStatuses.includes(true)) {
          currentStatuses.forEach((status, index) => {
            if (status) {
              let messages = clientObj.messages
              messages.forEach((arr, index) => {
                messages[index].splice(0, messages[index].length)
              })
              this.subscribe(key, index)
            }
          })
        }
      })
      client.on('connect', (connack) => {
        /* client connect logs push */
        clientObj.logs.push({type: 'connect', data: {...connack}, timestamp: Date.now()})
        Vue.set(this.statuses, key, true)
        client.on('message', (topic, message, packet) => {
          let resolveFlag = false
          clientObj.subscribers.forEach((sub, index, subs) => {
            let isResolved = this.resolveSubscription(packet, sub)
            resolveFlag = resolveFlag || isResolved
            if (isResolved) {
              if (this.activeClient && this.activeClient.id === clientObj.id) {
                if (!this.subscribersMessagesBuffer[index]) {
                  this.subscribersMessagesBuffer[index] = []
                }
                if (this.subscribersStatuses[index] && this.subscribersStatuses[index] !== 'paused') {
                  this.subscribersMessagesBuffer[index].push(packet)
                }
              } else {
                if (!clientObj.messages[index]) {
                  clientObj.messages[index] = []
                }
                let count = clientObj.messages.reduce((count, arr) => { return count + arr.length }, 0)
                if (count > this.messagesLimitCount) {
                  clientObj.messages[index].splice(0, 1)
                }
                if (clientObj.subscribersStatuses[index] && clientObj.subscribersStatuses[index] !== 'paused') {
                  clientObj.messages[index].push(packet)
                }
              }
            }
            if (subs.length - 1 === index && !resolveFlag) {
              clientObj.notResolvedMessages.push(packet)
              if (clientObj.notResolvedMessages.length === 1) {
                clientObj.entities.push({type: 'unresolved'})
                this.saveClientsToLocalStorage(this.clients)
              }
            }
          })
        })
      })
      client.on('error', (error) => {
        this.errorHandler(key, error, false)
      })
      client.on('close', () => {
        clientObj.logs.push({type: 'disconnect', timestamp: Date.now()})
        endHandler()
      })
      client.on('offline', () => {
        clientObj.logs.push({type: 'offline', timestamp: Date.now()})
        endHandler()
      })
      client.on('end', () => {
        clientObj.logs.push({type: 'end', timestamp: Date.now()})
        endHandler()
      })
      client.on('reconnect', () => {
        clientObj.logs.push({type: 'reconnect', timestamp: Date.now()})
      })
      Vue.set(this.clients[key], 'client', client)
      Vue.set(this.clients[key], 'config', config)
    },
    async createClient (index) {
      let config = this.createConnectPacket(this.currentSettings),
        key = typeof index === 'number' ? index : this.clients.length
      /* init new client */
      if (!this.clients[key]) {
        let client = {}
        client.id = key
        client.status = false
        client.subscribers = [cloneDeep(defaultSubscriber)]
        client.publishers = [cloneDeep(defaultPublisher)]
        client.entities = [{type: 'subscriber', index: 0}, {type: 'publisher', index: 0}]
        client.messages = [[]]
        client.subscribersStatuses = [false]
        client.logs = [{type: 'created', data: {...config}, timestamp: Date.now()}]
        client.notResolvedMessages = []
        this.clients[key] = client
      } else {
        let clientObj = this.clients[key]
        if (clientObj.client) {
          await clientObj.client.end(true)
          this.statuses[key] = false
        }
        clientObj.logs.push({type: 'updated', data: {...config}, timestamp: Date.now()})
      }
      this.saveClientsToLocalStorage()
      this.initClient(key, config)
      this.clearCurrentSettings()
    },
    addClientHandler () {
      this.settingsModalModel = true
    },
    editClientHandler (key) {
      this.currentSettings = cloneDeep(merge({}, defaultSettings, this.clients[key].config))
      this.activeClientSettings = key
      this.settingsModalModel = true
    },
    connectClientHandler (key) {
      let clientObj = this.clients[key]
      if (clientObj.client) {
        clientObj.client.end(true)
        this.statuses[key] = false
      }
      this.initClient(key, clientObj.config)
    },
    async disconnectClientHandler (key) {
      let clientObj = this.clients[key]
      for (let index = 0; index < clientObj.subscribers.length; index++) {
        let status = clientObj.subscribersStatuses[index]
        if (status) {
          await this.unsubscribe(key, index)
        }
      }
      await clientObj.client.end(true)
      clientObj.client = null
      this.statuses[key] = false
    },
    deleteClientHandler (key) {
      let clientObj = this.clients[key]
      this.$q.dialog({
        title: 'Confirm',
        message: `Do you really want to delete client for ${clientObj.config.clientId}?`,
        cancel: true,
        ok: true
      }).then(async () => {
        if (clientObj.client) {
          await clientObj.client.end(true)
          this.statuses[key] = false
          this.statuses.splice(key, 1)
        }
        this.clients.splice(key, 1)
        this.saveClientsToLocalStorage()
      })
        .catch(() => {})
    },
    setActiveClient (key) {
      let client = this.clients[key]
      this.entities = client.entities
      this.subscribers = client.subscribers
      this.publishers = client.publishers
      this.subscribersMessages = client.messages
      this.notResolvedMessages = client.notResolvedMessages
      this.subscribersStatuses = client.subscribersStatuses
      this.activeClient = client
    },
    clearActiveClient () {
      this.activeClient = null
      this.entities = []
      this.subscribers = []
      this.publishers = []
      this.subscribersMessagesBuffer = []
      this.notResolvedMessages = []
      this.subscribersStatuses = []
    },
    /* client logic end */
    /* pub/sub logic start */
    findEntity (obj) {
      return this.entities.findIndex((entity) => {
        return obj.type === entity.type && obj.index === entity.index
      })
    },
    addPublisher () {
      this.publishers.push(cloneDeep(defaultPublisher))
      this.entities.push({type: 'publisher', index: this.publishers.length - 1})
      this.saveClientsToLocalStorage()
      this.isNeedScroll = true
    },
    addSubscriber () {
      this.subscribers.push(cloneDeep(defaultSubscriber))
      this.subscribersMessages.push([])
      this.subscribersStatuses.push(false)
      this.entities.push({type: 'subscriber', index: this.subscribers.length - 1})
      this.saveClientsToLocalStorage()
      this.isNeedScroll = true
    },
    removePublisher (key) {
      this.publishers.splice(key, 1)
      this.entities.splice(this.findEntity({type: 'publisher', index: key}), 1)
      this.entities.forEach(entity => {
        if (entity.type === 'publisher' && entity.index > key) {
          entity.index--
        }
      })
      this.saveClientsToLocalStorage()
    },
    async removeSubscriber (subscriberIndex) {
      let status = this.subscribersStatuses[subscriberIndex]
      if (status) {
        await this.unsubscribeMessageHandler(this.activeClient.id, subscriberIndex)
      }
      this.subscribers.splice(subscriberIndex, 1)
      this.subscribersStatuses.splice(subscriberIndex, 1)
      this.subscribersMessages.splice(subscriberIndex, 1)
      if (!this.subscribers) {
        clearInterval(this.renderInterval)
      }
      this.entities.splice(this.findEntity({type: 'subscriber', index: subscriberIndex}), 1)
      this.entities.forEach(entity => {
        if (entity.type === 'subscriber' && entity.index > subscriberIndex) {
          entity.index--
        }
      })
      this.saveClientsToLocalStorage()
    },
    inputSubscriber (index, val) {
      this.subscribers[index] = val
      this.saveClientsToLocalStorage()
    },
    inputPublisher (index, val) {
      this.publishers[index] = val
      this.saveClientsToLocalStorage()
    },
    async publishMessageHandler (clientKey, publisherIndex) {
      let settings = this.clearObject(this.publishers[publisherIndex])
      try {
        await this.activeClient.client.publish(settings.topic, settings.payload, settings.options)
        this.$q.notify({
          message: `Published successfuly in topic ${settings.topic}`,
          type: 'positive',
          color: 'positive',
          timeout: 700
        })
      } catch (e) { this.errorHandler(clientKey, e, true) }
    },
    async subscribeMessageHandler (clientKey, subscriberIndex) {
      let settings = this.clearObject(this.subscribers[subscriberIndex])
      if (
        this.subscribers.reduce((res, sub, index) => {
          if (this.subscribersStatuses[index]) {
            res.push(sub.topic)
          }
          return res
        }, [])
          .filter(topic => topic === settings.topic || settings.topic === this.getSharedTopicFilter(topic) || topic === this.getSharedTopicFilter(settings.topic)).length
      ) {
        this.showError(new Error('You have another subscription with same topic'))
        return false
      }
      if (this.subscribersMessages && this.subscribersMessages.length) {
        Vue.set(this.subscribersMessages, subscriberIndex, [])
      }
      if (!this.renderInterval) {
        this.renderInterval = setInterval(() => {
          this.subscribersMessagesBuffer.forEach((messages, index) => {
            let savedMessages = this.subscribersMessages[index]
            if (savedMessages) {
              if (this.limitingEnabled) {
                savedMessages.splice(0, messages.length)
              }
              savedMessages.splice(savedMessages.length, 0, ...messages)
            }
          })
          this.subscribersMessagesBuffer = []
        }, 500)
      }
      await this.subscribe(clientKey, subscriberIndex)
    },
    async subscribe (clientKey, subscriberIndex) {
      let clientObj = this.clients[clientKey],
        settings = this.clearObject(this.subscribers[subscriberIndex])
      try {
        Vue.set(this.subscribersStatuses, subscriberIndex, true)
        let grants = await clientObj.client.subscribe(settings.topic, settings.options)
        clientObj.logs.push({type: 'subscribe', data: { settings, grants }, timestamp: Date.now()})
      } catch (e) {
        Vue.set(this.subscribersStatuses, subscriberIndex, false)
        this.errorHandler(clientKey, e, true)
      }
    },
    playSubscriberHandler (subscriberIndex) {
      Vue.set(this.subscribersStatuses, subscriberIndex, true)
    },
    pauseSubscriberHandler (subscriberIndex) {
      Vue.set(this.subscribersStatuses, subscriberIndex, 'paused')
    },
    clearMessagesHandler (subscriberIndex) {
      let messages = this.subscribersMessages[subscriberIndex]
      messages.splice(0, messages.length)
    },
    async unsubscribeMessageHandler (clientKey, subscriberIndex) {
      await this.unsubscribe(clientKey, subscriberIndex)
    },
    async unsubscribe (clientKey, subscriberIndex) {
      let clientObj = this.clients[clientKey],
        settings = this.clearObject(this.subscribers[subscriberIndex])
      try {
        await clientObj.client.unsubscribe(settings.topic)
        clientObj.logs.push({type: 'unsubscribe', data: this.clearObject(settings), timestamp: Date.now()})
        Vue.set(this.subscribersStatuses, subscriberIndex, false)
      } catch (e) {
        this.errorHandler(clientKey, e, true)
      }
    },
    /* pub/sub logic end */
    hideLogs () {
      let indexLogsEntity = this.entities.findIndex(entity => entity.type === 'logs')
      this.entities.splice(indexLogsEntity, 1)
    },
    showLogs () {
      this.entities.unshift({type: 'logs'})
    },
    swipeHandler (data) {
      let el = this.$refs.wrapper,
        elementOffsetWidth = el.offsetWidth,
        { direction } = data
      if (direction === 'left') {
        animate.start({
          from: el.scrollLeft,
          to: el.scrollLeft + elementOffsetWidth,
          duration: 200,
          apply (pos) { el.scrollLeft = pos }
        })
      } else if (direction === 'right') {
        animate.start({
          from: el.scrollLeft,
          to: el.scrollLeft - elementOffsetWidth,
          duration: 200,
          apply (pos) { el.scrollLeft = pos }
        })
      }
    }
  },
  created () {
    if (this.needInitNewClient) {
      this.currentSettings = cloneDeep(merge({}, defaultSettings, this.initSettings))
      this.createClient()
      this.setActiveClient(0)
    }
    if (this.useLocalStorage) {
      let savedClients = LocalStorage.get.item('clients')
      if (savedClients) {
        savedClients.forEach(client => {
          this.currentSettings = client.config
          this.createClient()
          let currentClient = this.clients[this.clients.length - 1]
          currentClient.publishers = client.publishers
          currentClient.subscribers = client.subscribers
          /* preserve for old clients */
          if (client.entities.length && !client.entities.filter(entity => entity.type === 'logs').length) {
            client.entities.unshift({type: 'logs'})
          }
          currentClient.entities = client.entities
          currentClient.messages = new Array(client.subscribers.length)
          currentClient.messages.fill([])
          currentClient.subscribersStatuses = new Array(client.subscribers.length)
          currentClient.subscribersStatuses.fill(false)
        })
      }
    }
    if (window) {
      window.addEventListener('beforeunload', () => {
        this.clients.forEach((clientObj) => {
          clientObj.client.end(true)
        })
      })
    }
  },
  destroyed () {
    this.clients.forEach((clientObj) => {
      clientObj.client.end(true)
    })
  },
  components: {
    VirtualList, FlespiTopic, Subscriber, Publisher, Unresolved, Logs
  },
  updated () {
    if (this.isNeedScroll) {
      let el = this.$refs.wrapper
      animate.start({
        from: el.scrollLeft,
        to: el.scrollWidth,
        duration: 300,
        apply (pos) { el.scrollLeft = pos }
      })
      this.isNeedScroll = false
    }
  }
}
</script>
