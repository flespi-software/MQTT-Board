<template>
  <div class="mqtt-client__logs">
    <q-card class="logs__wrapper q-ma-sm" style="overflow: hidden;">
      <q-card-section class="q-pa-none">
        <q-toolbar class="q-pr-none text-white bg-blue">
          <q-toolbar-title>Logs</q-toolbar-title>
          <q-btn round flat icon="mdi-dots-vertical">
            <q-menu anchor="bottom right" self="top right" content-class="mqtt-board__popup">
              <q-list>
                <q-item v-close-popup @click="clearLogsHandler" clickable v-ripple>
                  <q-item-section avatar>
                    <q-icon name="mdi-playlist-remove" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>Clear logs</q-item-label>
                  </q-item-section>
                </q-item>
                <q-item v-close-popup @click="$emit('hide')" clickable v-ripple>
                  <q-item-section avatar>
                    <q-icon name="mdi-eye-off-outline" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>Hide panel</q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-btn>
        </q-toolbar>
      </q-card-section>
      <q-card-section ref="scroller" class="scroll q-pa-none" style="height: calc(100% - 50px)" @scroll.native="listScroll" v-autoscroll="needAutoScroll">
        <q-card class="log__item q-ma-sm" :class="[`bg-${getColor(log)}-3`]" v-for="(log, index) in logs" :key="`log${index}`">
          <div class="log__title q-py-xs q-px-sm text-bold">
            {{log.type}}
          </div>
          <template v-if="log.type === 'offline' || log.type === 'reconnect' || log.type === 'end'">
            <div class="log__payload q-mr-xs q-ml-xs bg-grey-2" style="font-size: .75rem"></div>
          </template>
          <template v-else-if="log.type === 'disconnect'">
            <div v-if="log.data" class="log__payload q-mr-xs q-ml-xs bg-grey-2" style="font-size: .75rem">
              disconnected by broker:
              <div>{{`${log.data.reasonCode}: ${codes[log.data.reasonCode]}`}}</div>
            </div>
          </template>
          <template v-else-if="log.type === 'created' || log.type === 'updated'">
            <div class="log__payload q-px-sm q-pt-xs q-mr-xs q-ml-xs bg-grey-2" style="font-size: .75rem">
              <div class="q-ma-none" style="white-space: pre-wrap; word-break: break-all;">
                <json-tree :data="log.data"/>
              </div>
            </div>
          </template>
          <template v-else-if="log.type === 'connect'">
            <div class="log__payload q-px-sm q-py-xs q-mr-xs q-ml-xs bg-grey-2" v-if="codes[log.data.returnCode] || codes[log.data.reasonCode]">
              {{codes[log.data.returnCode] || codes[log.data.reasonCode]}}
            </div>
            <div v-if="log.data.properties" class="log__properties q-pt-xs q-mr-xs q-ml-xs text-grey-7 bg-green-1" style="font-size: .75rem; word-break: break-all;">
              <json-tree :data="log.data.properties"/>
            </div>
          </template>
          <template v-else-if="log.type === 'error'">
            <div class="log__payload q-px-sm q-py-xs q-mr-xs q-ml-xs bg-grey-2" style="font-size: .75rem">
              <div class="q-ma-none" style="white-space: pre-wrap; word-break: break-all;">{{log.data.error.message}}</div>
            </div>
          </template>
          <template v-else-if="log.type === 'subscribe'">
            <div class="log__payload q-pa-sm q-mr-xs q-ml-xs bg-grey-2 row" style="font-size: .75rem">
              <div class="col-6 q-pr-xs" v-if="!log.data.restored">
                <div class="text-bold">Request</div>
                <div style="word-break: break-all;"><span class="text-bold">Topic: </span>{{log.data.settings.topic}}</div>
                <div><span class="text-bold">QoS: </span>{{log.data.settings.options.qos}}</div>
                <div v-if="log.data.settings.options.nl !== undefined"><span class="text-bold">No Local: </span>{{log.data.settings.options.nl}}</div>
                <div v-if="log.data.settings.options.rap !== undefined"><span class="text-bold">Retain as Published: </span>{{log.data.settings.options.rap}}</div>
                <div v-if="log.data.settings.options.rh !== undefined"><span class="text-bold">Retain handling: </span>{{log.data.settings.options.rh}}</div>
              </div>
              <div class="col-6 q-pl-xs" v-if="log.data.grants[0] && (log.data.grants[0].qos & 0x80) === 0">
                <div class="col-6 q-pr-xs text-bold" v-if="log.data.restored">Access (restored by broker)</div>
                <div class="col-6 q-pr-xs text-bold" v-else>Access</div>
                <div style="word-break: break-all;"><span class="text-bold">Topic: </span>{{log.data.grants[0].topic}}</div>
                <div><span class="text-bold">QoS: </span>{{log.data.grants[0].qos}}</div>
                <div v-if="log.data.grants[0].nl !== undefined"><span class="text-bold">No Local: </span>{{log.data.grants[0].nl}}</div>
                <div v-if="log.data.grants[0].rap !== undefined"><span class="text-bold">Retain as Published: </span>{{log.data.grants[0].rap}}</div>
                <div v-if="log.data.grants[0].rh !== undefined"><span class="text-bold">Retain handling: </span>{{log.data.grants[0].rh}}</div>
              </div>
              <div v-if="log.data.grants[0] && (log.data.grants[0].qos & 0x80) > 0">
                <div class="col-6 q-pr-xs text-bold">Error</div>
                <div style="word-break: break-all;"><span class="text-bold">Topic: </span>{{log.data.grants[0].topic}}</div>
                <div style="word-break: break-all;"><span class="text-bold">Message: </span>{{codes[log.data.grants[0].qos]}}</div>
              </div>
            </div>
          </template>
          <template v-else-if="log.type === 'unsubscribe'">
            <div class="log__payload q-pa-sm q-mr-xs q-ml-xs bg-grey-2" style="font-size: .75rem">
              <div style="word-break: break-all;"><span class="text-bold">Topic: </span>{{log.data.topic}}</div>
              <div><span class="text-bold">QoS: </span>{{log.data.options.qos}}</div>
              <div v-if="log.data.options.nl !== undefined"><span class="text-bold">No Local: </span>{{log.data.options.nl}}</div>
              <div v-if="log.data.options.rap !== undefined"><span class="text-bold">Retain as Published: </span>{{log.data.options.rap}}</div>
              <div v-if="log.data.options.rh !== undefined"><span class="text-bold">Retain handling: </span>{{log.data.options.rh}}</div>
            </div>
          </template>
          <template v-else>
            <div class="log__payload q-pa-sm q-mr-xs q-ml-xs bg-grey-2" style="font-size: .75rem">
              <div style="white-space: pre-wrap; word-break: break-all;">{{log.data}}</div>
            </div>
          </template>
          <div class="log__timestamp q-py-xs q-px-sm text-grey-7">{{date.formatDate(log.timestamp, 'DD/MM/YYYY HH:mm:ss')}}</div>
        </q-card>
      </q-card-section>
    </q-card>
  </div>
</template>

<script>
import { date } from 'quasar'
import JsonTree from './JsonTree.vue'
export default {
  name: 'Logs',
  props: [
    'logs'
  ],
  data () {
    return {
      needAutoScroll: true,
      colors: {
        connect: 'green',
        error: 'red',
        offline: 'grey',
        reconnect: 'yellow',
        subscribe: 'orange',
        unsubscribe: 'purple',
        disconnect: 'red',
        end: 'grey',
        created: 'green',
        updated: 'yellow'
      },
      date: date,
      codes: {
        0: '',
        1: 'Unacceptable protocol version',
        2: 'Identifier rejected',
        3: 'Server unavailable',
        4: 'Bad username or password',
        5: 'Not authorized',
        16: 'No matching subscribers',
        17: 'No subscription existed',
        128: 'Unspecified error',
        129: 'Malformed Packet',
        130: 'Protocol Error',
        131: 'Implementation specific error',
        132: 'Unsupported Protocol Version',
        133: 'Client Identifier not valid',
        134: 'Bad User Name or Password',
        135: 'Not authorized',
        136: 'Server unavailable',
        137: 'Server busy',
        138: 'Banned',
        139: 'Server shutting down',
        140: 'Bad authentication method',
        141: 'Keep Alive timeout',
        142: 'Session taken over',
        143: 'Topic Filter invalid',
        144: 'Topic Name invalid',
        145: 'Packet identifier in use',
        146: 'Packet Identifier not found',
        147: 'Receive Maximum exceeded',
        148: 'Topic Alias invalid',
        149: 'Packet too large',
        150: 'Message rate too high',
        151: 'Quota exceeded',
        152: 'Administrative action',
        153: 'Payload format invalid',
        154: 'Retain not supported',
        155: 'QoS not supported',
        156: 'Use another server',
        157: 'Server moved',
        158: 'Shared Subscriptions not supported',
        159: 'Connection rate exceeded',
        160: 'Maximum connect time',
        161: 'Subscription Identifiers not supported',
        162: 'Wildcard Subscriptions not supported'
      }
    }
  },
  methods: {
    getColor (log) {
      if (log.type === 'connect' && (this.codes[log.data.returnCode] || this.codes[log.data.reasonCode])) {
        return 'red'
      }
      if (log.type === 'subscribe' && log.data.restored) { return 'blue' }
      if (log.type === 'subscribe' && log.data.grants && (log.data.grants[0].qos & 0x80) > 0) { return 'red' }
      if (log.type === 'disconnect' && log.data) {
        return 'brown'
      }
      return this.colors[log.type]
    },
    listScroll (e) {
      const el = this.$refs.scroller.$el
      if (el.scrollTop < el.scrollHeight - el.clientHeight) {
        this.needAutoScroll = false
      } else {
        this.needAutoScroll = true
      }
    },
    clearScrollParams () {
      this.currentScrollTop = 0
      this.allScrollTop = 0
      this.needAutoScroll = true
    },
    clearLogsHandler () {
      this.$emit('clear')
    }
  },
  created () {
    this.$nextTick(() => {
      if (this.needAutoScroll && this.$refs.scroller) {
        const el = this.$refs.scroller.$el
        el.scrollTop = el.scrollHeight - el.clientHeight
      }
    })
  },
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
  components: { JsonTree }
}
</script>

<style lang="stylus">
  .mqtt-client__logs
    .logs__wrapper
      border 2px solid #2196f3
      height calc(100% - 16px)
      position relative
      overflow auto
</style>
