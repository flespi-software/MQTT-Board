<template>
  <div class="mqtt-client__subscriber col-md-6 col-sm-12 col-xs-12">
    <q-card class="subscriber__item q-ma-sm" v-if="!status && isPlayed === null">
      <q-card-actions>
        <q-btn align="left" icon="mdi-play" :disable="!isValidSubscriber" style="width: calc(100% - 20px);" @click="subscribeMessageHandler()">
          <q-item dense>
            <q-item-main>
              <q-item-tile style="font-size: 0.9rem;" class="uppercase text-bold" label>Subscribe</q-item-tile>
              <q-item-tile style="margin-top: 0; font-size: 0.75rem; text-transform: initial;" class="ellipsis" sublabel>{{config.topic}}</q-item-tile>
            </q-item-main>
          </q-item>
        </q-btn>
      </q-card-actions>
      <q-icon class="subscriber__remove cursor-pointer" size="1rem" name="mdi-close" @click.native="removeSubscriber()"/>
      <q-card-main class="item__main q-pb-none">
        <div>
          <q-input
            :disable="status"
            color="dark"
            v-model="config.topic"
            float-label="Topic"
            :error="!config.topic"
            :after="[{
              icon: 'mdi-alert',
              condition: config.topic.indexOf('$share') === 0,
              handler: showSharedSubscriptionNotification
            }]"
            :warning="config.topic.indexOf('$share') === 0"
          />
          <q-collapsible opened class="q-mt-sm q-mb-sm bg-grey-2" label="Options">
            <div>
              QoS
              <q-btn-toggle :disable="status" toggle-color="dark" class="q-ml-sm" size="sm" v-model="config.options.qos" :options="[{label: '0', value: 0},{label: '1', value: 1},{label: '2', value: 2}]"/>
            </div>
            <q-checkbox :disable="status" v-if="version === 5" style="display: flex;" color="dark" class="q-mt-sm q-mb-sm" toggle-indeterminate :indeterminate-value="null" v-model="config.options.nl" label="No local"/>
            <q-checkbox :disable="status" v-if="version === 5" style="display: flex;" color="dark" class="q-mt-sm q-mb-sm" toggle-indeterminate :indeterminate-value="null" v-model="config.options.rap" label="Retain as Published"/>
            <div v-if="version === 5">
              <div class="q-mb-sm">
                Retain handling
                <q-btn-toggle :disable="status" toggle-color="dark" class="q-ml-sm" size="sm" v-model="config.options.rh" :options="[{label: 'null', value: null}, {label: '0', value: 0},{label: '1', value: 1},{label: '2', value: 2}]"/>
              </div>
            </div>
            <q-collapsible v-if="version === 5" class="q-mt-sm q-mb-sm bg-grey-4" label="Properties">
              <q-input :disable="status" color="dark" type="number" v-model="config.options.properties.subscriptionIdentifier" float-label="Subscription identifier"/>
              <div v-if="!status || config.options.properties.userProperties">
                <div class="q-mt-md">User Properties</div>
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
          </q-collapsible>
        </div>
      </q-card-main>
    </q-card>
    <div v-else class="subscriber__item q-ma-sm q-card" >
      <q-icon class="subscriber__remove cursor-pointer" size="1rem" name="mdi-close" @click.native="removeSubscriber()"/>
      <q-btn class="q-ml-sm" :icon="isPlayed ? 'mdi-stop' : 'mdi-play'" @click="playStopHandler"/>
      <q-btn align="left" class="q-mt-sm q-ml-sm q-mb-sm q-mr-lg q-py-none" style="width: calc(100% - 95px); display: inline-block;" @click="unsubscribeMessageHandler()">
        <q-item dense class="q-px-none">
          <q-tooltip>Unsubscribe from {{config.topic}}</q-tooltip>
          <q-item-main>
            <q-item-tile style="font-size: 0.9rem;" class="uppercase text-bold" label>Unsubscribe</q-item-tile>
            <q-item-tile style="margin-top: 0; font-size: 0.75rem; text-transform: initial;" class="ellipsis" sublabel>{{config.topic}}</q-item-tile>
          </q-item-main>
        </q-item>
      </q-btn>
      <q-collapsible class="bg-white" style="z-index: 1;" popup>
        <template slot="header">
          <q-item-main>
            <q-item-tile label style="font-size: .9rem">Settings</q-item-tile>
            <q-item-tile class="ellipsis" sublabel style="font-size: .7rem">{{`Mode: ${config.mode ? 'Unique' : 'History'} ${filter ? `by filter: ${filter}` : ''}`}}</q-item-tile>
          </q-item-main>
        </template>
        <q-select color="dark" v-model="config.mode" :options="modeSelectOptions"/>
        <q-input placeholder="Filter by topic" float-label="Filter" color="dark" v-model="filter"/>
      </q-collapsible>
      <virtual-list
        ref="scroller"
        :onscroll="listScroll"
        :debounce="10"
        v-if="messages && messages.length && (config.mode === 0 || config.mode === 1)"
        :size="110"
        :remain="15"
        class="subscriber__list"
      >
        <message :message="message" v-for="(message, msgIndex) in renderedMessages" :key="`subMsg$${msgIndex}`"/>
      </virtual-list>
      <div v-else class="subscriber__list--empty">No messages</div>
    </div>
  </div>
</template>

<script>
import Vue from 'vue'
import VirtualList from 'vue-virtual-scroll-list'
import Message from './Message'

const
  HISTORY_MODE = 0,
  UNIQUE_MODE = 1

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
      config: this.value,
      loadingStatus: false,
      subscriberUserProperty: {
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
      filter: ''
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
          let obj = messages.reduce((obj, message, index) => {
            obj[message.topic] = message
            return obj
          }, {})
          return obj
        }
      }
    },
    isValidSubscriber () {
      return !!this.config.topic
    }
  },
  methods: {
    playStopHandler () {
      if (this.isPlayed) {
        this.$emit('unsubscribe')
      } else {
        this.$emit('subscribe')
      }
      this.isPlayed = !this.isPlayed
    },
    subscribeMessageHandler () {
      this.loadingStatus = true
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
        this.config.options.properties.userProperties = {}
      }
      this.config.options.properties.userProperties[this.subscriberUserProperty.name] = this.subscriberUserProperty.value
      this.subscriberUserProperty = {
        value: '',
        name: ''
      }
    },
    removeSubscriberUserProperty (name) {
      Vue.delete(this.config.options.properties.userProperties, name)
      if (!Object.keys(this.config.options.properties.userProperties).length) {
        this.config.options.properties.userProperties = null
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
      if (this.isPlayed) {
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
  components: { VirtualList, Message },
  updated () {
    if (this.messages && !this.messages.length) {
      this.currentScrollTop = 0
    } else {
      if (this.needAutoScroll && this.$refs.scroller) {
        let el = this.$refs.scroller.$el
        el.scrollTop = el.scrollHeight - el.clientHeight
      }
    }
  }
}
</script>

<style lang="stylus">
  .mqtt-client__subscriber
    .subscriber__item
      border 2px solid orange
      height calc(100% - 32px)
      position relative
      .item__main
        position relative
        height calc(100% - 54px)
        overflow auto
    .subscriber__remove
      position absolute
      top 5px
      right 5px
    .subscriber__list
      position absolute
      top 110px
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
