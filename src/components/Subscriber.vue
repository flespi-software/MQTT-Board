<template>
  <div class="mqtt-client__subscriber col-md-4 col-sm-6 col-xs-12">
    <q-card class="subscriber__item q-ma-sm" v-if="!status && isPlayed === null">
      <q-card-section class="q-pa-none">
        <q-toolbar class="q-pr-none text-white bg-orange">
          <q-toolbar-title>Subscriber</q-toolbar-title>
          <q-btn round flat :disable="!isValidSubscriber" icon="mdi-play" @click="subscribeMessageHandler">
            <q-tooltip>Subscribe</q-tooltip>
          </q-btn>
          <q-btn round flat icon="mdi-dots-vertical">
            <q-menu anchor="bottom right" self="top right" content-class="mqtt-board__popup">
              <q-list>
                <q-item v-close-popup @click.native="removeSubscriber()" clickable v-ripple>
                  <q-item-section avatar><q-icon color="red" name="mdi-delete-outline" /></q-item-section>
                  <q-item-section><q-item-label>Remove</q-item-label></q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-btn>
        </q-toolbar>
      </q-card-section>
      <q-card-section class="item__main q-py-none">
        <div class="q-pt-md">
          <q-input
            :disable="status"
            color="grey-9" outlined class="q-mb-xs" hide-bottom-space
            v-model="config.topic"
            label="Topic"
            :error="!isValidSubscriber"
          >
            <q-btn slot="append" color="yellow-9" icon="mdi-alert" @click="showSharedSubscriptionNotification" flat round v-if="config.topic.indexOf('$share') === 0"/>
          </q-input>
          <q-btn-toggle v-close-popup flat rounded toggle-text-color="grey-9" text-color="grey-6" v-model="config.mode" :options="modeSelectOptions" @input="changeModeHandler" style="width: 100%" class="q-mt-md"/>
          <q-input color="grey-9" outlined class="q-my-xs" hide-bottom-space v-model="config.treeField" label="Field to group by" v-if="config.mode === 1 && version === 5" hint="User properties field name by which messages will be grouped."/>
          <q-toggle v-model="config.highlight" color="grey-9" label="Highlight messages content" class="q-my-md" />
          <q-expansion-item :value="true" class="q-mt-sm q-mb-sm bg-grey-2" label="Options">
            <div class="q-pa-sm">
              <div class="q-px-md q-py-sm">
                QoS
                <q-btn-toggle :disable="status" flat rounded toggle-text-color="grey-9" text-color="grey-6" class="q-ml-sm" v-model="config.options.qos" :options="[{label: '0', value: 0},{label: '1', value: 1},{label: '2', value: 2}]"/>
              </div>
              <q-checkbox :disable="status" v-if="version === 5" style="display: flex;" color="grey-9" class="q-mt-sm q-mb-sm" v-model="config.options.nl" label="No local"/>
              <q-checkbox :disable="status" v-if="version === 5" style="display: flex;" color="grey-9" class="q-mt-sm q-mb-sm" v-model="config.options.rap" label="Retain as Published"/>
              <div v-if="version === 5">
                <div class="q-mb-sm">
                  Retain handling
                  <q-btn-toggle :disable="status" flat rounded toggle-text-color="grey-9" text-color="grey-6" class="q-ml-sm" v-model="config.options.rh" :options="[{label: '0', value: 0},{label: '1', value: 1},{label: '2', value: 2}]"/>
                </div>
              </div>
              <q-expansion-item v-if="version === 5" class="q-mt-sm q-mb-sm bg-grey-4" label="Properties">
                <div class="q-px-md q-py-sm">
                  <q-input
                    :disable="status" color="grey-9" label="Subscription identifier" clearable type="number" outlined class="q-my-xs" hide-bottom-space
                    v-model.number="config.options.properties.subscriptionIdentifier"
                    @clear="config.options.properties.subscriptionIdentifier = undefined"
                    :error="!isNil(config.options.properties.subscriptionIdentifier) && (config.options.properties.subscriptionIdentifier <= 0 || config.options.properties.subscriptionIdentifier > 268435455)"
                  />
                  <div v-if="!status || config.options.properties.userProperties">
                    <div class="q-mt-md">User Properties</div>
                    <q-checkbox style="display: flex;" color="grey-9" class="q-mt-sm q-mb-sm" v-model="needUseSubUserPropsToUnsub" label="Also use to unsubscribe"/>
                    <div>
                      <q-list v-if="config.options.properties.userProperties" class="q-mb-xs">
                        <q-item v-for="(value, name) in config.options.properties.userProperties" :key="`${name}: ${value}`" style="min-height: 17px;">
                          <q-icon v-if="!status" class="q-mr-sm cursor-pointer" size='1rem' @click.native="removeSubscriberUserProperty(name)" name="mdi-close-circle"/>
                          <span>{{`${name}: ${value}`}}</span>
                        </q-item>
                      </q-list>
                      <q-input v-if="!status"  outlined class="q-my-xs" hide-bottom-space color="grey-9" v-model="subscriberUserProperty.name" label="User property name"/>
                      <q-input v-if="!status"  outlined class="q-my-xs" hide-bottom-space color="grey-9" v-model="subscriberUserProperty.value" label="User property value"/>
                      <q-btn :disable="!subscriberUserProperty.name || !subscriberUserProperty.value" v-if="!status" style="width: 100%" class="q-mt-sm" color="grey-9" @click="addSubscriberUserProperty">Add</q-btn>
                    </div>
                  </div>
                </div>
              </q-expansion-item>
              <q-expansion-item v-if="version === 5 && !needUseSubUserPropsToUnsub" :value="!!config.unsubscribeProperties.userProperties" class="q-mt-sm q-mb-sm bg-grey-4" label="Unsubscribe properties">
                <div v-if="!status || config.unsubscribeProperties.userProperties" class="q-px-md q-py-sm">
                  <div class="q-mt-md">User Properties</div>
                  <div>
                    <q-list v-if="config.unsubscribeProperties.userProperties" class="q-mb-xs">
                      <q-item v-for="(value, name) in config.unsubscribeProperties.userProperties" :key="`${name}: ${value}`" style="min-height: 17px;">
                        <q-icon v-if="!status" class="q-mr-sm cursor-pointer" size='1rem' @click.native="removeUnsubscribeUserProperty(name)" name="mdi-close-circle"/>
                        <span>{{`${name}: ${value}`}}</span>
                      </q-item>
                    </q-list>
                    <q-input v-if="!status" color="grey-9" outlined class="q-my-xs" hide-bottom-space v-model="unsubscribeUserProperty.name" label="User property name"/>
                    <q-input v-if="!status" color="grey-9" outlined class="q-my-xs" hide-bottom-space v-model="unsubscribeUserProperty.value" label="User property value"/>
                    <q-btn :disable="!unsubscribeUserProperty.name || !unsubscribeUserProperty.value" v-if="!status" style="width: 100%" class="q-mt-sm" color="grey-9" @click="addUnsubscribeUserProperty">Add</q-btn>
                  </div>
                </div>
              </q-expansion-item>
            </div>
          </q-expansion-item>
        </div>
      </q-card-section>
    </q-card>
    <q-card v-else class="subscriber__item q-ma-sm">
      <q-toolbar v-if="!filterMode" class="q-pr-none text-white bg-orange" style="border-top-right-radius: 0; border-top-left-radius: 0;">
        <q-toolbar-title style="width: calc(100% - 150px)">
          <span>
            {{config.topic}}
            <q-tooltip>{{config.topic}}</q-tooltip>
          </span>
        </q-toolbar-title>
        <q-btn round flat icon="mdi-magnify" @click="filterMode = true" v-if="config.mode === 0"/>
        <q-btn round flat icon="mdi-stop" @click="unsubscribeMessageHandler()" title="Unsubscribe"/>
        <q-btn round flat :icon="isPlayed && status !== 'paused' ? 'mdi-pause' : 'mdi-play'" @click="playStopHandler" :title="isPlayed && status !== 'paused' ? 'Pause' : 'Resume'">
          <q-chip v-if="status === 'paused' && !!value.missedMessages" color="red" dense text-color="white" size=".6rem" class="absolute-top-right" style="top: -5px; right: -5px;" square>
            {{value.missedMessages}}
          </q-chip>
        </q-btn>
        <q-btn round flat icon="mdi-dots-vertical">
          <q-menu anchor="bottom right" self="top right" content-class="mqtt-board__popup">
            <q-list>
              <q-item v-if="config.mode === 0" v-close-popup @click.native="clearMessagesHandler" clickable v-ripple>
                <q-item-section avatar><q-icon name="mdi-playlist-remove" /></q-item-section>
                <q-item-section><q-item-label>Clear messages</q-item-label></q-item-section>
              </q-item>
              <q-separator v-if="config.mode === 0" spaced/>
              <q-item v-close-popup highlight @click.native="removeSubscriber()" clickable v-ripple>
                <q-item-section avatar><q-icon color="red" name="mdi-delete-outline" /></q-item-section>
                <q-item-section><q-item-label>Remove</q-item-label></q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
      </q-toolbar>
      <q-input
        v-else
        class="q-ma-sm q-my-xs"
        color="grey-9" outlined hide-bottom-space
        v-model="filter"
        label="Filter by topic"
        autofocus
      >
        <q-btn slot="prepend" color="grey-9" icon="mdi-arrow-left" @click="filterMode = false, filter = ''" flat round/>
        <q-btn slot="append" color="grey-9" icon="mdi-close" @click="filter = ''" flat round v-if="!!filter"/>
      </q-input>
      <div style="position: relative;" :style="{height: `calc(100% - ${filterMode ? '62px' : '50px'})`}">
        <virtual-list
          v-autoscroll="needAutoScroll"
          ref="scroller"
          :onscroll="listScroll"
          v-if="messages && messages.length && config.mode === 0"
          :size="110"
          :remain="15"
          class="subscriber__list"
          :item="Message"
          :itemcount="renderedMessages.length"
          :itemprops="getMessageProps"
        />
        <div class="subscriber__list subscriber__list--tree" v-else-if="config.mode === 1 && Object.keys(renderedMessages).length && subscribed">
          <div style="height: 60%" class="scroll">
            <tree :topic="treeSelectedTopic" :data="renderedMessages" @change="treeValueChangeHandler"/>
          </div>
          <div class="scroll tree__message">
            <template v-for="(message, key, index) in treeModeValue">
              <message :key="`tree-message-${key}-${index}`" :message="message" v-if="typeof message.payload !== 'undefined'" :highlight="config.highlight" @action:send="(message) => { $emit('action:send', message) }" />
              <div :key="`tree-message-empty-${index}`" v-else style="height: 100%" class='text-center'>
                <div style="font-size: 1.5rem;" class="q-pt-sm text-grey-9">No messages</div>
                <div class="text-grey-8">{{message.topic}}</div>
                <q-icon color="red" name="mail" size="5rem"/>
              </div>
            </template>
          </div>
        </div>
        <div v-else-if="status && subscribed && !processingFlag" class="subscriber__list--empty">No messages</div>
        <q-inner-loading :showing="isNeedLoading">
          <q-spinner-gears size="150px" color="orange"></q-spinner-gears>
        </q-inner-loading>
      </div>
    </q-card>
  </div>
</template>

<script>
import Tree from './TreeModeView.vue'
import VirtualList from 'vue-virtual-scroll-list'
import Message from './Message.vue'
import validateTopic from '../mixins/validateTopic.js'
import isNil from 'lodash/isNil'

const
  HISTORY_MODE = 0,
  TREE_MODE = 1

export default {
  name: 'Subscriber',
  props: [
    'value',
    'messages',
    'status',
    'version',
    'subscribed'
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
          label: 'Tree',
          value: TREE_MODE
        }
      ],
      needAutoScroll: true,
      isPlayed: this.status || null,
      filter: '',
      treeSelectedTopic: null,
      processingFlag: null,
      Message
    }
  },
  computed: {
    renderedMessages () {
      let res = []
      switch (this.config.mode) {
        case HISTORY_MODE: {
          res = this.filter
            ? this.messages.filter(message => message.topic.indexOf(this.filter) !== -1)
            : this.messages
          break
        }
        case TREE_MODE: {
          res = this.messages
          break
        }
      }
      return res
    },
    treeModeValue () {
      let result = null
      if (this.config.mode === TREE_MODE) {
        if (this.treeSelectedTopic === null) { return { '': { topic: '*Empty*' } } }
        const path = this.treeSelectedTopic.split('/')
        result = path.reduce((result, pathElement, pathIndex) => {
          if (pathIndex === path.length - 1) {
            if (!result[pathElement]) {
              this.treeValueChangeHandler(null)
              return { '': { topic: '*Empty*' } }
            }
            return result[pathElement].value && Object.keys(result[pathElement].value).reduce((res, key) => {
              res[key] = JSON.parse(result[pathElement].value[key])
              return res
            }, {})
          }
          return result[pathElement].children
        }, this.messages)
        if (!result || !Object.keys(result).length) {
          result = { '': { topic: this.treeSelectedTopic } }
        }
      }
      return result
    },
    isValidSubscriber () {
      return !!this.config.topic && this.validateTopic(this.config.topic) &&
        (isNil(this.config.options.properties.subscriptionIdentifier) || (this.config.options.properties.subscriptionIdentifier > 0 && this.config.options.properties.subscriptionIdentifier <= 268435455))
    },
    isNeedLoading () {
      if (this.config.mode === 1 && this.status && this.subscribed && this.processingFlag === null) {
        this.checkProcessing()
      }
      return this.config.mode === 1 && this.status && (!this.subscribed || !!this.processingFlag)
    }
  },
  methods: {
    isNil,
    checkProcessing () {
      if (!Object.keys(this.messages).length) {
        this.processingFlag = true
        setTimeout(() => { this.processingFlag = false }, 500)
      }
    },
    getMessageProps (index) {
      const props = {
        key: `subMsg$${index}`,
        props: {
          highlight: this.config.highlight,
          message: this.renderedMessages[index]
        },
        on: {
          'action:send': (message) => { this.$emit('action:send', message) }
        }
      }
      return props
    },
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
        this.$set(this.config.unsubscribeProperties, 'userProperties', Object.assign({}, this.config.options.properties.userProperties))
      }
      this.$emit('subscribe')
    },
    unsubscribeMessageHandler (key, settings) {
      this.isPlayed = null
      this.treeSelectedTopic = null
      this.clearScrollParams()
      this.$emit('unsubscribe')
      this.processingFlag = null
    },
    removeSubscriber (key) {
      this.$emit('remove')
    },
    addSubscriberUserProperty () {
      if (!this.config.options.properties.userProperties) {
        this.$set(this.config.options.properties, 'userProperties', {})
      }
      this.$set(this.config.options.properties.userProperties, this.subscriberUserProperty.name, this.subscriberUserProperty.value)
      this.subscriberUserProperty = {
        value: '',
        name: ''
      }
    },
    removeSubscriberUserProperty (name) {
      this.$delete(this.config.options.properties.userProperties, name)
      if (!Object.keys(this.config.options.properties.userProperties).length) {
        this.$set(this.config.options.properties, 'userProperties', null)
      }
    },
    addUnsubscribeUserProperty () {
      if (!this.config.unsubscribeProperties.userProperties) {
        this.$set(this.config.unsubscribeProperties, 'userProperties', {})
      }
      this.$set(this.config.unsubscribeProperties.userProperties, this.unsubscribeUserProperty.name, this.unsubscribeUserProperty.value)
      this.unsubscribeUserProperty = {
        value: '',
        name: ''
      }
    },
    removeUnsubscribeUserProperty (name) {
      this.$delete(this.config.unsubscribeProperties.userProperties, name)
      if (!Object.keys(this.config.unsubscribeProperties.userProperties).length) {
        this.$set(this.config.unsubscribeProperties, 'userProperties', null)
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
        const el = this.$refs.scroller && this.$refs.scroller.$el
        if (!el) { return false }
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
    treeValueChangeHandler (value) {
      this.treeSelectedTopic = value
    },
    changeModeHandler () {
      this.treeSelectedTopic = null
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
      } else {
        this.isPlayed = null
      }
    },
    value: {
      deep: true,
      handler (value) {
        this.config = value
      }
    }
  },
  components: { VirtualList, Tree },
  directives: {
    autoscroll: {
      inserted (el, { value }) {
        if (value) {
          el.scrollTop = el.scrollHeight - el.clientHeight
        }
      },
      componentUpdated (el, { value }) {
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
      top 0
      bottom 0
      right 0
      left 0
      height auto!important
      .tree__message
        height: 40%
        box-shadow 0 1px 5px rgba(0,0,0,0.2), 0 2px 2px rgba(0,0,0,0.14), 0 3px 1px -2px rgba(0,0,0,0.12)
    .subscriber__list--empty
      text-align center
      margin-top 10px
      font-size 1.3rem
      color #333
</style>
