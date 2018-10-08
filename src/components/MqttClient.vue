<template>
  <div style="position: absolute; bottom: 0; right: 0; top: 0; left: 0;">
    <q-modal @show="showSettingsModalHandler" v-model='settingsModalModel'>
      <q-modal-layout>
         <q-toolbar slot="header" color='dark'>
          <q-btn flat dense v-close-overlay icon="keyboard_arrow_left" @click="revertSettings"/>
          <q-toolbar-title>
            Connection settings
          </q-toolbar-title>
        </q-toolbar>
        <div style="margin: 20px; height: 50vh; width: 50vw">
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
      <q-toolbar-title>{{activeClient ? `MQTT Client: ${activeClient.config.clientId}` : 'MQTT Clients'}}</q-toolbar-title>
      <q-btn v-if="!activeClient" @click.native="addClientHandler" icon="mdi-plus">
        <q-tooltip>Add new client</q-tooltip>
      </q-btn>
      <q-btn v-if="activeClient" @click.native="addPublisher" icon="mdi-plus">
        Publisher
        <q-tooltip>Add new publisher</q-tooltip>
      </q-btn>
      <q-btn v-if="activeClient" @click.native="addSubscriber" icon="mdi-plus">
        Subscriber
        <q-tooltip>Add new subscriber</q-tooltip>
      </q-btn>
    </q-toolbar>
    <div v-if="!activeClient">
      <div v-if="clients.length" class="mqtt-clients" style="display: flex; padding: 20px 20px;">
        <q-card inline class="q-mr-md q-mb-md cursor-pointer" style="width: 300px;" v-for="(client, index) in clients" @click.native="setActiveClient(index)" :key="index" :class="{'bg-red-2': !statuses[index], 'bg-green-2': statuses[index]}">
          <q-card-title>
            {{client.config.clientId.length > 29 ? `${client.config.clientId.slice(0, 29)}...` : client.config.clientId}}
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
            <q-btn icon="mdi-settings" @click.stop="editClientHandler(index)"/>
            <q-btn icon="mdi-delete" @click.stop="deleteClientHandler(index)"/>
          </q-card-actions>
        </q-card>
      </div>
      <div v-else class="text-center q-mt-lg text-dark text-weight-bold" style="font-size: 2.5rem;">No clients</div>
    </div>
    <div class="no-wrap row" style="height: calc(100% - 50px); width: 100%; overflow: auto;" v-else>
      <div class="mqtt-client__publisher col-xl-3 col-md-6 col-sm-12 col-xs-12" v-for="(publisher, index) in publishers" :key="`publ${index}`">
        <q-card class="q-ma-sm" style="border: 2px solid indigo;">
          <q-card-main class="q-pb-none" style="position: relative;">
            <q-icon class="cursor-pointer" size="1rem" name="mdi-close" @click.native="removePublisher(index)" style="position: absolute; top: 5px; right: 5px;"/>
            <div>
              <q-input color="dark" v-model="publisher.topic" float-label="Topic" :error="!publisher.topic"/>
              <q-input color="dark" type="textarea" :max-height="300" v-model="publisher.payload" float-label="Message" :error="!publisher.payload"/>
              <q-collapsible class="q-mt-sm q-mb-sm bg-grey-2" label="Options">
                <div>
                  <div class="q-mb-sm">QoS</div>
                  <div>
                    <q-radio class="q-mr-sm" color="dark" v-model="publisher.options.qos" :val="0" left-label label="0" />
                    <q-radio class="q-mr-sm" color="dark" v-model="publisher.options.qos" :val="1" left-label label="1" />
                    <q-radio class="q-mr-sm" color="dark" v-model="publisher.options.qos" :val="2" left-label label="2" />
                  </div>
                </div>
                <q-checkbox style="display: flex;" color="dark" class="q-mt-sm q-mb-sm" v-model="publisher.options.retain" label="Retain"/>
                <q-checkbox style="display: flex;" color="dark" class="q-mt-sm q-mb-sm" v-model="publisher.options.dup" label="Duplicate flag"/>
                <q-collapsible v-if="activeClient.config.protocolVersion === 5" class="q-mt-sm q-mb-sm bg-grey-4" label="Properties">
                  <q-checkbox color="dark" class="q-mt-sm q-mb-sm" v-model="publisher.options.properties.payloadFormatIndicator" label="Payload format indicator"/>
                  <q-input color="dark" type="number" v-model="publisher.options.properties.messageExpiryInterval" float-label="Message expiry interval"/>
                  <q-input color="dark" type="number" v-model="publisher.options.properties.topicAlias" float-label="Topic alias"/>
                  <q-input color="dark" v-model="publisher.options.properties.responseTopic" float-label="Response topic"/>
                  <q-input color="dark" type="textarea" :max-height="50" v-model="publisher.options.properties.correlationData" float-label="Correlation data"/>
                  <div>
                    <div class="q-mt-md">User Properties</div>
                    <div>
                      <q-list v-if="publisher.options.properties.userProperties">
                        <q-item v-for="(value, name) in publisher.options.properties.userProperties" :key="`${name}: ${value}`">
                          <q-icon class="q-mr-sm cursor-pointer" size='1rem' @click.native="removePublishUserProperty(index, name)" name="mdi-close-circle"/>
                          <span>{{`${name}: ${value}`}}</span>
                        </q-item>
                      </q-list>
                      <q-input color="dark" v-model="publishUserProperty.name" float-label="User property name"/>
                      <q-input color="dark" v-model="publishUserProperty.value" float-label="User property value"/>
                      <q-btn style="width: 100%" class="q-mt-sm" color="dark" @click="addPublishUserProperty(index)">Add</q-btn>
                    </div>
                  </div>
                  <q-input color="dark" type="number" v-model="publisher.options.properties.subscriptionIdentifier" float-label="Subscription identifier"/>
                  <q-input color="dark" v-model="publisher.options.properties.contentType" float-label="Content type"/>
                </q-collapsible>
              </q-collapsible>
            </div>
          </q-card-main>
          <q-card-actions>
            <q-item style="width: 100%;" dense class="q-card cursor-pointer" highlight @click.native="publishMessageHandler(publisher)">
              <q-item-main>
                <q-item-tile style="font-size: 0.9rem;" class="uppercase text-bold" label>Publish message</q-item-tile>
                <q-item-tile style="margin-top: 0; font-size: 0.75rem" class="ellipsis" sublabel>{{publisher.topic}}</q-item-tile>
              </q-item-main>
              <q-item-side right icon="mdi-send"/>
            </q-item>
          </q-card-actions>
        </q-card>
      </div>
      <div class="mqtt-client__subscriber col-xl-3 col-md-6 col-sm-12 col-xs-12" v-for="(subscriber, index) in subscribers"  :key="`subs${index}`">
        <q-card class="q-ma-sm" v-if="!subscribersStatuses[index]" style="border: 2px solid orange;">
          <q-card-main style="position: relative;" class="q-pb-none">
            <q-icon class="cursor-pointer" size="1rem" name="mdi-close" @click.native="removeSubscriber(index)" style="position: absolute; top: 5px; right: 5px;"/>
            <div>
              <q-input :disable="subscribersStatuses[index]" color="dark" v-model="subscriber.topic" float-label="Topic" :error="!subscriber.topic"/>
              <div v-if="subscriber.topic.indexOf('$share') === 0" style="color: red; font-size: 0.6rem; margin-top: 2px;">You may not receive messages by this topic</div>
              <q-collapsible class="q-mt-sm q-mb-sm bg-grey-2" label="Options">
                <q-input :disable="subscribersStatuses[index]" type="number" color="dark" :min="0" :max="2" :step="1" v-model="subscriber.options.qos" float-label="QoS" :error="typeof subscriber.options.qos === 'number' && (subscriber.options.qos < 0 || subscriber.options.qos > 2)"/>
                <q-checkbox :disable="subscribersStatuses[index]" v-if="activeClient.config.protocolVersion === 5" style="display: flex;" color="dark" class="q-mt-sm q-mb-sm" v-model="subscriber.options.nl" label="No local"/>
                <q-checkbox :disable="subscribersStatuses[index]" v-if="activeClient.config.protocolVersion === 5" style="display: flex;" color="dark" class="q-mt-sm q-mb-sm" v-model="subscriber.options.rap" label="Retain as Published"/>
                <div v-if="activeClient.config.protocolVersion === 5">
                  <div class="q-mb-sm">Retain handling</div>
                  <div>
                    <q-radio :disable="subscribersStatuses[index]" class="q-mr-sm" color="dark" v-model="subscriber.options.rh" :val="0" left-label label="0" />
                    <q-radio :disable="subscribersStatuses[index]" class="q-mr-sm" color="dark" v-model="subscriber.options.rh" :val="1" left-label label="1" />
                    <q-radio :disable="subscribersStatuses[index]" class="q-mr-sm" color="dark" v-model="subscriber.options.rh" :val="2" left-label label="2" />
                  </div>
                </div>
                <q-collapsible v-if="activeClient.config.protocolVersion === 5" class="q-mt-sm q-mb-sm bg-grey-4" label="Properties">
                  <q-input :disable="subscribersStatuses[index]" color="dark" type="number" v-model="subscriber.options.properties.subscriptionIdentifier" float-label="Subscription identifier"/>
                  <div v-if="!subscribersStatuses[index] || subscriber.options.properties.userProperties">
                    <div class="q-mt-md">User Properties</div>
                    <div>
                      <q-list v-if="subscriber.options.properties.userProperties">
                        <q-item v-for="(value, name) in subscriber.options.properties.userProperties" :key="`${name}: ${value}`">
                          <q-icon v-if="!subscribersStatuses[index]" class="q-mr-sm cursor-pointer" size='1rem' @click.native="removeSubscriberUserProperty(index, name)" name="mdi-close-circle"/>
                          <span>{{`${name}: ${value}`}}</span>
                        </q-item>
                      </q-list>
                      <q-input v-if="!subscribersStatuses[index]" color="dark" v-model="subscriberUserProperty.name" float-label="User property name"/>
                      <q-input v-if="!subscribersStatuses[index]" color="dark" v-model="subscriberUserProperty.value" float-label="User property value"/>
                      <q-btn v-if="!subscribersStatuses[index]" style="width: 100%" class="q-mt-sm" color="dark" @click="addSubscriberhUserProperty(index)">Add</q-btn>
                    </div>
                  </div>
                </q-collapsible>
              </q-collapsible>
            </div>
          </q-card-main>
          <q-card-actions>
            <q-item style="width: 100%;" dense class="q-card cursor-pointer" highlight @click.native="subscribeMessageHandler(index, subscriber)">
              <q-item-side icon="mdi-play"/>
              <q-item-main>
                <q-item-tile style="font-size: 0.9rem;" class="uppercase text-bold" label>Subscribe</q-item-tile>
                <q-item-tile style="margin-top: 0; font-size: 0.75rem" class="ellipsis" sublabel>{{subscriber.topic}}</q-item-tile>
              </q-item-main>
            </q-item>
          </q-card-actions>
        </q-card>
        <div v-else class="q-ma-sm q-card" style="padding-right: 5px; position: relative; border: 2px solid orange; height: calc(100% - 32px);">
          <q-icon class="cursor-pointer" size="1rem" name="mdi-close" @click.native="removeSubscriber(index)" style="position: absolute; top: 5px; right: 5px;"/>
          <q-item style="width: calc(100% - 30px);" dense class="q-card cursor-pointer q-mt-sm q-ml-sm q-mb-sm q-mr-lg" highlight @click.native="unsubscribeMessageHandler(index, subscriber)">
            <q-tooltip>Unsubscribe from {{subscriber.topic}}</q-tooltip>
            <q-item-side icon="mdi-stop"/>
            <q-item-main>
              <q-item-tile style="font-size: 0.9rem;" class="uppercase text-bold" label>Unsubscribe</q-item-tile>
              <q-item-tile style="margin-top: 0; font-size: 0.75rem" class="ellipsis" sublabel>{{subscriber.topic}}</q-item-tile>
            </q-item-main>
          </q-item>
          <virtual-list v-if="subscribersMessages[index].length" :size="110" :remain="15" style="position: absolute; top: 52px; bottom: 0; right: 0; left: 0; height: auto;">
            <q-card v-for="(message, msgIndex) in subscribersMessages[index]" :key="`subMsg${index}${msgIndex}`">
              <div class="message__title q-pt-sm q-pl-sm q-pr-sm" style="height: 50px; position: relative;">
                <div :title="message.topic" class="message__topic ellipsis" style="font-size: 0.8rem; font-weight: bold;">
                  {{message.topic}}
                </div>
                <div class="message__sys text-grey-7" style="font-size: 0.8rem;">
                  {{`qos: ${message.qos}, dup: ${message.dup ? '+' : '-'}`}}
                </div>
              </div>
              <div class="q-pa-sm q-mr-xs q-ml-xs bg-grey-2" style="height: calc(100% - 20px); word-break: break-all; font-size: 0.85rem;">{{message.payload.toString()}}</div>
              <div class="q-pa-sm text-grey-7" style="word-break: break-all; font-size: 0.7rem;">{{JSON.stringify(message.properties)}}</div>
            </q-card>
          </virtual-list>
          <div v-else style="text-align: center; margin-top: 10px; font-size: 1.3rem; color: #333;">No messages</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="stylus">
  .f-btn
    min-height 36px
    padding 8px 16px 4px
    font-size 0.9rem
    font-weight 500
    width 384px
    text-align center
    text-transform uppercase
    display block
    line-height 24px

</style>

<script>
import mqtt from '../plugins/async-mqtt.js'
import VirtualList from 'vue-virtual-scroll-list'
import merge from 'lodash/merge'
import cloneDeep from 'lodash/cloneDeep'
import Vue from 'vue'

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
      currentSettings: cloneDeep(merge(defaultSettings, this.initSettings)),
      prevSettings: null,
      clients: [],
      statuses: [],
      activeClient: null,
      publishers: [],
      subscribers: [],
      subscribersStatuses: [false],
      subscribersTopics: [],
      subscribersMessages: [[]],
      subscribersMessagesBuffer: [[]],
      subscribeLoadingButton: [false],
      connectUserProperty: {
        value: '',
        name: ''
      },
      willConnectUserProperty: {
        value: '',
        name: ''
      },
      publishUserProperty: {
        value: '',
        name: ''
      },
      subscriberUserProperty: {
        value: '',
        name: ''
      },
      settingsModalModel: false,
      activeClientSettings: null,
      renderInterval: 0,
      messagesLimitCount: 1000,
      notResolvedMessages: []
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
    resolveTopics (topic, subTopic) {
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
    errorHandler (e) { console.log(e) },
    async createClient (index) {
      let config = this.currentSettings,
        key = typeof index === 'number' ? index : this.clients.length,
        endHandler = () => { Vue.set(this.statuses, key, false) },
        errorHandler = this.errorHandler
      if (!this.clients[key]) {
        this.clients[key] = {}
        this.statuses[key] = false
      } else {
        let clientObj = this.clients[key]
        if (clientObj.client) {
          await clientObj.client.end(true)
          this.statuses[key] = false
        }
      }
      Vue.set(this.clients[key], 'config', config)
      this.clients[key].subscribers = [cloneDeep(defaultSubscriber)]
      this.clients[key].publishers = [cloneDeep(defaultPublisher)]
      let client = mqtt.connect(config.host, this.clearObject(config))
      client.on('connect', () => {
        Vue.set(this.statuses, key, true)
        client.on('message', (topic, message, packet) => {
          let resolveFlag = false
          this.subscribersTopics.forEach((subTopic, index, topics) => {
            let isResolved = this.resolveTopics(topic, subTopic)
            resolveFlag = resolveFlag || isResolved
            if (topics.length - 1 === index) {
              console.log(`finite resolve ${resolveFlag}`)
              console.log(JSON.stringify(packet))
            }
            if (isResolved) {
              if (!this.subscribersMessagesBuffer[index]) {
                this.subscribersMessagesBuffer[index] = []
              }
              this.subscribersMessagesBuffer[index].push(packet)
            }
            if (topics.length - 1 === index && !resolveFlag) {
              this.notResolvedMessages.push(packet)
            }
          })
        })
      })
      client.on('error', errorHandler)
      client.on('close', endHandler)
      client.on('offline', endHandler)
      client.on('end', endHandler)
      Vue.set(this.clients[key], 'client', client)
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
        }
        this.clients.splice(key, 1)
      })
        .catch(() => {})
    },
    setActiveClient (key) {
      let client = this.clients[key]
      if (!client.client._client.connected) {
        this.errorHandler(new Error('Client not connected'))
        return false
      }
      this.subscribers = client.subscribers
      this.publishers = client.publishers
      this.activeClient = client
    },
    clearActiveClient () {
      this.subscribers.forEach((subscriber, index) => {
        let status = this.subscribersStatuses[index]
        if (status) {
          this.unsubscribeMessageHandler(index, subscriber)
        }
      })
      this.activeClient = null
      this.subscribers = []
      this.publishers = []
    },
    /* client logic end */
    /* pub/sub logic start */
    addPublisher () {
      this.publishers.push(cloneDeep(defaultPublisher))
    },
    addSubscriber () {
      this.subscribers.push(cloneDeep(defaultSubscriber))
      this.subscribersMessages.push([])
      this.subscribersStatuses.push(false)
      this.subscribeLoadingButton.push(false)
    },
    removePublisher (key) {
      this.publishers.splice(key, 1)
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
      this.subscribeLoadingButton.splice(key, 1)
      this.subscribersTopics = this.subscribers.map(sub => sub.topic)
      if (!this.subscribersTopics) {
        clearInterval(this.renderInterval)
      }
    },
    addPublishUserProperty (index) {
      if (!this.publishers[index].options.properties.userProperties) {
        this.publishers[index].options.properties.userProperties = {}
      }
      this.publishers[index].options.properties.userProperties[this.publishUserProperty.name] = this.publishUserProperty.value
      this.publishUserProperty = {
        value: '',
        name: ''
      }
    },
    removePublishUserProperty (index, name) {
      Vue.delete(this.publishers[index].options.properties.userProperties, name)
      if (!Object.keys(this.publishers[index].options.properties.userProperties).length) {
        this.publishers[index].options.properties.userProperties = null
      }
    },
    addSubscriberUserProperty (index) {
      if (!this.subscribers[index].options.properties.userProperties) {
        this.subscribers[index].options.properties.userProperties = {}
      }
      this.subscribers[index].options.properties.userProperties[this.subscriberUserProperty.name] = this.subscriberUserProperty.value
      this.subscriberUserProperty = {
        value: '',
        name: ''
      }
    },
    removeSubscriberUserProperty (index, name) {
      Vue.delete(this.subscribers[index].options.properties.userProperties, name)
      if (!Object.keys(this.subscribers[index].options.properties.userProperties).length) {
        this.subscribers[index].options.properties.userProperties = null
      }
    },
    async publishMessageHandler (settings) {
      settings = this.clearObject(settings)
      try {
        await this.activeClient.client.publish(settings.topic, settings.payload, settings.options)
      } catch (e) { this.errorHandler(e) }
    },
    async subscribeMessageHandler (key, settings) {
      if (!this.renderInterval) {
        this.renderInterval = setInterval(() => {
          this.subscribersMessagesBuffer.forEach((messages, index) => {
            if (this.limitingEnabled) {
              this.subscribersMessages[index].splice(0, messages.length)
            }
            this.subscribersMessages[index].splice(this.subscribersMessages[index].length, 0, ...messages)
          })
          this.subscribersMessagesBuffer = []
        }, 500)
      }
      settings = this.clearObject(settings)
      try {
        this.subscribeLoadingButton[key] = true
        Vue.set(this.subscribersStatuses, key, true)
        this.subscribersTopics = this.subscribers.map(sub => sub.topic)
        await this.activeClient.client.subscribe(settings.topic, settings.options)
        this.subscribeLoadingButton[key] = false
      } catch (e) {
        Vue.set(this.subscribersStatuses, key, false)
        this.subscribersTopics = this.subscribers.map(sub => sub.topic)
        this.errorHandler(e)
      }
    },
    async unsubscribeMessageHandler (key, settings) {
      try {
        await this.activeClient.client.unsubscribe(settings.topic)
        Vue.set(this.subscribersStatuses, key, false)
        Vue.set(this.subscribersMessages, key, [])
      } catch (e) { this.errorHandler(e) }
    }
    /* pub/sub logic end */
  },
  components: {
    VirtualList
  }
}
</script>
