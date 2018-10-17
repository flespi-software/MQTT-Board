<template>
  <div ref="wrapper" v-touch-swipe.horizontal="swipeHandler" style="position: absolute; bottom: 0; right: 0; top: 0; left: 0;">
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
          <q-input color="dark"  v-model="currentSettings.clientId" float-label="Client ID" :error="!currentSettings.clientId" :after="[{icon: 'mdi-refresh', handler () { currentSettings.clientId = `mqtt-client-${Math.random().toString(16).substr(2, 8)}` }}]"/>
          <q-input color="dark"  v-model="currentSettings.host" float-label="Host" :error="!currentSettings.host"/>
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
              <q-input color="dark" v-model="currentSettings.will.topic" float-label="Will topic"/>
              <q-input color="dark" v-model="currentSettings.will.payload" type="textarea" float-label="Will payload"/>
              <q-input color="dark" v-model="currentSettings.will.qos" :min="0" :max="2" :step="1" :error="typeof currentSettings.will.qos === 'number' && (currentSettings.will.qos < 0 || currentSettings.will.qos > 2)" type="number" float-label="Will qos"/>
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
          <q-btn flat dense v-close-overlay @click="saveSettingsHandler">Save</q-btn>
        </q-toolbar>
      </q-modal-layout>
    </q-modal>
    <q-toolbar color="dark">
      <q-btn v-if="activeClient" flat dense icon="keyboard_arrow_left" @click="clearActiveClient"/>
      <q-toolbar-title>
        <img class="gt-sm" src="statics/mqttboard.png" alt="MQTT Board" style="height: 30px">
        {{activeClient ? `${activeClient.config.clientId}` : 'MQTT Clients'}}
        <sup style="position: relative; font-size: .9rem; padding-left: 4px">{{version}}</sup>
      </q-toolbar-title>
      <q-btn v-if="!activeClient" @click.native="addClientHandler" icon="mdi-plus">
        Client
      </q-btn>
      <q-btn v-if="activeClient" @click.native="addPublisher" icon="mdi-publish">
        <span v-if="$q.platform.is.desktop">Publisher</span>
        <q-tooltip>Add new publisher</q-tooltip>
      </q-btn>
      <q-btn v-if="activeClient" @click.native="addSubscriber" icon="mdi-arrow-down-bold">
        <span v-if="$q.platform.is.desktop">Subscriber</span>
        <q-tooltip>Add new subscriber</q-tooltip>
      </q-btn>
      <q-btn v-if="activeClient && activeClient.config.host.indexOf('flespi') !== -1" @click.native="$refs.felspiModal.open()" icon="mdi-star-outline">
        <span v-if="$q.platform.is.desktop">Flespi subscriber</span>
        <q-tooltip>Add new flespi subscriber</q-tooltip>
      </q-btn>
    </q-toolbar>
    <div v-if="!activeClient">
      <div v-if="clients.length" class="mqtt-clients row">
        <div class="q-pt-md q-px-md cursor-pointer col-xl-3 col-md-4 col-sm-6 col-xs-12" v-for="(client, index) in clients" :key="index">
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
              <q-btn v-if="statuses[index]" icon="mdi-stop" @click.stop="disconnectClientHandler(index)"/>
              <q-btn v-else icon="mdi-play" @click.stop="connectClientHandler(index)"/>
              <q-btn icon="mdi-settings" @click.stop="editClientHandler(index)"/>
              <q-btn icon="mdi-delete" @click.stop="deleteClientHandler(index)"/>
            </q-card-actions>
          </q-card>
        </div>
      </div>
      <div v-else class="text-center q-mt-lg text-dark text-weight-bold" style="font-size: 2.5rem;">
        <div>No clients</div>
        <q-btn v-if="!activeClient" @click.native="addClientHandler">Create client</q-btn>
      </div>
    </div>
    <div ref="wrapper" class="no-wrap row" style="height: calc(100% - 50px); width: 100%; overflow: auto;" v-else>
      <template v-for="(entity, index) in entities">
        <publisher
          v-if="entity.type === 'publisher'"
          :key="`publ${index}`"
          :value="publishers[entity.index]"
          @input="(val) => { inputPublisher(entity.index, val) }"
          :version="activeClient.config.protocolVersion"
          @remove="removePublisher(entity.index)"
          @publish="publishMessageHandler(publishers[entity.index])"
        />
        <subscriber
          v-else-if="entity.type === 'subscriber'"
          :key="`subs${index}`"
          :value="subscribers[entity.index]"
          @input="(val) => { inputSubscriber(entity.index, val) }"
          :status="subscribersStatuses[entity.index]"
          :messages="subscribersMessages[entity.index]"
          :version="activeClient.config.protocolVersion"
          @remove="removeSubscriber(entity.index)"
          @subscribe="subscribeMessageHandler(entity.index, subscribers[entity.index])"
          @unsubscribe="unsubscribeMessageHandler(entity.index, subscribers[entity.index])"
        />
        <unresolved
          v-else-if="notResolvedMessages.length && entity.type === 'unresolved'"
          :key="`unresolved${index}`"
          :messages="notResolvedMessages"
        />
      </template>
    </div>
  </div>
</template>

<style lang="stylus">
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
import { version } from '../../package.json'

const
  defaultSettings = {
    clientId: `mqtt-client-${Math.random().toString(16).substr(2, 8)}`,
    host: 'wss://mqtt.flespi.io',
    keepalive: 60,
    protocolVersion: 5,
    clean: true,
    username: 'FlespiToken XXXXXXXXXXXXXXXXXXX',
    password: '',
    properties: {
      sessionExpiryInterval: null,
      receiveMaximum: null,
      maximumPacketSize: null,
      topicAliasMaximum: null,
      requestResponseInformation: null,
      requestProblemInformation: null,
      userProperties: null,
      authenticationMethod: null,
      authenticationData: null
    },
    will: {
      topic: null,
      payload: null,
      qos: null,
      retain: null,
      properties: {
        willDelayInterval: null,
        payloadFormatIndicator: null,
        messageExpiryInterval: null,
        contentType: null,
        responseTopic: null,
        correlationData: null,
        userProperties: null
      }
    }
  },
  defaultSubscriber = {
    topic: '#',
    mode: 0,
    options: {
      qos: 0,
      nl: null,
      rap: null,
      rh: null,
      properties: {
        subscriptionIdentifier: null,
        userProperties: null
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
        payloadFormatIndicator: null,
        messageExpiryInterval: null,
        topicAlias: null,
        responseTopic: null,
        correlationData: null,
        userProperties: null,
        subscriptionIdentifier: null,
        contentType: null
      }
    }
  }

export default {
  name: 'MqttClient',
  props: {
    initSettings: {
      type: Object
    }
  },
  data () {
    return {
      version: version,
      currentSettings: cloneDeep(merge(defaultSettings, this.initSettings)),
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
      this.currentSettings = cloneDeep(merge(defaultSettings, this.initSettings))
      this.currentSettings.clientId = `mqtt-client-${Math.random().toString(16).substr(2, 8)}`
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
    /* settings modal handlers end */
    /* client logic start */
    clearObject (obj) {
      return Object.keys(obj).reduce((result, key) => {
        let value = obj[key]
        if (value instanceof Object) {
          value = this.clearObject(value)
          if (!Object.keys(value).length) {
            value = null
          }
        }
        if (value !== null) {
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
    errorHandler (e) {
      console.trace()
      this.$q.notify({
        message: e.message,
        color: 'negative',
        icon: 'mdi-alert-outline',
        timeout: 2000
      })
    },
    saveClientsToLocalStorage: debounce((clients) => {
      LocalStorage.set('clients', clients.map(client => ({
        config: client.config,
        publishers: client.publishers,
        subscribers: client.subscribers,
        entities: client.entities
      })))
    }, 500, { trailing: true }),
    initClient (key, config) {
      let // endHandler = () => { Vue.set(this.statuses, key, false) },
        errorHandler = this.errorHandler

      let client = mqtt.connect(config.host, this.clearObject(config))
      /* resubscribe to exists topics */
      client.once('connect', () => {
        let currentStatuses = this.clients[key].subscribersStatuses
        if (currentStatuses.includes(true)) {
          currentStatuses.forEach((status, index) => {
            if (status) {
              let messages = this.clients[key].messages
              messages.forEach((arr, index) => {
                messages[index].splice(0, messages[index].length)
              })
              this.subscribe(client, index, this.clients[key].subscribers[index])
            }
          })
        }
      })
      client.on('connect', () => {
        Vue.set(this.statuses, key, true)
        client.on('message', (topic, message, packet) => {
          let resolveFlag = false,
            clientObj = this.clients[key]
          clientObj.subscribers.forEach((sub, index, subs) => {
            let isResolved = this.resolveSubscription(packet, sub)
            resolveFlag = resolveFlag || isResolved
            if (isResolved) {
              if (this.activeClient && this.activeClient.id === clientObj.id) {
                if (!this.subscribersMessagesBuffer[index]) {
                  this.subscribersMessagesBuffer[index] = []
                }
                this.subscribersMessagesBuffer[index].push(packet)
              } else {
                if (!clientObj.messages[index]) {
                  clientObj.messages[index] = []
                }
                let count = clientObj.messages.reduce((count, arr) => { return count + arr.length }, 0)
                if (count > this.messagesLimitCount) {
                  clientObj.messages[index].splice(0, 1)
                }
                clientObj.messages[index].push(packet)
              }
            }
            if (subs.length - 1 === index && !resolveFlag) {
              this.notResolvedMessages.push(packet)
              if (this.notResolvedMessages.length === 1) {
                this.entities.push({type: 'unresolved'})
                this.saveClientsToLocalStorage(this.clients)
              }
            }
          })
        })
      })
      client.on('error', errorHandler)
      client.on('close', () => { console.log('close'); Vue.set(this.statuses, key, false) })
      client.on('offline', () => { console.log('offline'); Vue.set(this.statuses, key, false) })
      client.on('end', () => { console.log('end'); Vue.set(this.statuses, key, false) })
      Vue.set(this.clients[key], 'client', client)
      Vue.set(this.clients[key], 'config', config)
    },
    async createClient (index) {
      let config = this.currentSettings,
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
        this.clients[key] = client
      } else {
        let clientObj = this.clients[key]
        if (clientObj.client && this.statuses[key]) {
          await clientObj.client.end(true)
          this.statuses[key] = false
        }
      }
      this.saveClientsToLocalStorage(this.clients)
      this.initClient(key, config)
      this.clearCurrentSettings()
    },
    addClientHandler () {
      this.settingsModalModel = true
    },
    editClientHandler (key) {
      this.currentSettings = cloneDeep(this.clients[key].config)
      this.activeClientSettings = key
      this.settingsModalModel = true
    },
    connectClientHandler (key) {
      let clientObj = this.clients[key]
      this.initClient(key, clientObj.config)
    },
    async disconnectClientHandler (key) {
      let clientObj = this.clients[key]
      clientObj.subscribers.forEach((subscriber, index) => {
        let status = clientObj.subscribersStatuses[index]
        if (status) {
          this.unsubscribeMessageHandler(index, subscriber)
        }
      })
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
        this.saveClientsToLocalStorage(this.clients)
      })
        .catch(() => {})
    },
    setActiveClient (key) {
      let client = this.clients[key]
      if (!client.client._client.connected) {
        this.errorHandler(new Error('Client not connected'))
        return false
      }
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
      this.saveClientsToLocalStorage(this.clients)
      this.isNeedScroll = true
    },
    addSubscriber () {
      this.subscribers.push(cloneDeep(defaultSubscriber))
      this.subscribersMessages.push([])
      this.subscribersStatuses.push(false)
      this.entities.push({type: 'subscriber', index: this.subscribers.length - 1})
      this.saveClientsToLocalStorage(this.clients)
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
      this.saveClientsToLocalStorage(this.clients)
    },
    async removeSubscriber (key) {
      let subscriber = this.subscribers[key],
        status = this.subscribersStatuses[key]
      if (status) {
        await this.unsubscribeMessageHandler(key, subscriber)
      }
      this.subscribers.splice(key, 1)
      this.subscribersStatuses.splice(key, 1)
      this.subscribersMessages.splice(key, 1)
      if (!this.subscribers) {
        clearInterval(this.renderInterval)
      }
      this.entities.splice(this.findEntity({type: 'subscriber', index: key}), 1)
      this.entities.forEach(entity => {
        if (entity.type === 'subscriber' && entity.index > key) {
          entity.index--
        }
      })
      this.saveClientsToLocalStorage(this.clients)
    },
    inputSubscriber (index, val) {
      this.subscribers[index] = val
      this.saveClientsToLocalStorage(this.clients)
    },
    inputPublisher (index, val) {
      this.publishers[index] = val
      this.saveClientsToLocalStorage(this.clients)
    },
    async publishMessageHandler (settings) {
      settings = this.clearObject(settings)
      try {
        await this.activeClient.client.publish(settings.topic, settings.payload, settings.options)
        this.$q.notify({
          message: `Published successfuly in topic ${settings.topic}`,
          type: 'positive',
          color: 'positive',
          timeout: 700
        })
      } catch (e) { this.errorHandler(e) }
    },
    async subscribeMessageHandler (key, settings) {
      if (
        this.subscribers.reduce((res, sub, index) => {
          if (this.subscribersStatuses[index]) {
            res.push(sub.topic)
          }
          return res
        }, [])
          .filter(topic => topic === settings.topic || settings.topic === this.getSharedTopicFilter(topic) || topic === this.getSharedTopicFilter(settings.topic)).length
      ) {
        this.errorHandler(new Error('You have another subscription with same topic'))
        return false
      }
      if (this.subscribersMessages && this.subscribersMessages.length) {
        Vue.set(this.subscribersMessages, key, [])
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
      await this.subscribe(this.activeClient.client, key, settings)
    },
    async subscribe (client, key, settings) {
      settings = this.clearObject(settings)
      try {
        Vue.set(this.subscribersStatuses, key, true)
        await client.subscribe(settings.topic, settings.options)
      } catch (e) {
        Vue.set(this.subscribersStatuses, key, false)
        this.errorHandler(e)
      }
    },
    async unsubscribeMessageHandler (key, settings) {
      try {
        await this.activeClient.client.unsubscribe(settings.topic)
        Vue.set(this.subscribersStatuses, key, false)
      } catch (e) { this.errorHandler(e) }
    },
    /* pub/sub logic end */
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
    let savedClients = LocalStorage.get.item('clients')
    if (savedClients) {
      savedClients.forEach(client => {
        this.currentSettings = client.config
        this.createClient()
        let currentClient = this.clients[this.clients.length - 1]
        currentClient.publishers = client.publishers
        currentClient.subscribers = client.subscribers
        currentClient.entities = client.entities
        currentClient.messages = new Array(client.subscribers.length)
        currentClient.messages.fill([])
        currentClient.subscribersStatuses = new Array(client.subscribers.length)
        currentClient.subscribersStatuses.fill(false)
      })
    }
    if (window) {
      window.addEventListener('beforeunload', () => {
        this.clients.forEach(async (clientObj) => {
          await clientObj.client.end(true)
        })
      })
    }
  },
  destroyed () {
    this.clients.forEach(async (clientObj) => {
      await clientObj.client.end(true)
    })
  },
  components: {
    VirtualList, FlespiTopic, Subscriber, Publisher, Unresolved
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
