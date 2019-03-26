<template>
  <div class="mqtt-client__subscriber col-md-6 col-sm-12 col-xs-12">
    <q-card class="subscriber__item q-ma-sm" v-if="!status && isPlayed === null">
      <q-card-title class="q-pa-none">
        <q-toolbar color="orange" class="q-px-none">
          <q-toolbar-title>Subscriber</q-toolbar-title>
          <q-btn round flat :disable="!isValidSubscriber" icon="mdi-play" @click="subscribeMessageHandler">
            <q-tooltip>Subscribe</q-tooltip>
          </q-btn>
          <q-btn round flat icon="mdi-dots-vertical">
            <q-popover anchor="bottom right" self="top right">
              <q-list>
                <q-item class="cursor-pointer" v-close-overlay highlight @click.native="removeSubscriber()">
                  <q-item-side color="red" icon="mdi-delete-outline" />
                  <q-item-main label="Remove"/>
                </q-item>
              </q-list>
            </q-popover>
          </q-btn>
        </q-toolbar>
      </q-card-title>
      <q-card-main class="item__main q-py-none">
        <div>
          <q-input
            :disable="status"
            color="dark"
            v-model="config.topic"
            float-label="Topic"
            :error="!isValidSubscriber"
            :after="[
              {
                icon: 'mdi-alert',
                condition: config.topic.indexOf('$share') === 0,
                handler: showSharedSubscriptionNotification
              }
            ]"
            :warning="config.topic.indexOf('$share') === 0"
          />
          <q-collapsible opened class="q-mt-sm q-mb-sm bg-grey-2" label="Options">
            <div>
              QoS
              <q-btn-toggle :disable="status" flat rounded toggle-text-color="dark" text-color="grey-6" class="q-ml-sm" v-model="config.options.qos" :options="[{label: '0', value: 0},{label: '1', value: 1},{label: '2', value: 2}]"/>
            </div>
            <q-checkbox :disable="status" v-if="version === 5" style="display: flex;" color="dark" class="q-mt-sm q-mb-sm" v-model="config.options.nl" label="No local"/>
            <q-checkbox :disable="status" v-if="version === 5" style="display: flex;" color="dark" class="q-mt-sm q-mb-sm" v-model="config.options.rap" label="Retain as Published"/>
            <div v-if="version === 5">
              <div class="q-mb-sm">
                Retain handling
                <q-btn-toggle :disable="status" flat rounded toggle-text-color="dark" text-color="grey-6" class="q-ml-sm" v-model="config.options.rh" :options="[{label: '0', value: 0},{label: '1', value: 1},{label: '2', value: 2}]"/>
              </div>
            </div>
            <q-collapsible v-if="version === 5" class="q-mt-sm q-mb-sm bg-grey-4" label="Properties">
              <q-input :disable="status" color="dark" type="number" v-model="config.options.properties.subscriptionIdentifier" clearable :clear-value="undefined" float-label="Subscription identifier" :error="!isNil(config.options.properties.subscriptionIdentifier) && (config.options.properties.subscriptionIdentifier <= 0 || config.options.properties.subscriptionIdentifier > 268435455)"/>
              <div v-if="!status || config.options.properties.userProperties">
                <div class="q-mt-md">User Properties</div>
                <q-checkbox style="display: flex;" color="dark" class="q-mt-sm q-mb-sm" v-model="needUseSubUserPropsToUnsub" label="Also use to unsubscribe"/>
                <div>
                  <q-list v-if="config.options.properties.userProperties">
                    <q-item v-for="(value, name) in config.options.properties.userProperties" :key="`${name}: ${value}`">
                      <q-icon v-if="!status" class="q-mr-sm cursor-pointer" size='1rem' @click.native="removeSubscriberUserProperty(name)" name="mdi-close-circle"/>
                      <span>{{`${name}: ${value}`}}</span>
                    </q-item>
                  </q-list>
                  <q-input v-if="!status" color="dark" v-model="subscriberUserProperty.name" float-label="User property name"/>
                  <q-input v-if="!status" color="dark" v-model="subscriberUserProperty.value" float-label="User property value"/>
                  <q-btn :disable="!subscriberUserProperty.name || !subscriberUserProperty.value" v-if="!status" style="width: 100%" class="q-mt-sm" color="dark" @click="addSubscriberUserProperty">Add</q-btn>
                </div>
              </div>
            </q-collapsible>
            <q-collapsible v-if="version === 5 && !needUseSubUserPropsToUnsub" :opened="!!config.unsubscribeProperties.userProperties" class="q-mt-sm q-mb-sm bg-grey-4" label="Unsubscribe properties">
              <div v-if="!status || config.unsubscribeProperties.userProperties">
                <div class="q-mt-md">User Properties</div>
                <div>
                  <q-list v-if="config.unsubscribeProperties.userProperties">
                    <q-item v-for="(value, name) in config.unsubscribeProperties.userProperties" :key="`${name}: ${value}`">
                      <q-icon v-if="!status" class="q-mr-sm cursor-pointer" size='1rem' @click.native="removeUnsubscribeUserProperty(name)" name="mdi-close-circle"/>
                      <span>{{`${name}: ${value}`}}</span>
                    </q-item>
                  </q-list>
                  <q-input v-if="!status" color="dark" v-model="unsubscribeUserProperty.name" float-label="User property name"/>
                  <q-input v-if="!status" color="dark" v-model="unsubscribeUserProperty.value" float-label="User property value"/>
                  <q-btn :disable="!unsubscribeUserProperty.name || !unsubscribeUserProperty.value" v-if="!status" style="width: 100%" class="q-mt-sm" color="dark" @click="addUnsubscribeUserProperty">Add</q-btn>
                </div>
              </div>
            </q-collapsible>
          </q-collapsible>
        </div>
      </q-card-main>
    </q-card>
    <q-card v-else class="subscriber__item q-ma-sm">
      <q-toolbar v-if="!filterMode" color="orange" class="q-px-none" style="border-top-right-radius: 0; border-top-left-radius: 0;">
        <q-toolbar-title style="width: calc(100% - 150px)">
          <span>
            {{config.topic}}
            <q-tooltip>{{config.topic}}</q-tooltip>
          </span>
        </q-toolbar-title>
        <q-btn round flat icon="mdi-magnify" @click="filterMode = true"/>
        <q-btn round flat icon="mdi-stop" @click="unsubscribeMessageHandler()" title="Unsubscribe"/>
        <q-btn round flat :icon="isPlayed && status !== 'paused' ? 'mdi-pause' : 'mdi-play'" @click="playStopHandler" :title="isPlayed && status !== 'paused' ? 'Pause' : 'Resume'">
          <q-chip floating v-if="status === 'paused' && !!value.missedMessages" color="red">
            {{value.missedMessages}}
          </q-chip>
        </q-btn>
        <q-btn round flat icon="mdi-dots-vertical">
          <q-popover anchor="bottom right" self="top right">
            <q-list>
              <q-item>
                <q-item-main>
                  <q-btn-toggle v-close-overlay flat rounded toggle-text-color="dark" text-color="grey-6" v-model="config.mode" :options="modeSelectOptions"/>
                </q-item-main>
              </q-item>
              <q-item class="cursor-pointer" v-close-overlay highlight @click.native="clearMessagesHandler">
                <q-item-side icon="mdi-playlist-remove" />
                <q-item-main label="Clear messages"/>
              </q-item>
              <q-item-separator/>
              <q-item class="cursor-pointer" v-close-overlay highlight @click.native="removeSubscriber()">
                <q-item-side color="red" icon="mdi-delete-outline" />
                <q-item-main label="Remove"/>
              </q-item>
            </q-list>
          </q-popover>
        </q-btn>
      </q-toolbar>
      <q-input
        v-else
        class="q-ma-sm"
        color="dark"
        v-model="filter"
        placeholder="Filter by topic"
        autofocus
        :before="[
          {
            icon: 'mdi-arrow-left',
            handler () {
              filterMode = false
              filter = ''
            }
          }
        ]"
        :after="[
          {
            icon: 'mdi-close',
            condition: !!filter,
            handler () { filter = '' }
          }
        ]"
      />

      <virtual-list
        v-autoscroll="needAutoScroll"
        ref="scroller"
        :onscroll="listScroll"
        :debounce="10"
        v-if="messages && messages.length && config.mode === 0"
        :size="110"
        :remain="15"
        class="subscriber__list"
      >
        <message :message="message" v-for="(message, msgIndex) in renderedMessages" :key="`subMsg$${msgIndex}`"/>
      </virtual-list>
      <div class="subscriber__list subscriber__list--uniq" v-else-if="config.mode === 1">
        <div :style="{height: uniqModeValue ? '60%' : '100%'}" class="scroll">
          <uniq-tree :topic="uniqSelectedTopic" :data="renderedMessages" @change="uniqValueChangeHandler"/>
        </div>
        <div style="height: 40%" v-if="uniqModeValue">
          <uniq-message :message="uniqModeValue"/>
        </div>
      </div>
      <div v-else class="subscriber__list--empty">No messages</div>
    </q-card>
  </div>
</template>

<script>
import Vue from 'vue'
import UniqTree from './UniqTree'
import VirtualList from 'vue-virtual-scroll-list'
import Message from './Message'
import UniqMessage from './UniqMessage'
import validateTopic from '../mixins/validateTopic.js'
import isNil from 'lodash/isNil'

const
  HISTORY_MODE = 0,
  UNIQUE_MODE = 1

function jsonTreeByMessages (messages) {
  return messages.reduce((result, message) => {
    if (!message.payload.length) {
      return result
    }
    let path = message.topic.split('/')
    let currentNesting = result
    let currentTopic = ''
    path.forEach((pathElement, pathIndex, path) => {
      if (!currentNesting[pathElement]) {
        currentNesting[pathElement] = { children: undefined, topic: '' }
      }
      if (pathIndex !== 0) {
        currentTopic += '/'
      }
      currentTopic += `${pathElement}`
      currentNesting[pathElement].topic = currentTopic
      if (pathIndex !== path.length - 1) {
        if (!currentNesting[pathElement].children) {
          currentNesting[pathElement].children = {}
        }
        currentNesting = currentNesting[pathElement].children
      }
    })
    return result
  }, {})
}

export default {
  name: 'Subscriber',
  props: [
    'value',
    'messages',
    'status',
    'version'
  ],
  data () {
    return {
      filterMode: false,
      config: this.value,
      loadingStatus: false,
      needUseSubUserPropsToUnsub: false,
      subscriberUserProperty: {
        value: '',
        name: ''
      },
      unsubscribeUserProperty: {
        value: '',
        name: ''
      },
      modeSelectOptions: [
        {
          label: 'History',
          value: HISTORY_MODE
        },
        {
          label: 'Unique',
          value: UNIQUE_MODE
        }
      ],
      needAutoScroll: true,
      isPlayed: this.status || null,
      filter: '',
      uniqSelectedTopic: ''
    }
  },
  computed: {
    renderedMessages () {
      let messages = this.filter
        ? this.messages.filter(message => message.topic.indexOf(this.filter) !== -1)
        : this.messages
      switch (this.config.mode) {
        case HISTORY_MODE: {
          return messages
        }
        case UNIQUE_MODE: {
          return jsonTreeByMessages(messages)
        }
      }
    },
    uniqModeValue () {
      let messages = this.filter
        ? this.messages.filter(message => message.topic.indexOf(this.filter) !== -1)
        : this.messages
      let result = null
      if (this.config.mode === UNIQUE_MODE) {
        result = messages.reduceRight((result, message) => {
          if (result) { return result }
          if (this.uniqSelectedTopic && message.topic === this.uniqSelectedTopic) {
            return message
          }
        }, undefined)
      }
      return result
    },
    isValidSubscriber () {
      return !!this.config.topic && this.validateTopic(this.config.topic) &&
        (isNil(this.config.options.properties.subscriptionIdentifier) || (this.config.options.properties.subscriptionIdentifier > 0 && this.config.options.properties.subscriptionIdentifier <= 268435455))
    }
  },
  methods: {
    isNil,
    playStopHandler () {
      if (this.isPlayed) {
        this.$emit('pause')
      } else {
        this.$emit('play')
      }
      this.isPlayed = !this.isPlayed
    },
    subscribeMessageHandler () {
      this.loadingStatus = true
      if (this.needUseSubUserPropsToUnsub) {
        Vue.set(this.config.unsubscribeProperties, 'userProperties', Object.assign({}, this.config.options.properties.userProperties))
      }
      this.$emit('subscribe')
    },
    unsubscribeMessageHandler (key, settings) {
      this.isPlayed = null
      this.clearScrollParams()
      this.$emit('unsubscribe')
    },
    removeSubscriber (key) {
      this.$emit('remove')
    },
    addSubscriberUserProperty () {
      if (!this.config.options.properties.userProperties) {
        Vue.set(this.config.options.properties, 'userProperties', {})
      }
      Vue.set(this.config.options.properties.userProperties, this.subscriberUserProperty.name, this.subscriberUserProperty.value)
      this.subscriberUserProperty = {
        value: '',
        name: ''
      }
    },
    removeSubscriberUserProperty (name) {
      Vue.delete(this.config.options.properties.userProperties, name)
      if (!Object.keys(this.config.options.properties.userProperties).length) {
        Vue.set(this.config.options.properties, 'userProperties', null)
      }
    },
    addUnsubscribeUserProperty () {
      if (!this.config.unsubscribeProperties.userProperties) {
        Vue.set(this.config.unsubscribeProperties, 'userProperties', {})
      }
      Vue.set(this.config.unsubscribeProperties.userProperties, this.unsubscribeUserProperty.name, this.unsubscribeUserProperty.value)
      this.unsubscribeUserProperty = {
        value: '',
        name: ''
      }
    },
    removeUnsubscribeUserProperty (name) {
      Vue.delete(this.config.unsubscribeProperties.userProperties, name)
      if (!Object.keys(this.config.unsubscribeProperties.userProperties).length) {
        Vue.set(this.config.unsubscribeProperties, 'userProperties', null)
      }
    },
    showSharedSubscriptionNotification () {
      this.$q.dialog({
        title: 'Shared subscription info',
        message: 'You are trying to subscribe to a Shared Subscription. Publication that matches its Topic Filter is sent to one of the subscribed sessions only.',
        color: 'primary',
        ok: true,
        preventClose: true
      })
    },
    listScroll (e) {
      if (this.status) {
        let el = this.$refs.scroller.$el
        if (el.scrollTop < el.scrollHeight - el.clientHeight) {
          this.needAutoScroll = false
        } else {
          this.needAutoScroll = true
        }
      }
    },
    clearScrollParams () {
      this.currentScrollTop = 0
      this.allScrollTop = 0
      this.needAutoScroll = true
    },
    clearMessagesHandler () {
      this.$emit('clear')
    },
    uniqValueChangeHandler (value) {
      this.uniqSelectedTopic = value
    }
  },
  watch: {
    config: {
      deep: true,
      handler (val) {
        this.$emit('input', val)
      }
    },
    status (val) {
      if (val && this.loadingStatus) {
        this.loadingStatus = false
        this.isPlayed = true
      }
    },
    value: {
      deep: true,
      handler (value) {
        this.config = value
      }
    }
  },
  components: { VirtualList, Message, UniqTree, UniqMessage },
  directives: {
    autoscroll: {
      inserted (el, {value}) {
        if (value) {
          el.scrollTop = el.scrollHeight - el.clientHeight
        }
      },
      componentUpdated (el, {value}) {
        setTimeout(() => {
          if (value) {
            el.scrollTop = el.scrollHeight - el.clientHeight
          }
        }, 50)
      }
    }
  },
  mixins: [validateTopic]
}
</script>

<style lang="stylus">
  .mqtt-client__subscriber
    .subscriber__item
      border 2px solid orange
      height calc(100% - 16px)
      position relative
      .item__main
        position relative
        height calc(100% - 50px)
        overflow auto
    .subscriber__list
      position absolute
      top 50px
      bottom 0
      right 0
      left 0
      height auto!important
    .subscriber__list--empty
      text-align center
      margin-top 10px
      font-size 1.3rem
      color #333
</style>
