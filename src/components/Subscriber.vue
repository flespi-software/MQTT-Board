<template>
  <div class="mqtt-client__subscriber">
    <q-card class="subscriber__item q-ma-sm" v-if="!status && isPlayed === null">
      <q-card-section class="q-pa-none">
        <q-toolbar class="q-pr-none q-pl-none text-white bg-orange">
          <q-btn v-if="showBack" flat dense icon="mdi-menu-left" class="bg-orange-7 pane-move-btn" @click="$emit('move-back')">
            <q-tooltip>Move to the left</q-tooltip>
          </q-btn>
          <div v-else class="pane-move-btn-spacer"></div>
          <q-toolbar-title>Subscriber</q-toolbar-title>
          <q-btn round flat :disable="!isValidSubscriber" icon="mdi-play" @click="subscribeMessageHandler">
            <q-tooltip>Subscribe</q-tooltip>
          </q-btn>
          <q-btn round flat icon="mdi-eye-off-outline" @click="$emit('hide')">
            <q-tooltip>Hide panel</q-tooltip>
          </q-btn>
          <q-btn round flat icon="mdi-dots-vertical">
            <q-menu anchor="bottom right" self="top right" class="mqtt-board__popup">
              <q-list>
                <q-item v-close-popup @click="removeSubscriber()" clickable v-ripple>
                  <q-item-section avatar><q-icon color="red" name="mdi-delete-outline" /></q-item-section>
                  <q-item-section><q-item-label>Remove</q-item-label></q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-btn>
          <q-btn v-if="showForth" flat dense icon="mdi-menu-right" class="bg-orange-7 pane-move-btn" @click="$emit('move-forth')">
            <q-tooltip>Move to the right</q-tooltip>
          </q-btn>
        </q-toolbar>
      </q-card-section>
      <q-card-section class="item__main q-py-none">
        <div class="q-pt-md">
          <q-input outlined autogrow hide-bottom-space no-error-icon reactive-rules
            ref="topicInput"
            type="textarea"
            color="grey-9"
            class="q-mb-xs topic-font"
            autocomplete="off"
            autocorrect="off"
            autocapitalize="off"
            spellcheck="false"
            v-model="config.topic"
            label="Topic"
            :disable="status"
            :error="validateSetting('topic')"
            :error-message="getValidateMessage('topic')"
          >
            <q-resize-observer @resize="adjustInputHeight('topicInput')" />
            <template #after>
              <q-icon name="mdi-information-outline"><q-tooltip>{{getDescription('topic')}}</q-tooltip></q-icon>
            </template>
            <template #append>
              <q-btn color="yellow-9" icon="mdi-alert" @click="showSharedSubscriptionNotification" flat round v-if="config.topic.indexOf('$share') === 0"/>
              <q-btn color="red-9" icon="icon-flespi2-02-01" flat round v-if="isFlespiMode" @click="flespiTopicModal = true">
                <q-tooltip>flespi topic constructor</q-tooltip>
              </q-btn>
            </template>
          </q-input>
          <q-btn-toggle v-close-popup flat rounded
            toggle-text-color="grey-9"
            text-color="grey-6"
            style="width: 100%"
            class="q-mt-md"
            v-model="config.mode"
            :options="modeSelectOptions"
            @update:model-value="changeModeHandler"
            />
          <q-input outlined hide-bottom-space
            v-if="config.mode === 1 && version === 5"
            color="grey-9"
            class="q-my-xs"
            v-model="config.treeField"
            label="Field to group by"
            hint="User properties field name by which messages will be grouped.">
            <template #after>
              <q-icon name="mdi-information-outline">
                <q-tooltip max-width="200px">{{getDescription('treeField')}}</q-tooltip>
              </q-icon>
            </template>
          </q-input>
          <q-toggle v-model="config.highlight" color="grey-9" label="Highlight messages content" class="q-my-md" />
          <q-expansion-item :model-value="true" class="q-mt-sm q-mb-sm bg-grey-2" label="Options">
            <div>
              <div class="q-mx-md" style="line-height: 34px;">
                <div style="width: calc(100% - 36px);display:inline-flex;">
                  QoS
                  <q-btn-toggle :disable="status" flat rounded toggle-text-color="grey-9" text-color="grey-6" class="q-ml-sm" v-model="config.options.qos" :options="[{label: '0', value: 0},{label: '1', value: 1},{label: '2', value: 2}]"/>
                </div>
                <q-icon size="24px" color="grey-7" style="margin-left: 12px" name="mdi-information-outline"><q-tooltip max-width="200px">{{getDescription('options.qos')}}</q-tooltip></q-icon>
              </div>
              <div class="q-mr-md q-ml-sm" v-if="version === 5">
                <q-checkbox :disable="status" style="width: calc(100% - 36px)" color="grey-9" v-model="config.options.nl" label="No local"/>
                <q-icon size="24px" color="grey-7" style="margin-left: 12px" name="mdi-information-outline"><q-tooltip max-width="200px">{{getDescription('options.nl')}}</q-tooltip></q-icon>
              </div>
              <div class="q-mr-md q-ml-sm" v-if="version === 5">
                <q-checkbox :disable="status" style="width: calc(100% - 36px)" color="grey-9" v-model="config.options.rap" label="Retain as Published"/>
                <q-icon size="24px" color="grey-7" style="margin-left: 12px" name="mdi-information-outline"><q-tooltip max-width="200px">{{getDescription('options.rap')}}</q-tooltip></q-icon>
              </div>
              <div class="q-mx-md" style="line-height: 34px;" v-if="version === 5">
                <div style="width: calc(100% - 36px);display:inline-flex;">
                  Retain handling
                  <q-btn-toggle :disable="status" flat rounded toggle-text-color="grey-9" text-color="grey-6" class="q-ml-sm" v-model="config.options.rh" :options="[{label: '0', value: 0},{label: '1', value: 1},{label: '2', value: 2}]"/>
                </div>
                <q-icon size="24px" color="grey-7" style="margin-left: 12px" name="mdi-information-outline"><q-tooltip max-width="200px">{{getDescription('options.rh')}}</q-tooltip></q-icon>
              </div>
              <q-expansion-item v-if="version === 5" class="q-mt-sm bg-grey-4" label="Properties">
                <div class="q-px-md q-py-sm">
                  <q-input
                    placeholder="123"
                    :disable="status" color="grey-9" label="Subscription identifier (numeric)" type="number" outlined class="q-my-xs" hide-bottom-space
                    v-model.number="config.options.properties.subscriptionIdentifier"
                    @update:model-value="(val) => { if (!val) { config.options.properties.subscriptionIdentifier = undefined } }"
                    :error="validateSetting('options.properties.subscriptionIdentifier')"
                    :error-message="getValidateMessage('options.properties.subscriptionIdentifier')"
                    no-error-icon
                  >
                    <template #after>
                      <q-icon name="mdi-information-outline"><q-tooltip>{{getDescription('options.properties.subscriptionIdentifier')}}</q-tooltip></q-icon>
                    </template>
                  </q-input>
                  <div v-if="!status || config.options.properties.userProperties">
                    <div class="q-mt-md q-mb-sm">
                      <div style="width: calc(100% - 36px);display:inline-flex;">User Properties</div>
                      <q-icon size="24px" color="grey-7" style="margin-left: 12px" name="mdi-information-outline">
                        <q-tooltip>{{getDescription('options.properties.userProperties')}}</q-tooltip>
                      </q-icon>
                    </div>
                    <q-checkbox style="display: flex;" color="grey-9" class="q-mt-sm q-mb-sm" v-model="needUseSubUserPropsToUnsub" label="Also use to unsubscribe"/>
                    <div>
                      <q-list v-if="config.options.properties.userProperties" class="q-mb-xs">
                        <q-item v-for="(value, name) in config.options.properties.userProperties" :key="`${name}: ${value}`" style="min-height: 17px;">
                          <q-icon v-if="!status" class="q-mr-sm cursor-pointer" size='1rem' @click="removeSubscriberUserProperty(name)" name="mdi-close-circle"/>
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
              <q-separator dark color="grey-5"/>
              <q-expansion-item v-if="version === 5 && !needUseSubUserPropsToUnsub" :model-value="!!config.unsubscribeProperties.userProperties" class="q-mb-sm bg-grey-4" label="Unsubscribe properties">
                <div v-if="!status || config.unsubscribeProperties.userProperties" class="q-px-md q-py-sm">
                  <div class="q-mt-md q-mb-sm">
                    <div style="width: calc(100% - 36px);display:inline-flex;">User Properties</div>
                    <q-icon size="24px" color="grey-7" style="margin-left: 12px" name="mdi-information-outline">
                      <q-tooltip>{{getDescription('unsubscribeProperties.userProperties')}}</q-tooltip>
                    </q-icon>
                  </div>
                  <div>
                    <q-list v-if="config.unsubscribeProperties.userProperties" class="q-mb-xs">
                      <q-item v-for="(value, name) in config.unsubscribeProperties.userProperties" :key="`${name}: ${value}`" style="min-height: 17px;">
                        <q-icon v-if="!status" class="q-mr-sm cursor-pointer" size='1rem' @click="removeUnsubscribeUserProperty(name)" name="mdi-close-circle"/>
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
      <q-toolbar class="q-pr-none q-pl-none text-white bg-orange" style="border-top-right-radius: 0; border-top-left-radius: 0;">
        <q-btn v-if="showBack" flat dense icon="mdi-menu-left" class="bg-orange-7 pane-move-btn" @click="$emit('move-back')">
          <q-tooltip>Move to the left</q-tooltip>
        </q-btn>
        <div v-else class="pane-move-btn-spacer"/>
        <q-toolbar-title style="width: calc(100% - 150px)">
          <span>
            {{config.topic}}
            <q-tooltip>{{config.topic}}</q-tooltip>
          </span>
        </q-toolbar-title>
        <q-btn round flat icon="mdi-file-tree" @click="toggleFilterMode" v-if="config.mode === 0">
          <q-tooltip>Open topics tree</q-tooltip>
        </q-btn>
        <q-btn round flat icon="mdi-stop" @click="unsubscribeMessageHandler()" title="Unsubscribe"/>
        <q-btn round flat :icon="isPlayed && status !== 'paused' ? 'mdi-pause' : 'mdi-play'" @click="playStopHandler" :title="isPlayed && status !== 'paused' ? 'Pause' : 'Resume'">
          <q-chip v-if="status === 'paused' && !!modelValue.missedMessages" color="red" dense text-color="white" size=".6rem" class="absolute-top-right" style="top: -5px; right: -5px;" square>
            {{modelValue.missedMessages}}
          </q-chip>
        </q-btn>
        <q-btn round flat icon="mdi-dots-vertical">
          <q-menu anchor="bottom right" self="top right" class="mqtt-board__popup">
            <q-list>
              <q-item v-close-popup @click="clearMessagesHandler" clickable v-ripple>
                <q-item-section avatar><q-icon name="mdi-playlist-remove" /></q-item-section>
                <q-item-section><q-item-label>Clear messages</q-item-label></q-item-section>
              </q-item>
              <q-separator spaced/>
              <q-item v-close-popup @click="removeSubscriber()" clickable v-ripple>
                <q-item-section avatar><q-icon color="red" name="mdi-delete-outline" /></q-item-section>
                <q-item-section><q-item-label>Remove</q-item-label></q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
        <q-btn v-if="showForth" flat dense icon="mdi-menu-right" class="bg-orange-7 pane-move-btn" @click="$emit('move-forth')">
          <q-tooltip>Move to the right</q-tooltip>
        </q-btn>
      </q-toolbar>
      <div style="position: relative; height: calc(100% - 50px);">
        <q-splitter horizontal
          v-if="config.mode === 0 && filterMode"
          v-model="filterSplitterRatio"
          :limits="[10, 90]"
          separator-class="subscriber__splitter-sep"
          class="subscriber__list"
          style="height: auto;"
        >
          <template #before>
            <div class="fit column" style="position: relative;">
              <q-btn dense flat round size="sm" icon="mdi-close" color="grey-7" class="absolute-top-right" style="z-index: 1; right: 10px; top: 5px;" @click="toggleFilterMode">
                <q-tooltip>Close topics tree</q-tooltip>
              </q-btn>
              <div v-if="$q.platform.is.desktop" class="text-grey-7 text-italic text-right" style="padding: 7px 45px 4px 12px; font-size: 12px;">
                Ctrl+click to select multiple nodes
              </div>
              <div class="scroll col" :style="$q.platform.is.desktop ? null : 'padding-top: 20px;'">
                <tree selectable
                  v-if="Object.keys(filterTreeData).length"
                  :data="filterTreeData"
                  :selectedTopics="selectedFilterTopics"
                  :expandToTopic="filterExpandTopic"
                  @select="selectFilterTopic"
                />
              </div>
            </div>
          </template>
          <template #after>
            <q-virtual-scroll
              v-if="messages && messages.length"
              ref="scroller"
              class="fit"
              :items="renderedMessages"
              @virtual-scroll="onScroll"
              virtual-scroll-item-size="140"
            >
              <template v-slot="{ item }">
                <message :message="item" :highlight="config.highlight" :key="`subMsg_${item.topic}_${item._seq}`" @action-send="(item) => { $emit('action-send', item) }" />
              </template>
            </q-virtual-scroll>
            <div v-else class="subscriber__list--empty">No messages</div>
          </template>
        </q-splitter>
        <q-virtual-scroll
          v-else-if="messages && messages.length && config.mode === 0"
          ref="scroller"
          class="subscriber__list"
          :items="renderedMessages"
          @virtual-scroll="onScroll"
          virtual-scroll-item-size="140"
          >
          <template v-slot="{ item }">
            <message :message="item" :highlight="config.highlight" :key="`subMsg_${item.topic}_${item._seq}`" @action-send="(item) => { $emit('action-send', item) }" />
          </template>
        </q-virtual-scroll>
        <div class="subscriber__list subscriber__list--tree" v-else-if="config.mode === 1 && Object.keys(renderedMessages).length && subscribed">
          <q-splitter horizontal
            v-model="treeSplitterRatio"
            :limits="treeModeValue ? [10, 90] : [100, 100]"
            :disable="!treeModeValue"
            :separator-class="treeModeValue ? 'subscriber__splitter-sep' : 'hidden'"
            style="height: 100%;"
          >
            <template #before>
              <div class="scroll fit">
                <tree :topic="treeSelectedTopic" :data="renderedMessages" :expandByValue="true" @change="treeValueChangeHandler"/>
              </div>
            </template>
            <template #after>
              <div class="scroll fit tree__message" v-if="treeModeValue">
                <template v-for="(message, key, index) in treeModeValue" :key="`tree-message-${key}-${index}`">
                  <message :message="message" :highlight="config.highlight" @action-send="(message) => { $emit('action-send', message) }" />
                </template>
              </div>
            </template>
          </q-splitter>
        </div>
        <div v-else-if="status && subscribed && !processingFlag" class="subscriber__list--empty">No messages</div>
        <q-inner-loading :showing="isNeedLoading">
          <q-spinner-gears size="150px" color="orange"/>
        </q-inner-loading>
      </div>
    </q-card>
    <flespi-topic-modal
      v-if="flespiTopicModal"
      color="orange"
      :opened="flespiTopicModal"
      :model-value="config.topic"
      :connector="client.restBus"
      @update:model-value="config.topic = $event"
      @close="flespiTopicModal = false"
    />
  </div>
</template>

<script>
import FlespiTopicModal from './FlespiTopicModal.vue'
import Tree from './TreeModeView.vue'
import Message from './Message.vue'
import validateEntities from '../mixins/validateEntities.js'
import jsonTreeByMessages from '../mixins/jsonTreeByMessages.js'
import { fixedTopicPrefix, topicMatchesFilter, sanitizeRatio, filterTreeNeedsRebuild } from '../mixins/topicFilter.js'
import { subscriber as declarations } from '../mixins/declarations.js'
import get from 'lodash/get'
import isNil from 'lodash/isNil'

const
  LIST_MODE = 0,
  TREE_MODE = 1,
  SCROLL_BOTTOM_THRESHOLD = 5

export default {
  name: 'SubscriberPanel',
  props: [
    'modelValue',
    'messages',
    'status',
    'client',
    'subscribed',
    'showBack',
    'showForth'
  ],
  emits: ['update:modelValue', 'hide', 'remove', 'subscribe', 'unsubscribe', 'play', 'pause', 'clear', 'action-send', 'move-back', 'move-forth'],
  data () {
    return {
      declarations,
      version: this.client.config.protocolVersion,
      filterMode: false,
      config: this.modelValue,
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
          label: 'List',
          value: LIST_MODE
        },
        {
          label: 'Tree',
          value: TREE_MODE
        }
      ],
      stickToBottom: true,
      isPlayed: this.status || null,
      selectedFilterTopics: [],
      filterTreeData: {}, // filter tree  for subscriber's list mode
      lastMergedSeq: -1,  // cursor of the last merged message in the filter tree
      lastMergedFirstSeq: -1, // _seq of the oldest merged message; used to determine if the buffer was rotated
      lastMergedLength: 0,
      treeSelectedTopic: null,
      processingFlag: null,
      Message,
      flespiTopicModal: false
    }
  },
  computed: {
    isFlespiMode () {
      return this.client.config.host.indexOf('flespi') > -1
    },
    filterSplitterRatio: {
      get () {
      // guard against a null/NaN value persisted from an earlier session (JSON serializes NaN as null) to ensure QSplitter always receives a valid property
        return sanitizeRatio(this.config.filterSplitterRatio, 20)
      },
      set (ratio) {
        this.config.filterSplitterRatio = ratio
      }
    },
    treeSplitterRatio: {
      get () {
        if (!this.treeModeValue) {
          // when no node is selected the tree should take the full height (ratio 100, splitter disabled)
          return 100
        }
        return sanitizeRatio(this.config.treeSplitterRatio, 60)
      },
      set (ratio) {
        // persist real drags and ignore the normalization emit that can fire while the messages panel is closed
        if (this.treeModeValue) {
          this.config.treeSplitterRatio = ratio
        }
      }
    },
    // if the subscription topic has fixed (non-wildcard) prefix — the filter tree opens with the fixed topic segments opened
    filterExpandTopic () {
      return fixedTopicPrefix(this.config.topic)
    },
    renderedMessages () {
      let res = []
      switch (this.config.mode) {
        case LIST_MODE: {
          res = this.selectedFilterTopics.length
            ? this.messages.filter(message => topicMatchesFilter(message.topic, this.selectedFilterTopics))
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
    // current sequence number of the last message, used to trigger scroll to bottom after new messages arrive
    lastMessageSeq () {
      if (!Array.isArray(this.messages) || !this.messages.length) { return null }
      return this.messages[this.messages.length - 1]._seq
    },
    treeModeValue () {
      let result = null
      if (this.config.mode === TREE_MODE) {
        if (this.treeSelectedTopic === null) { return null }
        const path = this.treeSelectedTopic.split('/')
        result = path.reduce((result, pathElement, pathIndex) => {
          if (!result || !result[pathElement]) {
            this.treeValueChangeHandler(null)
            result = null
          } else if (pathIndex === path.length - 1) {
            result = result[pathElement].value && Object.keys(result[pathElement].value).reduce((res, key) => {
              res[key] = result[pathElement].value[key]
              return res
            }, {})
          } else {
            result = result[pathElement].children
          }
          return result
        }, this.messages)
        if (!result || !Object.keys(result).length) {
          result = null
        }
      }
      return result
    },
    validationModel () {
      return this.validateSubscriber(this.config, true)
    },
    isValidSubscriber () {
      return !Object.keys(this.validationModel).length
    },
    isNeedLoading () {
      return this.config.mode === 1 && this.status && (!this.subscribed || !!this.processingFlag)
    },
    shouldCheckProcessing () {
      return this.config.mode === 1 && this.status && this.subscribed && this.processingFlag === null
    }
  },
  mounted () {
    // Snap to the true bottom whenever QVirtualScroll's content height grows after a scrollTo(..., 'end-force').
    // The last item's real size only becomes known after it renders, so the post-scrollTo resize is our signal to correct
    // the gap left by size-estimate-based positioning.
    this.bottomStickRO = new ResizeObserver(() => {
      if (this.stickToBottom && this.$refs.scroller) {
        const el = this.$refs.scroller.$el
        el.scrollTop = el.scrollHeight
      }
    })
    this.$nextTick(() => {
      if (this.stickToBottom && this.renderedMessages.length > 0 && this.$refs.scroller) {
        this.$refs.scroller.refresh(this.renderedMessages.length - 1)
      }
    })
    // Wait for fonts to load before measuring input heights — scrollHeight-based
    // auto-sizing produces incorrect results if measured with fallback font metrics
    document.fonts.ready.then(() => {
      this.adjustInputHeight('topicInput')
    })
  },
  beforeUnmount () {
    this.bottomStickRO?.disconnect()
  },
  methods: {
    isNil,
    adjustInputHeight (refName) {
        const inputEl = this.$refs[refName]?.nativeEl
        if (inputEl) {
          inputEl.style.height = '1px' // collapse first so scrollHeight reflects true content height, not current element height
          inputEl.style.height = inputEl.scrollHeight + 'px'
        }
    },
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
          'action-send': (message) => { this.$emit('action-send', message) }
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
        this.config.unsubscribeProperties.userProperties = Object.assign({}, this.config.options.properties.userProperties)
      }
      this.$emit('subscribe')
    },
    unsubscribeMessageHandler () {
      this.isPlayed = null
      this.treeSelectedTopic = null
      this.filterMode = false
      this.selectedFilterTopics = []
      this.stickToBottom = true
      this.$emit('unsubscribe')
      this.processingFlag = null
    },
    toggleFilterMode () {
      this.filterMode = !this.filterMode
      if (!this.filterMode) {
        this.selectedFilterTopics = []
      }
    },
    buildFilterTree () {
      const tree = {}
      jsonTreeByMessages(this.messages, '', tree, true)
      this.filterTreeData = tree
      this.lastMergedSeq = this.messages.length ? this.messages[this.messages.length - 1]._seq : -1
      this.lastMergedFirstSeq = this.messages.length ? this.messages[0]._seq : -1
      this.lastMergedLength = this.messages.length
    },
    updateFilterTree () {
      if (!this.filterMode || this.config.mode !== LIST_MODE) { return }
      const firstSeq = this.messages.length ? this.messages[0]._seq : -1
      if (filterTreeNeedsRebuild(this.messages.length, firstSeq, this.lastMergedLength, this.lastMergedFirstSeq)) {
        this.buildFilterTree()
        return
      }
      const fresh = this.messages.filter(message => message._seq > this.lastMergedSeq)
      if (fresh.length) {
        jsonTreeByMessages(fresh, '', this.filterTreeData, true)
        this.lastMergedSeq = fresh[fresh.length - 1]._seq
      }
      this.lastMergedLength = this.messages.length
    },
    selectFilterTopic (topic, multi) {
      if (multi) {
        // multi selection: add or remove the topic from the list of selected filters
        const index = this.selectedFilterTopics.indexOf(topic)
        if (index === -1) {
          this.selectedFilterTopics.push(topic)
        } else {
          this.selectedFilterTopics.splice(index, 1)
        }
      } else if (this.selectedFilterTopics.length === 1 && this.selectedFilterTopics[0] === topic) {
        // single selection on the same topic: topic is deselected, all messages will be shown again
        this.selectedFilterTopics = []
      } else {
        // single selection on new topic: new topic is selected
        this.selectedFilterTopics = [topic]
      }
    },
    removeSubscriber () {
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
      delete this.config.options.properties.userProperties[name]
      if (!Object.keys(this.config.options.properties.userProperties).length) {
        this.config.options.properties.userProperties = undefined
      }
    },
    addUnsubscribeUserProperty () {
      if (!this.config.unsubscribeProperties.userProperties) {
        this.config.unsubscribeProperties.userProperties = {}
      }
      this.config.unsubscribeProperties.userProperties[this.unsubscribeUserProperty.name] = this.unsubscribeUserProperty.value
      this.unsubscribeUserProperty = {
        value: '',
        name: ''
      }
    },
    removeUnsubscribeUserProperty (name) {
      delete this.config.unsubscribeProperties.userProperties[name]
      if (!Object.keys(this.config.unsubscribeProperties.userProperties).length) {
        this.config.unsubscribeProperties.userProperties = undefined
      }
    },
    showSharedSubscriptionNotification () {
      this.$q.dialog({
        title: 'Shared subscription info',
        message: 'You are trying to subscribe to a Shared Subscription. Publication that matches its Topic Filter is sent to one of the subscribed sessions only.',
        color: 'primary',
        ok: true,
        persistent: true
      })
    },
    onScroll (e) {
      if (e.direction === 'decrease') {
        // user scrolled up — pause auto-stick to bottom
        this.stickToBottom = false
      } else if (e.direction === 'increase') {
        // scrolled down — re-enable auto-stick once the bottom is reached
        const el = (e.ref && e.ref.$el) || (this.$refs.scroller && this.$refs.scroller.$el)
        if (!el) { return }
        if (el.scrollHeight - el.scrollTop - el.clientHeight <= SCROLL_BOTTOM_THRESHOLD) {
          this.stickToBottom = true
        }
      }
    },
    forceScrollToBottom () {
      this.$nextTick(() => {
        if (this.stickToBottom && this.renderedMessages.length > 0 && this.$refs.scroller) {
          // re-observe to schedule the callback for the next layout cycle ("snap to the true bottom after next layout")
          this.bottomStickRO.disconnect()
          this.bottomStickRO.observe(this.$refs.scroller.$el)
          this.$refs.scroller.scrollTo(this.renderedMessages.length - 1, 'end-force')
        }
      })
    },
    clearMessagesHandler () {
      this.$emit('clear')
    },
    treeValueChangeHandler (value) {
      this.treeSelectedTopic = value
    },
    changeModeHandler () {
      this.treeSelectedTopic = null
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
  },
  watch: {
    shouldCheckProcessing (val) {
      if (val) { this.checkProcessing() }
    },
    lastMessageSeq () {
      this.updateFilterTree()
      this.forceScrollToBottom()
    },
    filterMode (open) {
      if (open) {
        this.buildFilterTree()
      } else {
        this.filterTreeData = {}
        this.lastMergedSeq = -1
        this.lastMergedFirstSeq = -1
        this.lastMergedLength = 0
      }
    },
    selectedFilterTopics: {
      deep: true,
      handler () {
        // stick to the bottom when navigating through the topic filter
        this.stickToBottom = true
        this.forceScrollToBottom()
      }
    },
    config: {
      deep: true,
      handler (val) {
        this.$emit('update:modelValue', val)
      }
    },
    status (val) {
      if (val) {
        this.loadingStatus = false
        if (val === true) { // val may be true, false or "paused"
          this.isPlayed = true
        }
      } else {
        this.isPlayed = null
      }
    },
    modelValue: {
      deep: true,
      handler (value) {
        this.config = value
      }
    }
  },
  components: {
    Tree, Message, FlespiTopicModal
  },
  mixins: [validateEntities]
}
</script>

<style lang="scss">
  .pane-move-btn.q-btn {
    border-radius: 0 !important;
    min-width: 20px !important;
    width: 20px !important;
    align-self: stretch;
    height: auto;
    opacity: 0;
    .q-icon {
      opacity: 0;
    }
  }
  .pane-move-btn-spacer {
    width: 16px;
    flex-shrink: 0;
  }
  .mqtt-client__subscriber {
    .subscriber__item {
      border: 2px solid orange;
      height: calc(100% - 16px);
      position: relative;

      .item__main {
        position: relative;
        height: calc(100% - 50px);
        overflow: auto;
      }

      .q-toolbar:hover {
        .pane-move-btn.q-btn,
        .q-icon {
          opacity: 1;
          transition: opacity 0.4s ease-in-out;
        }
      }
    }

    .subscriber__list {
      position: absolute;
      top: 0;
      bottom: 0;
      right: 0;
      left: 0;
      height: auto !important;

      .tree__message {
        box-shadow: 0 1px 5px rgba(0,0,0,0.2), 0 2px 2px rgba(0,0,0,0.14), 0 3px 1px -2px rgba(0,0,0,0.12);
      }
    }

    // drag handle between the topics tree and the messages list, with three centered dots hinting that the divider is draggable
    .subscriber__splitter-sep {
      height: 5px !important;

      &::after {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        width: 2px;
        height: 2px;
        border-radius: 50%;
        background: var(--q-grey-7, #757575);
        transform: translate(-50%, -50%);
        box-shadow: -5px 0 0 var(--q-grey-7, #757575), 5px 0 0 var(--q-grey-7, #757575);
      }
    }

    .subscriber__list--empty {
      text-align: center;
      margin-top: 10px;
      font-size: 1.3rem;
      color: #333;
    }
  }
</style>
