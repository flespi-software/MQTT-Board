<template>
 <div class="absolute-full">
    <q-layout view="hhh LpR lff" container>
      <q-header reveal>
        <q-toolbar :class="{[`bg-${color}`]: true, 'text-white': !!color}"  style="position: absolute; z-index: 1">
          <q-btn round v-if="activeClient && clientsCloseable" flat dense icon="mdi-close" @click="clearActiveClient"/>
          <q-toolbar-title>
            <img v-if="!activeClient && whiteLabel === ''" src="mqttboard.png" alt="MQTT Board" style="height: 30px">
            <span v-if="activeClient">
              {{`${activeClient.config.clientName || activeClient.config.clientId}`}}
              <q-tooltip v-if="activeClient.config.clientName">{{`${activeClient.config.clientId}`}}</q-tooltip>
            </span>
            <span v-else>
              {{whiteLabel || 'MQTT Board'}}
            </span>
            <sup v-if="activeClient && $q.platform.is.desktop" style="border-radius: 5px;font-size: .6rem; padding: 2px; min-width: 15px; top: 5px;" :class="[`bg-${activeClient.status ? 'green': 'red'}`]" class="absolute">{{activeClient.status ? 'online': 'offline'}}</sup>
            <sub v-if="activeClient && $q.platform.is.desktop && activeClient.cid" style="border-radius: 5px;font-size: .7rem; padding: 2px;" title="cid">{{activeClient.cid}}</sub>
            <sup v-if="!activeClient && whiteLabel === ''" style="position: relative; font-size: .9rem; padding-left: 4px">{{version}}</sup>
          </q-toolbar-title>
          <q-btn round flat dark v-if="activeClient" icon="mdi-cog" @click.stop="editClientHandler(activeClient.id)"/>
          <q-btn round flat v-if="activeClient" icon="mdi-plus">
            <q-menu anchor="bottom right" self="top right" content-class="mqtt-board__popup">
              <q-list>
                <q-item-label header>Add pane</q-item-label>
                <q-item v-close-popup @click="addPublisher()" clickable v-ripple>
                  <q-item-section avatar><q-icon name="mdi-publish" /></q-item-section>
                  <q-item-section><q-item-label>Publisher</q-item-label></q-item-section>
                </q-item>
                <q-item v-close-popup @click="addSubscriber()" clickable v-ripple>
                  <q-item-section avatar><q-icon name="mdi-arrow-down-bold" /></q-item-section>
                  <q-item-section><q-item-label>Subscriber</q-item-label></q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-btn>
          <q-btn round flat dark v-if="activeClient" icon="mdi-menu" @click.stop="drawerRight = !drawerRight"/>
          <q-btn v-if="!activeClient && !whiteLabel" dense flat @click="openURL('https://github.com/flespi-software/MQTT-Board')" color="white" icon="mdi-github" style="margin-right: 60px" :label="$q.platform.is.mobile ? '' : 'Fork me!'"/>
        </q-toolbar>
        <q-btn fab v-if="!activeClient" @click.native="addClientHandler" icon="mdi-plus" :color="accentColor" style="position: absolute; right: 16px; top: 21px; z-index: 2;"/>
      </q-header>

      <q-drawer
        side="right"
        v-if="activeClient"
        v-model="drawerRight"
        bordered
        :breakpoint="500"
        content-class="bg-grey-3 absolute"
      >
        <entities-menu
           class="full-width relative-position" style="height: calc(100% - 98px); top: 50px;"
          :entities="menuEnitites"
          :active="[firstViewedPanelIndex, firstViewedPanelIndex + colsCount - 1]"
          @pick="pickEntity"
          @subscriber:play="index => subscribeMessageHandler(activeClient.id, index)"
          @subscriber:stop="index => unsubscribeMessageHandler(activeClient.id, index)"
          @publish="publishFreeMessage"
        />
        <template v-if="needCloseAll">
          <q-btn color="grey-7" unelevated @click="needCloseAll = false" label="Close" class="absolute-bottom" style="bottom: 7px; left: 4px; width: calc(50% - 8px);"/>
          <q-btn color="red" unelevated @click="() => { closeAllHandler(), needCloseAll = false }" label="remove" class="absolute-bottom" style="bottom: 7px; left: calc(50% + 4px); width: calc(50% - 8px);"/>
        </template>
        <q-btn v-else color="red" :disable="!subscribers.length && !publishers.length" unelevated @click="needCloseAll = true" label="remove all" class="absolute-bottom" style="bottom: 7px; left: 4px; width: calc(100% - 8px);"/>
      </q-drawer>

      <q-page-container>
        <q-page>
          <div>
            <publisher-modal
              v-if="republishMessage"
              ref="publisherModal"
              :message="republishMessage"
              :version="activeClient.config.protocolVersion"
              @publish="publishFreeMessage"
              @hide="republishMessage = null"
            />
            <client-settings-modal
              v-if="settingsModalModel"
              :color="color"
              :secure="secure"
              :settings="editedClientId !== null ? clients[editedClientId].config : {}"
              :initSettings="initSettings"
              @save="saveSettingsHandler"
              @close="closeSettingsHandler"
            />
            <div v-if="!activeClient" class="absolute scroll" style="top:50px; left: 0; right: 0; bottom: 0;">
              <div v-if="Object.keys(clients).length" class="mqtt-clients row q-pt-md">
                <div class="client__item q-pt-md q-px-md cursor-pointer col-xl-3 col-md-4 col-sm-6 col-xs-12" v-for="(client, index) in clients" :key="index">
                  <q-card :class="{'bg-red-2': !statuses[index], 'bg-green-2': statuses[index]}" @click.native="setActiveClient(index)">
                    <q-card-section class="q-py-sm">
                      <div class="ellipsis q-mb-xs" style="font-size: 18px; line-height: 18px; min-height: 18px;">{{client.config.clientName || client.config.clientId}}</div>
                      <div class="ellipsis text-grey-9" style="font-size: 14px; line-height: 14px; min-height: 14px;">{{client.config.clientName ? client.config.clientId : ''}}</div>
                      <div class="text-grey-9 q-mt-sm">{{client.config.host}}</div>
                    </q-card-section>
                    <q-separator />
                    <q-card-actions align="right">
                      <q-btn round flat v-if="client.client" size=".7rem" icon="mdi-stop" :loading="!!client.client && !statuses[index] && client.inited" @click.stop="disconnectClientHandler(index)">
                        <div slot="loading" @click.stop>
                          <q-spinner />
                        </div>
                        <q-tooltip>Deactivate client</q-tooltip>
                      </q-btn>
                      <q-btn round flat v-else size=".7rem" icon="mdi-play" @click.stop="connectClientHandler(index)">
                        <q-tooltip>Activate client</q-tooltip>
                      </q-btn>
                      <q-btn round flat size=".7rem" icon="mdi-cog" @click.stop="editClientHandler(index)"/>
                      <q-btn round flat size=".7rem" icon="mdi-delete" @click.stop="deleteClientHandler(index)"/>
                    </q-card-actions>
                  </q-card>
                </div>
              </div>
              <div v-else class="text-center q-mt-lg text-grey-9 text-weight-bold" style="font-size: 2.5rem;">
                <div>No clients</div>
                <q-btn v-if="!activeClient" @click.native="addClientHandler">Create client</q-btn>
              </div>
            </div>
            <div v-else-if="renderedEntities.length">
              <div ref="wrapper" v-touch-swipe.horizontal="swipeHandler" @scroll="wrapperScroll" class="no-wrap row client__wrapper">
                <q-resize-observer @resize="onWrapperResize" :debounce="0" />
                <template v-for="(entity, index) in renderedEntities">
                  <publisher
                    :class='[`col-${12 / colsCount}`]'
                    ref="entities"
                    v-if="entity.type === 'publisher'"
                    :key="`publ${entity.id}`"
                    :value="publishers[entity.index]"
                    @input="(val) => { inputPublisher(entity.index, val) }"
                    :version="activeClient.config.protocolVersion"
                    @remove="removePublisher(entity.index)"
                    @publish="publishMessageHandler(activeClient.id, entity.index)"
                    @hide="$set(entity, 'rendered', false)"
                  />
                  <subscriber
                    :class='[`col-${12 / colsCount}`]'
                    ref="entities"
                    v-else-if="entity.type === 'subscriber'"
                    :key="`subs${entity.id}`"
                    :value="subscribers[entity.index]"
                    @input="(val) => { inputSubscriber(entity.index, val) }"
                    :status="subscribersStatuses[entity.index]"
                    :subscribed="subscribersConnectivityStatuses[entity.index]"
                    :messages="subscribersMessages[entity.index]"
                    :client="activeClient"
                    @remove="removeSubscriber(entity.index)"
                    @subscribe="subscribeMessageHandler(activeClient.id, entity.index)"
                    @unsubscribe="unsubscribeMessageHandler(activeClient.id, entity.index)"
                    @play="playSubscriberHandler(entity.index)"
                    @pause="pauseSubscriberHandler(entity.index)"
                    @clear="clearMessagesHandler(entity.index)"
                    @action-send="sendFromSubscriberHandler"
                    @hide="$set(entity, 'rendered', false)"
                  />
                  <unresolved
                    :class='[`col-${12 / colsCount}`]'
                    ref="entities"
                    v-else-if="entity.type === 'unresolved'"
                    :key="`unresolved${index}`"
                    :messages="notResolvedMessages"
                    @clear="clearUnresolvedMessages"
                    @hide="$set(entity, 'rendered', false)"
                  />
                  <logs
                    :class='[`col-${12 / colsCount}`]'
                    ref="entities"
                    v-else-if="entity.type === 'logs'"
                    :key="`subs${index}`"
                    :logs="activeClient.logs"
                    @clear="clearLogs"
                    @hide="$set(entity, 'rendered', false)"
                  />
                </template>
              </div>
              <slider-controller
                :entities="renderedEntities"
                :buttons-disable="{
                  prev: firstViewedPanelIndex === 0,
                  next: entities.length - colsCount === firstViewedPanelIndex
                }"
                :active="[firstViewedPanelIndex, firstViewedPanelIndex + colsCount - 1]"
                @swipe="direction => swipeHandler({ direction })"
                @swipe-to="scrollToEntity"
              />
            </div>
            <div v-else-if="!renderedEntities.length" class="text-center q-mt-lg text-grey-9 text-weight-bold absolute" style="font-size: 2.5rem; top: 50px; bottom: 0; left: 0; right: 0;">No active entities</div>
            <div v-else-if="!statuses[activeClient.id]" class="text-center q-mt-lg text-grey-9 text-weight-bold absolute" style="font-size: 2.5rem; top: 50px; bottom: 0; left: 0; right: 0;">
              <div>Сlient is disconnected</div>
            </div>
          </div>
        </q-page>
      </q-page-container>
    </q-layout>
  </div>
</template>

<style lang="stylus">
  .q-textarea--fix
    &.q-textarea.q-field--labeled textarea.q-field__native
      min-height 27px
  .client__item:last-child
    margin-bottom 16px
  .client__wrapper
    position absolute
    top 50px
    bottom 50px
    left 0
    right 0
    overflow hidden
</style>

<script>
import mqtt from '../boot/async-mqtt.js'
import merge from 'lodash/merge'
import cloneDeep from 'lodash/cloneDeep'
import get from 'lodash/get'
import debounce from 'lodash/debounce'
import { LocalStorage, openURL } from 'quasar'
import animate from '../mixins/animate'
import migrations from '../mixins/migrations'
import Subscriber from './Subscriber.vue'
import Publisher from './Publisher.vue'
import Unresolved from './Unresolved.vue'
import Logs from './Logs.vue'
import PublisherModal from './PublisherModal.vue'
import ClientSettingsModal from './ClientSettingsModal'
import SliderController from './SliderController'
import EntitiesMenu from './EntitiesMenu'
import { version } from '../../package.json'
import validateEntities from '../mixins/validateEntities.js'
import { defaultSettings, defaultSubscriber, defaultPublisher } from '../mixins/defaults.js'
import jsonTreeByMessages from '../mixins/jsonTreeByMessages.js'
import SelectorsAsync from './selectors/async'

const
  makeExportClients = (clients) => {
    return Object.keys(clients).map(clientId => {
      const client = clients[clientId]
      return {
        appVersion: version,
        status: client.status,
        config: client.config,
        publishers: client.publishers,
        subscribers: client.subscribers,
        entities: client.entities.filter(entity => entity.type !== 'unresolved'),
        subscribersStatuses: client.subscribersStatuses,
        subscribersConnectivityStatuses: client.subscribersConnectivityStatuses
      }
    })
  },
  saveClientsToLocalStorage = debounce((clients) => {
    LocalStorage.set(MQTT_BOARD_LOCALSTORAGE_NAME, makeExportClients(clients))
  }, 500, { trailing: true })

const
  MQTT_BOARD_LOCALSTORAGE_NAME = 'clients',
  CLIENT_STATUS_ACTIVE = true,
  CLIENT_STATUS_INACTIVE = false,
  CLIENT_STATUS_USER_INACTIVE = null

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
    clientsCloseable: {
      type: Boolean,
      default: true
    },
    secure: {
      type: Boolean,
      default: true
    },
    color: {
      type: String,
      default: 'grey-9'
    },
    accentColor: {
      type: String,
      default: 'light-blue-7'
    },
    initEntities: {
      type: Array,
      default () {
        return [
          {
            type: 'subscriber',
            rendered: true,
            settings: cloneDeep(defaultSubscriber)
          },
          {
            type: 'publisher',
            settings: cloneDeep(defaultPublisher),
            rendered: true
          }
        ]
      },
      validator (entities) {
        return entities.reduce((result, entity, index) => {
          if (!validateEntities.methods.validateEntity(entity)) {
            return result && false
          }
          return result && true
        }, true)
      }
    },
    configuredClients: {
      type: Array,
      default () { return [] },
      validator (clients) {
        let result = true
        clients.forEach(client => {
          if (!client.config || !client.entities || !client.publishers || !client.subscribers) {
            result = false
            return false
          }
          result = result && validateEntities.methods.validateSettings(client.config)
          client.entities.forEach(entity => {
            result = result && validateEntities.methods.validateEntityRecord(entity)
          })
          client.publishers.forEach(publisher => {
            result = result && validateEntities.methods.validatePublisher(publisher)
          })
          client.subscribers.forEach(subscriber => {
            result = result && validateEntities.methods.validateSubscriber(subscriber)
          })
        })
        return result
      }
    }
  },
  data () {
    return {
      version: version,
      drawerRight: this.$q.platform.is.desktop,
      clients: {},
      statuses: {},
      activeClient: null,
      entities: [],
      publishers: [],
      subscribers: [],
      subscribersStatuses: [false],
      subscribersConnectivityStatuses: [false],
      subscribersMessages: [[]],
      subscribersMessagesBuffer: [[]],
      settingsModalModel: false,
      editedClientId: null,
      renderInterval: 0,
      messagesLimitCount: 3000,
      notResolvedMessages: [],
      isNeedScroll: false,
      isInited: false,
      republishMessage: null,
      wrapperWidth: 0,
      firstViewedPanelIndex: 0,
      needCloseAll: false
    }
  },
  computed: {
    renderedEntities () {
      const renderedEntities = []
      for (const entity of this.entities) {
        if (entity.rendered || entity.rendered === undefined) {
          const entityWithConfig = entity
          if (entity.type === 'publisher') {
            entityWithConfig.config = this.publishers[entity.index]
          } else if (entity.type === 'subscriber') {
            entityWithConfig.config = this.subscribers[entity.index]
          }
          renderedEntities.push(entityWithConfig)
        }
      }
      return renderedEntities
    },
    menuEnitites () {
      const menu = []
      for (const entity of this.entities) {
        const menuEntity = { ...entity }
        if (entity.type === 'subscriber') {
          menuEntity.settings = this.subscribers[entity.index]
          menuEntity.status = this.subscribersStatuses[entity.index]
        } else if (entity.type === 'publisher') {
          menuEntity.settings = this.publishers[entity.index]
        }
        menu.push(menuEntity)
      }
      return menu
    },
    colsCount () {
      return this.getColsCount(this.wrapperWidth)
    }
  },
  methods: {
    openURL: openURL,
    getColsCount (wrapperWidth) {
      const panelMinWidth = 350
      let panelsMinCount = Math.floor(wrapperWidth / panelMinWidth)
      panelsMinCount = 12 / Math.ceil(12 / panelsMinCount)
      if (panelsMinCount > this.renderedEntities.length) {
        panelsMinCount = this.renderedEntities.length
      }
      const colsCount = this.wrapperWidth < 600 ? 1 : panelsMinCount
      return colsCount
    },
    /* settings modal handlers start */
    closeSettingsHandler () {
      this.settingsModalModel = false
      this.editedClientId = null
    },
    saveSettingsHandler (settings) {
      this.createClient(settings, this.editedClientId)
    },
    /* settings modal handlers end */
    /* client logic start */
    clearObject (obj) {
      return Object.keys(obj).reduce((result, key) => {
        let value = obj[key]
        if (value instanceof Object && !Array.isArray(value)) {
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
      const subscriptionIdentifiers = get(subscription, 'options.properties.subscriptionIdentifier', undefined),
        packetSubIdentifiers = get(packet, 'properties.subscriptionIdentifier', undefined)
      if (packetSubIdentifiers && subscriptionIdentifiers) {
        if (
          (typeof packetSubIdentifiers === 'number' && packetSubIdentifiers === subscriptionIdentifiers) ||
          (Array.isArray(packetSubIdentifiers) && packetSubIdentifiers.includes(subscriptionIdentifiers))
        ) {
          return true
        } else {
          return false
        }
      } else if (this.resolveTopics(packet.topic, subscription.topic)) {
        return true
      } else {
        return false
      }
    },
    resolveSubscriptions (packet, subscriptions, statuses) {
      return subscriptions.reduce((res, subscription, index) => {
        if (statuses[index] && this.resolveSubscription(packet, subscription)) {
          res.push(index)
        }
        return res
      }, [])
    },
    getSharedTopicFilter (topic) {
      return topic.replace(/^\$share\/[^/]+\//, '')
    },
    resolveTopics (topic, subTopic) {
      if (subTopic.indexOf('$share') === 0) {
        subTopic = this.getSharedTopicFilter(subTopic)
      }
      const subTopicPath = subTopic.split('/'),
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
      const clientObj = this.clients[key]
      clientObj.logs.push({ type: 'error', data: { error: e }, timestamp: Date.now() })
      if (needShow) {
        this.showError(e)
      }
    },
    showError (e) {
      this.$q.notify({
        message: `<div class="text-center" style="font-size: 1.2rem;">${e.message}</div>`,
        html: true,
        color: 'negative',
        icon: 'mdi-alert-outline',
        timeout: 2000
      })
    },
    saveClients () {
      if (!this.isInited) { return false }
      this.$emit('change', makeExportClients(this.clients))
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
    setClientStatus (key, status) {
      if (!this.clients[key]) { return false }
      if (this.clients[key].status === CLIENT_STATUS_USER_INACTIVE && !status) { return false }
      this.$set(this.statuses, key, status)
      this.$set(this.clients[key], 'status', status)
    },
    messageProcessing (packet, clientId) {
      packet.payload = packet.payload.toString()
      try {
        packet.payload = JSON.parse(packet.payload)
      } catch (e) {}
      const clientObj = this.clients[clientId]
      /* if subscribersStatuses contains true or paused statuses */
      if (clientObj.subscribersStatuses.length && clientObj.subscribersStatuses.filter(status => !!status).length) {
        const activeSubscriptionsIndexes = this.resolveSubscriptions(packet, clientObj.subscribers, clientObj.subscribersStatuses),
          isResolved = !!activeSubscriptionsIndexes.length
        if (isResolved) {
          activeSubscriptionsIndexes.forEach((index) => {
            if (clientObj.subscribersStatuses[index] === true) {
              clientObj.subscribersMessagesBuffer[index].push(packet)
            } else if (clientObj.subscribersStatuses[index] === 'paused') {
              if (clientObj.subscribers[index].missedMessages === undefined) {
                clientObj.subscribers[index].missedMessages = 0
              }
              clientObj.subscribers[index].missedMessages++
            }
          })
        } else {
          if (!clientObj.notResolvedFlagInit) {
            this.$set(clientObj, 'notResolvedFlagInit', true)
            this.entities.push({ type: 'unresolved', rendered: false })
          }
          clientObj.notResolvedMessages.push(packet)
        }
      } else {
        clientObj.subscribers.filter((sub, index) => {
          if (this.resolveSubscription(packet, sub) && !clientObj.subscribersConnectivityStatuses[index]) {
            if (!clientObj.notResolvedFlagInit) {
              this.$set(clientObj, 'notResolvedFlagInit', true)
              this.entities.push({ type: 'unresolved', rendered: false })
            }
            clientObj.notResolvedMessages.push(packet)
          }
        })
      }
    },
    initClient (key, config) {
      const clientObj = this.clients[key]
      const endHandler = () => {
        this.setClientStatus(key, CLIENT_STATUS_INACTIVE)
      }
      const client = mqtt.connect(config.host, config)

      /* resubscribe to exists topics */
      client.on('connect', (connack) => {
        const currentStatuses = clientObj.subscribersStatuses,
          subscribers = clientObj.subscribers,
          /* flespi feature */
          existedSubscriptionsInSession = connack.properties && connack.properties.userProperties && connack.properties.userProperties.subscriptions ? JSON.parse(connack.properties.userProperties.subscriptions) : []
        subscribers.forEach((subscriber, index) => {
          const status = currentStatuses[index],
            exitedSubscriptionIndex = existedSubscriptionsInSession.findIndex(subscription => subscription.topic === subscriber.topic),
            isSubscriptionExited = exitedSubscriptionIndex !== -1
          if (isSubscriptionExited && !status) {
            this.$set(currentStatuses, index, true)
          } else if (!isSubscriptionExited && status) {
            if (subscriber.mode === 0) {
              clientObj.messages[index].splice(0, clientObj.messages[index].length)
            } else {
              const tree = clientObj.messages[index]
              const treeKeys = Object.keys(tree)
              treeKeys.forEach(key => {
                this.$delete(tree, key)
              })
            }
            clientObj.subscribersMessagesBuffer[index] = []
            this.subscribe(key, index)
          }
          if (isSubscriptionExited) {
            existedSubscriptionsInSession.splice(exitedSubscriptionIndex, 1)
          }
        })
        /* restore subscriptions by broker */
        existedSubscriptionsInSession.forEach(subscription => {
          this.addSubscriber(undefined, key)
          const id = subscribers.length - 1,
            subscriber = subscribers[id]
          // update subscriber options by subscription
          const options = {
            nl: subscription.no_local,
            rap: subscription.rap,
            rh: subscription.retain_handling,
            qos: subscription.qos,
            properties: {}
          }
          if (subscription.subscription_id) {
            options.subscriptionIdentifier = subscription.subscription_id
          }
          this.$set(subscriber, 'options', options)
          this.$set(subscriber, 'topic', subscription.topic)
          this.$set(currentStatuses, id, true)
          const grants = [{
            nl: subscription.no_local,
            rap: subscription.rap,
            rh: subscription.retain_handling,
            qos: subscription.qos,
            topic: subscription.topic
          }]
          this.$nextTick(() => { clientObj.logs.push({ type: 'subscribe', data: { grants, restored: true }, timestamp: Date.now() }) })
        })
      })
      client.on('connect', () => {
        this.setClientStatus(key, CLIENT_STATUS_ACTIVE)
      })
      client.on('connect', (connack) => {
        /* client connect logs push */
        clientObj.logs.push({ type: 'connect', data: { ...connack }, timestamp: Date.now() })
      })
      client.once('connect', (connack) => {
        this.$set(clientObj, 'cid', this.getCid(connack))
        this.$set(clientObj, 'inited', true)
        this.activateRender()
        let messageBuffer = []
        clientObj.processTimer = setInterval(() => {
          messageBuffer.forEach((message) => { this.messageProcessing(message, key) })
          messageBuffer = []
        }, 500)
        client.on('message', (topic, message, packet) => {
          messageBuffer.push(packet)
        })
      })
      client.on('error', (error) => {
        this.errorHandler(key, error, false)
      })
      client.on('disconnect', (closePacket) => {
        if (closePacket.reasonCode === 143) {
          clientObj.subscribersStatuses.forEach((status, index) => {
            if (status) {
              this.$delete(clientObj.client._client._resubscribeTopics, clientObj.subscribers[index].topic)
              this.$set(clientObj.subscribersStatuses, index, false)
              this.$set(clientObj.subscribersConnectivityStatuses, index, false)
            }
          })
        }
        clientObj.logs.push({ type: 'disconnect', data: { ...closePacket }, timestamp: Date.now() })
        endHandler()
      })
      client.on('close', () => {
        clientObj.logs.push({ type: 'disconnect', timestamp: Date.now() })
        endHandler()
      })
      client.on('offline', () => {
        this.$set(clientObj, 'inited', false)
        clientObj.logs.push({ type: 'offline', timestamp: Date.now() })
        endHandler()
      })
      client.on('end', () => {
        clientObj.logs.push({ type: 'end', timestamp: Date.now() })
        endHandler()
      })
      client.on('reconnect', () => {
        this.$set(clientObj, 'inited', true)
        clientObj.logs.push({ type: 'reconnect', timestamp: Date.now() })
      })
      this.$set(this.clients[key], 'client', client)
      this.makeFlespiRestBus(key)
    },
    async createClient (settings, index) {
      const config = this.createConnectPacket(settings),
        isClientExists = typeof index === 'string' || typeof index === 'number',
        key = isClientExists
          ? index
          : Object.keys(this.clients).reduce((result, id) => result > parseInt(id) ? result : parseInt(id), -1) + 1
      /* init new client */
      if (!this.clients[key]) {
        const client = {}
        client.id = key
        client.status = false
        this.createInitEntities(client)
        client.logs = [{ type: 'created', data: { ...config }, timestamp: Date.now() }]
        client.notResolvedMessages = []
        this.clients[key] = client
      } else {
        const clientObj = this.clients[key]
        if (clientObj.client) {
          if (clientObj.processTimer) {
            clearInterval(clientObj.processTimer)
          }
          this.destroyClient(clientObj.client)
          this.setClientStatus(key, CLIENT_STATUS_INACTIVE)
        }
        clientObj.logs.push({ type: 'updated', data: { ...config }, timestamp: Date.now() })
      }
      if (this.statuses[key] !== CLIENT_STATUS_USER_INACTIVE) {
        this.initClient(key, config)
      }
      this.$set(this.clients[key], 'config', config)
      this.saveClients()
    },
    initExternalClients (savedClients) {
      if (savedClients) {
        savedClients.forEach(client => {
          client = this.migrateClient(client)
          const key = Object.keys(this.clients).length
          const currentClient = {}
          currentClient.config = client.config
          currentClient.id = key
          currentClient.client = null
          currentClient.status = client.status
          currentClient.publishers = client.publishers
          currentClient.subscribers = client.subscribers
          currentClient.entities = client.entities.map((entity, index) => {
            if (entity.rendered === undefined) {
              entity.rendered = true
            }
            return entity
          })
          if (currentClient.entities[0].type !== 'logs') {
            currentClient.entities.unshift({ type: 'logs', rendered: true })
          }
          currentClient.messages = new Array(client.subscribers.length)
          currentClient.subscribersMessagesBuffer = new Array(client.subscribers.length)
          for (let i = 0; i < client.subscribers.length; i++) {
            currentClient.messages[i] = client.subscribers[i].mode ? {} : []
            currentClient.subscribersMessagesBuffer[i] = []
          }
          if (client.subscribersStatuses) {
            currentClient.subscribersStatuses = client.subscribersStatuses
          } else {
            currentClient.subscribersStatuses = new Array(client.subscribers.length)
            currentClient.subscribersStatuses.fill(false)
          }
          if (client.subscribersConnectivityStatuses) {
            currentClient.subscribersConnectivityStatuses = client.subscribersConnectivityStatuses
          } else {
            currentClient.subscribersConnectivityStatuses = new Array(client.subscribers.length)
            currentClient.subscribersConnectivityStatuses.fill(false)
          }
          currentClient.logs = [{ type: 'created', data: { ...client.config }, timestamp: Date.now() }]
          currentClient.notResolvedMessages = []
          this.$set(this.statuses, key, client.status)
          this.$set(this.clients, key, currentClient)
          if (client.status !== CLIENT_STATUS_USER_INACTIVE) {
            this.initClient(key, this.createConnectPacket(client.config))
          }
        })
      }
    },
    createInitEntities (client) {
      const entities = this.initEntities
      client.subscribers = []
      client.publishers = []
      client.entities = []
      client.messages = []
      client.subscribersMessagesBuffer = []
      client.subscribersStatuses = []
      client.subscribersConnectivityStatuses = []
      client.entities.push({ type: 'logs', rendered: true })
      entities.forEach((entity, index) => {
        switch (entity.type) {
          case 'subscriber': {
            client.subscribers.push(cloneDeep(merge({}, defaultSubscriber, entity.settings)))
            client.messages.push(entity.settings.mode ? {} : [])
            client.subscribersMessagesBuffer.push([])
            client.subscribersStatuses.push(false)
            client.subscribersConnectivityStatuses.push(false)
            client.entities.push({ type: 'subscriber', rendered: entity.rendered, index: client.subscribers.length - 1, id: Math.random().toString(16).substr(2, 8) })
            break
          }
          case 'publisher': {
            client.publishers.push(cloneDeep(merge({}, defaultPublisher, entity.settings)))
            client.entities.push({ type: 'publisher', rendered: entity.rendered, index: client.publishers.length - 1, id: Math.random().toString(16).substr(2, 8) })
            break
          }
          default: {
            this.showError(new Error(`Unknown type of entity: ${entity.type}`))
          }
        }
      })
    },
    addClientHandler () {
      this.settingsModalModel = true
    },
    editClientHandler (key) {
      this.editedClientId = key
      this.settingsModalModel = true
    },
    connectClientHandler (key) {
      const clientObj = this.clients[key]
      if (clientObj.client) {
        clientObj.processTimer && clearInterval(clientObj.processTimer)
        this.destroyClient(clientObj.client)
        this.setClientStatus(key, CLIENT_STATUS_INACTIVE)
      }
      this.initClient(key, clientObj.config)
      this.saveClients()
    },
    destroyClient (client) {
      client.removeAllListeners(['reconnect', 'end', 'offline', 'close', 'disconnect', 'error', 'message', 'connect'])
      return client.end(true)
    },
    async disconnectClientHandler (key) {
      const clientObj = this.clients[key]
      clientObj.processTimer && clearInterval(clientObj.processTimer)
      this.setClientStatus(key, CLIENT_STATUS_USER_INACTIVE)
      await this.destroyClient(clientObj.client)
      clientObj.client = null
      this.saveClients()
    },
    deleteClientHandler (key) {
      const clientObj = this.clients[key]
      this.$q.dialog({
        title: 'Confirm',
        message: `Do you really want to delete client for ${clientObj.config.clientId}?`,
        cancel: true,
        ok: true
      }).onOk(() => {
        clientObj.processTimer && clearInterval(clientObj.processTimer)
        if (clientObj.client) {
          this.destroyClient(clientObj.client)
            .then(() => {
              this.$delete(this.statuses, key)
              this.$delete(this.clients, key)
              this.saveClients()
            })
        } else {
          this.$delete(this.statuses, key)
          this.$delete(this.clients, key)
          this.saveClients()
        }
      })
        .onCancel(() => {})
    },
    activateRender () {
      if (!this.renderInterval) {
        this.renderInterval = setInterval(() => {
          Object.values(this.clients).forEach((client) => {
            client.subscribersMessagesBuffer.forEach((messages, index) => {
              if (!messages.length) { return false }
              const subscriber = client.subscribers[index]
              const savedMessages = client.messages[index]
              if (subscriber.mode === 0) {
                if (savedMessages) {
                  messages = messages.splice(-this.messagesLimitCount)
                  savedMessages.splice(savedMessages.length, 0, ...messages)
                  savedMessages.splice(0, savedMessages.length - this.messagesLimitCount)
                }
                client.subscribersMessagesBuffer[index] = []
              } else {
                if (client.subscribersStatuses[index] && client.subscribersConnectivityStatuses[index]) {
                  jsonTreeByMessages(messages, client.config.protocolVersion === 5 && subscriber.treeField ? subscriber.treeField : '', savedMessages)
                  client.subscribersMessagesBuffer[index] = []
                }
              }
            })
          })
        }, 500)
      }
    },
    setActiveClient (key) {
      const client = this.clients[key]
      if (!client) {
        this.showError('No current client')
        return false
      }
      this.entities = client.entities
      this.subscribers = client.subscribers
      this.publishers = client.publishers
      this.subscribersMessages = client.messages
      this.subscribersMessagesBuffer = client.subscribersMessagesBuffer
      this.notResolvedMessages = client.notResolvedMessages
      this.subscribersStatuses = client.subscribersStatuses
      this.subscribersConnectivityStatuses = client.subscribersConnectivityStatuses
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
      this.subscribersConnectivityStatuses = []
    },
    /* client logic end */
    /* pub/sub logic start */
    findEntity (obj) {
      return this.entities.findIndex((entity) => {
        return obj.type === entity.type && obj.index === entity.index
      })
    },
    addPublisher (config) {
      config = merge({}, defaultPublisher, config)
      this.publishers.push(cloneDeep(config))
      const publisher = { type: 'publisher', rendered: true, index: this.publishers.length - 1, id: Math.random().toString(16).substr(2, 8) }
      if (this.activeClient.notResolvedFlagInit) {
        this.entities.splice(-1, 0, publisher)
      } else {
        this.entities.push(publisher)
      }
      this.saveClients()
      this.isNeedScroll = true
    },
    addSubscriber (config, clientId) {
      clientId = typeof clientId === 'number' || typeof clientId === 'string'
        ? clientId
        : this.activeClient.id
      const clientObj = this.clients[clientId]
      config = merge({}, defaultSubscriber, config)
      clientObj.subscribers.push(cloneDeep(config))
      clientObj.messages.push([])
      clientObj.subscribersMessagesBuffer.push([])
      clientObj.subscribersStatuses.push(false)
      clientObj.subscribersConnectivityStatuses.push(false)
      const subscriber = { type: 'subscriber', rendered: true, index: clientObj.subscribers.length - 1, id: Math.random().toString(16).substr(2, 8) }
      if (this.activeClient.notResolvedFlagInit) {
        this.entities.splice(-1, 0, subscriber)
      } else {
        clientObj.entities.push(subscriber)
      }
      this.saveClients()
      if (this.activeClient) { this.isNeedScroll = true }
    },
    removePublisher (key) {
      this.publishers.splice(key, 1)
      this.entities.splice(this.findEntity({ type: 'publisher', index: key }), 1)
      this.entities.forEach(entity => {
        if (entity.type === 'publisher' && entity.index > key) {
          entity.index--
        }
      })
      this.saveClients()
    },
    async removeSubscriber (subscriberIndex) {
      const status = this.subscribersStatuses[subscriberIndex]
      if (status) {
        await this.unsubscribeMessageHandler(this.activeClient.id, subscriberIndex)
      }
      this.subscribers.splice(subscriberIndex, 1)
      this.clients[this.activeClient.id].subscribersStatuses.splice(subscriberIndex, 1)
      this.subscribersConnectivityStatuses.splice(subscriberIndex, 1)
      this.subscribersMessages.splice(subscriberIndex, 1)
      this.entities.splice(this.findEntity({ type: 'subscriber', index: subscriberIndex }), 1)
      this.entities.forEach(entity => {
        if (entity.type === 'subscriber' && entity.index > subscriberIndex) {
          entity.index--
        }
      })
      this.saveClients()
    },
    inputSubscriber (index, val) {
      this.$set(this.subscribers, index, val)
      this.saveClients()
    },
    inputPublisher (index, val) {
      this.$set(this.publishers, index, val)
      this.saveClients()
    },
    async publishMessageHandler (clientKey, publisherIndex) {
      await this.publishFreeMessage(this.publishers[publisherIndex])
    },
    async publishFreeMessage (settings) {
      settings = this.clearObject(settings)
      try {
        await this.activeClient.client.publish(settings.topic, settings.payload, settings.options)
        this.$q.notify({
          message: `<div class="text-center" style="font-size: 1.2rem;">Published successfuly in topic ${settings.topic}</div>`,
          html: true,
          color: 'positive',
          timeout: 700
        })
      } catch (e) {
        if (this.activeClient.status) {
          this.errorHandler(this.activeClient.id, e, true)
        } else {
          this.errorHandler(this.activeClient.id, new Error('Client disconnected'), true)
        }
      }
    },
    async subscribeMessageHandler (clientKey, subscriberIndex) {
      const settings = this.clearObject(this.subscribers[subscriberIndex])
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
        this.$set(this.subscribersMessages, subscriberIndex, settings.mode === 1 ? {} : [])
      }
      await this.subscribe(clientKey, subscriberIndex)
    },
    async subscribe (clientKey, subscriberIndex) {
      const clientObj = this.clients[clientKey],
        settings = this.clearObject(clientObj.subscribers[subscriberIndex])
      try {
        this.$set(this.clients[clientKey].subscribersStatuses, subscriberIndex, true)
        this.$set(this.clients[clientKey].subscribersConnectivityStatuses, subscriberIndex, false)
        const grants = await clientObj.client.subscribe(settings.topic, settings.options)
        this.$set(this.clients[clientKey].subscribersConnectivityStatuses, subscriberIndex, true)
        if (grants.length) {
          clientObj.logs.push({ type: 'subscribe', data: { settings, grants }, timestamp: Date.now() })
          if ((grants[0].qos & 0x80) > 0) {
            throw new Error(`Subscription error ${grants[0].qos}`)
          }
        }
      } catch (e) {
        this.$set(this.clients[clientKey].subscribersStatuses, subscriberIndex, false)
        this.$set(this.clients[clientKey].subscribersConnectivityStatuses, subscriberIndex, false)
        if (clientObj.status) {
          this.errorHandler(clientKey, e, true)
        } else {
          this.errorHandler(clientKey, new Error('Client disconnected'), true)
        }
      }
      this.saveClients()
    },
    playSubscriberHandler (subscriberIndex) {
      this.$set(this.subscribers[subscriberIndex], 'missedMessages', undefined)
      this.$set(this.subscribersStatuses, subscriberIndex, true)
    },
    pauseSubscriberHandler (subscriberIndex) {
      this.$set(this.subscribers[subscriberIndex], 'missedMessages', 0)
      this.$set(this.subscribersStatuses, subscriberIndex, 'paused')
    },
    clearMessagesHandler (subscriberIndex) {
      const messages = this.subscribersMessages[subscriberIndex]
      messages.splice(0, messages.length)
    },
    async unsubscribeMessageHandler (clientKey, subscriberIndex) {
      await this.unsubscribe(clientKey, subscriberIndex)
    },
    async unsubscribe (clientKey, subscriberIndex) {
      const clientObj = this.clients[clientKey],
        settings = this.clearObject(clientObj.subscribers[subscriberIndex])
      try {
        if (!clientObj.subscribersConnectivityStatuses[subscriberIndex]) {
          this.$set(clientObj.subscribersConnectivityStatuses, subscriberIndex, true)
        }
        this.$set(clientObj.subscribersStatuses, subscriberIndex, false)
        this.$set(clientObj.messages, subscriberIndex, settings.mode === 1 ? {} : [])
        this.$set(clientObj.subscribersMessagesBuffer, subscriberIndex, [])
        await clientObj.client.unsubscribe(settings.topic, { properties: settings.unsubscribeProperties })
        clientObj.logs.push({ type: 'unsubscribe', data: this.clearObject(settings), timestamp: Date.now() })
        this.$set(clientObj.subscribersConnectivityStatuses, subscriberIndex, false)
      } catch (e) {
        if (clientObj.status) {
          this.errorHandler(clientKey, e, true)
        } else {
          this.errorHandler(clientKey, new Error('Client disconnected'), true)
        }
      }
    },
    sendFromSubscriberHandler (message) {
      this.republishMessage = cloneDeep(message)
      this.$nextTick(() => { this.$refs.publisherModal.show() })
    },
    /* pub/sub logic end */
    clearLogs () {
      const logs = this.activeClient.logs
      logs.splice(0, logs.length)
    },
    pickEntity (index) {
      const entity = this.entities[index]
      if (!entity.rendered) {
        this.$set(this.entities[index], 'rendered', true)
      }
      this.scrollToEntity(index)
    },
    scrollToEntity (index) {
      if (!this.$refs.wrapper) { return }
      const el = this.$refs.wrapper,
        entityOffsetWidth = this.wrapperWidth / this.colsCount,
        entityScrollLeft = entityOffsetWidth * index,
        duration = (Math.abs(el.scrollLeft - entityScrollLeft) / entityOffsetWidth) * 50
      animate.start({
        from: el.scrollLeft,
        to: entityScrollLeft,
        duration,
        apply (pos) { el.scrollLeft = pos }
      })
    },
    clearUnresolvedMessages () {
      const messages = this.activeClient.notResolvedMessages
      messages.splice(0, messages.length)
    },
    swipeHandler (data) {
      const el = this.$refs.wrapper,
        elementOffsetWidth = this.wrapperWidth / this.colsCount,
        { direction } = data
      let to = 0
      if (el && direction === 'left') {
        to = el.scrollLeft + elementOffsetWidth
      } else if (el && direction === 'right') {
        to = el.scrollLeft - elementOffsetWidth
      }
      animate.start({
        from: el.scrollLeft,
        to,
        duration: 200,
        apply (pos) { el.scrollLeft = pos }
      })
    },
    getCid (connack) {
      return get(JSON.parse(get(connack, 'properties.userProperties.token', '{}')), 'cid', null)
    },
    makeFlespiRestBus (clientId) {
      const client = this.clients[clientId]
      const selectorsAsync = new SelectorsAsync({ flespiApp: `mqtt-board(client: ${client?.config?.clientId})` })
      selectorsAsync.bus.auth.getRegions()
        .then((regions) => {
          regions = get(regions, 'data.result', [])
          const flespiClientRestRegion = regions.reduce((flespiRegion, region) => {
            const host = region['mqtt-ws'].split(':')[0]
            if (client.config.host.indexOf(host) !== -1) {
              return region
            } else {
              return flespiRegion
            }
          })
          if (flespiClientRestRegion) {
            selectorsAsync.settings = { server: flespiClientRestRegion.rest }
            selectorsAsync.token = client.config.username
            this.$set(this.clients[clientId], 'restBus', selectorsAsync)
          } else {
            this.$set(this.clients[clientId], 'restBus', null)
          }
        })
    },
    onWrapperResize ({ width }) {
      this.wrapperWidth = width
      const el = this.$refs.wrapper,
        colsCount = this.getColsCount(width),
        entityOffsetWidth = width / colsCount,
        entityScrollLeft = entityOffsetWidth * this.firstViewedPanelIndex
      el.scrollLeft = entityScrollLeft
    },
    closeAllHandler () {
      for (let i = this.entities.length - 1; i >= 0; i--) {
        const entity = this.entities[i],
          type = entity.type,
          index = entity.index
        if (type === 'subscriber') {
          this.removeSubscriber(index)
        } else if (type === 'publisher') {
          this.removePublisher(index)
        }
      }
    }
  },
  watch: {
    subscribersStatuses (statuses) {
      this.saveClients()
    }
  },
  created () {
    this.wrapperScroll = debounce((e) => {
      if (!this.$refs.wrapper) { return }
      const el = this.$refs.wrapper,
        entityOffsetWidth = this.wrapperWidth / this.colsCount
      this.firstViewedPanelIndex = Math.round(el.scrollLeft / entityOffsetWidth)
    }, 100)
    if (this.needInitNewClient && !this.configuredClients.length) {
      this.createClient(cloneDeep(merge({}, defaultSettings, this.initSettings)))
      this.setActiveClient(0)
    }
    if (this.configuredClients.length) {
      this.initExternalClients(this.configuredClients)
    } else if (this.useLocalStorage) {
      const savedClients = LocalStorage.getItem(MQTT_BOARD_LOCALSTORAGE_NAME)
      this.initExternalClients(savedClients)
    }
    this.isInited = true
    if (window) {
      window.addEventListener('beforeunload', () => {
        for (const clientObjKey in this.clients) {
          const clientObj = this.clients[clientObjKey]
          if (clientObj.status) {
            clientObj.processTimer && clearInterval(clientObj.processTimer)
            this.destroyClient(clientObj.client)
          }
        }
      })
    }
  },
  destroyed () {
    for (const clientObjKey in this.clients) {
      const clientObj = this.clients[clientObjKey]
      if (clientObj.status) {
        clientObj.processTimer && clearInterval(clientObj.processTimer)
        this.destroyClient(clientObj.client)
      }
    }
  },
  components: {
    ClientSettingsModal, SliderController, Subscriber, Publisher, Unresolved, Logs, PublisherModal, EntitiesMenu
  },
  updated () {
    if (this.isNeedScroll) {
      const el = this.$refs.wrapper
      animate.start({
        from: el.scrollLeft,
        to: el.scrollWidth,
        duration: 300,
        apply (pos) { el.scrollLeft = pos }
      })
      this.isNeedScroll = false
    }
  },
  mixins: [validateEntities, migrations]
}
</script>
