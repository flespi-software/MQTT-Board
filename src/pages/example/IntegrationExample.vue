<template>
  <q-page class="column no-wrap" :style-fn="pageFn">
    <div class="row" style="width: 100%; min-height: 0; flex: 1 1 0; overflow: hidden;">
      <integration
        host="./#/integration"
        ref="integrationTest"
        name="integrationTest"
        @ready="readyHandler"
        @updateSettings="updateSettingsHandler"
        style="display: block; border: none; height: 100%;"
        :style="{ flexBasis: showRightPanel ? '70%' : '100%' }"
      />
      <div v-if="showRightPanel" style="flex-basis: 30%; height: 100%; box-sizing: border-box; overflow-y: auto; font-family: monospace; font-size: 12px; padding: 4px; border-left: 1px solid rgba(0,0,0,0.2);">
        <div style="font-weight: bold; font-size: 14px; margin-bottom: 4px;">Application config:</div>
        <json-viewer :data="config" />
      </div>
    </div>
    <div class="column" style="width: 100%; min-height: 0; flex-shrink: 0; border-top: 1px solid rgba(0,0,0,0.12);" :style="{ flexBasis: showBottomPanel ? '20%' : 'auto' }">
      <div class="row items-center q-px-xs" style="height: 32px; flex-shrink: 0; background: #f5f5f5; border-bottom: 1px solid rgba(0,0,0,0.12); position: relative;">
        <q-btn
          flat dense size="sm"
          :icon="showBottomPanel ? 'mdi-chevron-down' : 'mdi-chevron-up'"
          :label="showBottomPanel ? 'Hide logs' : 'Show logs'"
          @click="showBottomPanel = !showBottomPanel"
        />
        <div v-if="showRightPanel" style="position: absolute; left: 70%; top: 0; bottom: 0; width: 1px; background: rgba(0,0,0,0.2);" />
        <q-btn
          flat dense size="sm"
          :icon="showRightPanel ? 'mdi-chevron-right' : 'mdi-chevron-left'"
          :label="showRightPanel ? 'Hide config' : 'Show config'"
          @click="showRightPanel = !showRightPanel"
          style="position: absolute;"
          :style="showRightPanel ? { left: '70%' } : { right: '4px' }"
        />
      </div>
      <div v-if="showBottomPanel" class="row q-gutter-sm q-pa-xs">
        <q-btn label="Set Settings" dense outline @click="setSettings"><q-tooltip><span style="font-size: 16px">Set initial settings to the application</span></q-tooltip></q-btn>
        <q-btn label="Set Active" dense outline @click="setActive"><q-tooltip><span style="font-size: 16px">Activate client by index (starting from 0)</span></q-tooltip></q-btn>
        <q-btn label="Add Publisher" dense outline @click="addPublisherDialog = true"><q-tooltip><span style="font-size: 16px">Add publisher to the active client</span></q-tooltip></q-btn>
        <q-btn label="Add Subscriber" dense outline @click="addSubscriberDialog = true"><q-tooltip><span style="font-size: 16px">Add subscriber to the active client</span></q-tooltip></q-btn>
      </div>
      <textarea v-if="showBottomPanel" class="col-grow" v-model="message" style="width: 100%; box-sizing: border-box; resize: none;" />
    </div>
    <q-dialog v-model="setSettingsDialog">
      <q-card style="width: 700px; max-width: 90vw;">
        <q-card-section>
          <div class="text-h6">Set Settings</div>
        </q-card-section>
        <q-tabs v-model="setSettingsTab" dense align="left" class="text-grey" active-color="primary" indicator-color="primary">
          <q-tab name="empty" label="Empty Config" />
          <q-tab name="default" label="Default Config" />
          <q-tab name="config1" label="Config 1" />
          <q-tab name="config2" label="Config 2" />
        </q-tabs>
        <q-separator />
        <q-tab-panels v-model="setSettingsTab" animated>
          <q-tab-panel v-for="tab in setSettingsTabs" :key="tab" :name="tab" class="q-pa-sm">
            <q-input
              v-model="setSettingsJsonText[tab]"
              type="textarea"
              outlined
              autogrow
              color="grey-9"
              input-style="font-family: monospace; font-size: 13px; line-height: 1.4; min-height: 280px;"
              :error="!!setSettingsJsonError[tab]"
              :error-message="setSettingsJsonError[tab]"
              no-error-icon
              @update:model-value="validateJsonTab(tab)"
            />
          </q-tab-panel>
        </q-tab-panels>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn flat label="Apply" color="primary" @click="applySettings" />
        </q-card-actions>
      </q-card>
    </q-dialog>
    <q-dialog v-model="addPublisherDialog">
      <q-card style="width: 700px; max-width: 90vw;">
        <q-card-section>
          <div class="text-h6">Add Publisher</div>
        </q-card-section>
        <q-card-section>
          <q-input
            v-model="addPublisherJsonText"
            type="textarea"
            outlined
            autogrow
            color="grey-9"
            input-style="font-family: monospace; font-size: 13px; line-height: 1.4; min-height: 280px;"
            :error="!!addPublisherJsonError"
            :error-message="addPublisherJsonError"
            no-error-icon
            @update:model-value="addPublisherJsonError = validateJson(addPublisherJsonText)"
          />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn flat label="Add" color="primary" @click="addPublisher" />
        </q-card-actions>
      </q-card>
    </q-dialog>
    <q-dialog v-model="addSubscriberDialog">
      <q-card style="width: 700px; max-width: 90vw;">
        <q-card-section>
          <div class="text-h6">Add Subscriber</div>
        </q-card-section>
        <q-card-section>
          <q-input
            v-model="addSubscriberJsonText"
            type="textarea"
            outlined
            autogrow
            color="grey-9"
            input-style="font-family: monospace; font-size: 13px; line-height: 1.4; min-height: 280px;"
            :error="!!addSubscriberJsonError"
            :error-message="addSubscriberJsonError"
            no-error-icon
            @update:model-value="addSubscriberJsonError = validateJson(addSubscriberJsonText)"
          />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn flat label="Add" color="primary" @click="addSubscriber" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script>

import { h, reactive, ref, nextTick } from 'vue'
import Integration from "components/Integration.vue"
import exampleConfigDefault from '../../../data/exampleConfigDefault.json'
import exampleConfig1 from '../../../data/exampleConfig1.json'
import exampleConfig2 from '../../../data/exampleConfig2.json'
import exampleAddSubscriber from '../../../data/exampleAddSubscriber.json'
import exampleAddPublisher from '../../../data/exampleAddPublisher.json'

const theme = {
  label: 'text-pink-8',
  typeString: 'text-red-6',
  typeNumberOrBool: 'text-blue-6',
  typeEmpty: 'text-grey-6'
}

function valueClass (value) {
  if (typeof value === 'number' || typeof value === 'boolean') return theme.typeNumberOrBool
  if (typeof value === 'string') return theme.typeString
  return theme.typeEmpty
}

function parseValue (str) {
  const t = str.trim()
  if (t === 'true') return true
  if (t === 'false') return false
  if (t === 'null') return null
  if (t === 'undefined') return undefined
  if (t !== '' && !isNaN(Number(t))) return Number(t)
  if (t.startsWith('"') && t.endsWith('"')) {
    try { return JSON.parse(t) } catch (e) { return t.slice(1, -1) }
  }
  return t
}

const JsonViewer = {
  name: 'JsonViewer',
  props: {
    data: {},
    editable: { type: Boolean, default: false },
    collapsed: { type: Boolean, default: false }
  },
  setup (props) {
    const expanded = reactive({})
    const editingKey = ref(null)
    const editValue = ref('')
    const editInputEl = ref(null)

    if (props.data && typeof props.data === 'object') {
      Object.keys(props.data).forEach((key, index) => {
        expanded[Array.isArray(props.data) ? key : index] = !props.collapsed
      })
    }

    function toggle (idx) {
      expanded[idx] = !expanded[idx]
    }

    function startEdit (key, value) {
      editingKey.value = key
      editValue.value = JSON.stringify(value)
      nextTick(() => {
        if (editInputEl.value) {
          editInputEl.value.focus()
          editInputEl.value.select()
        }
      })
    }

    function commitEdit (key) {
      if (editingKey.value === null) return
      props.data[key] = parseValue(editValue.value)
      editingKey.value = null
    }

    function cancelEdit () {
      editingKey.value = null
    }

    function renderLeaf (key, value) {
      const children = [
        h('span', { class: theme.label }, key),
        h('span', {}, ' : ')
      ]
      if (props.editable && editingKey.value === key) {
        children.push(h('input', {
          ref: editInputEl,
          value: editValue.value,
          class: valueClass(value),
          style: 'border: 1px solid rgba(0,0,0,0.3); border-radius: 2px; padding: 0 2px; font-family: monospace; font-size: inherit; outline: none; background: transparent;',
          onInput: (e) => { editValue.value = e.target.value },
          onKeydown: (e) => {
            if (e.key === 'Enter') commitEdit(key)
            if (e.key === 'Escape') cancelEdit()
          },
          onBlur: () => commitEdit(key)
        }))
      } else {
        children.push(h('span', {
          class: [valueClass(value), props.editable ? 'jv-editable' : ''],
          onDblclick: props.editable ? () => startEdit(key, value) : undefined
        }, JSON.stringify(value)))
      }
      return h('div', { class: 'jv-indent' }, children)
    }

    function renderObject (key, value, idx) {
      const isExp = !!expanded[idx]
      const childIsArr = Array.isArray(value)
      const items = [
        h('div', {
          class: 'cursor-pointer',
          onClick: () => toggle(idx)
        }, [
          h('span', { style: 'color: #616161; font-size: 10px; margin-right: 2px;' }, isExp ? '\u25BC' : '\u25B6'),
          h('span', { class: theme.label }, key),
          h('span', {}, ` : ${childIsArr ? `Array [${value.length}]` : 'Object'}`)
        ])
      ]
      if (isExp) {
        items.push(h(JsonViewer, {
          data: value,
          editable: props.editable,
          collapsed: props.collapsed,
          class: 'jv-indent'
        }))
      }
      return h('div', { class: 'jv-indent' }, items)
    }

    return () => {
      const data = props.data
      if (!data || typeof data !== 'object') {
        return h('div', {}, [
          h('span', { class: valueClass(data), style: 'font-size: 1rem;' }, `${data}`)
        ])
      }
      const isArr = Array.isArray(data)
      const children = [h('span', {}, isArr ? '[' : '{')]
      Object.entries(data).forEach(([key, value], index) => {
        const idx = isArr ? key : index
        if (value && typeof value === 'object') {
          children.push(renderObject(key, value, idx))
        } else {
          children.push(renderLeaf(key, value))
        }
      })
      children.push(h('span', {}, isArr ? ']' : '}'))
      return h('div', {}, children)
    }
  }
}

export default {
  name: "IntegrationExample",
  components: { Integration, JsonViewer },
  data () {
    return {
      config: {
        settings: undefined,
        useLS: undefined,
        entities: undefined,
        whiteLabel: undefined,
        secure: undefined,
        clientsCloseable: undefined,
        color: undefined,
        accentColor: undefined,
        configuredClients: undefined
      },
      message: '',
      showBottomPanel: true,
      showRightPanel: true,
      setSettingsDialog: false,
      setSettingsTab: 'empty',
      setSettingsTabs: ['empty', 'default', 'config1', 'config2'],
      setSettingsJsonText: {
        empty: JSON.stringify({}, null, 2),
        default: JSON.stringify(exampleConfigDefault, null, 2),
        config1: JSON.stringify(exampleConfig1, null, 2),
        config2: JSON.stringify(exampleConfig2, null, 2)
      },
      setSettingsJsonError: {
        empty: '',
        default: '',
        config1: '',
        config2: ''
      },
      addPublisherDialog: false,
      addPublisherJsonText: JSON.stringify(exampleAddPublisher, null, 2),
      addPublisherJsonError: '',
      addSubscriberDialog: false,
      addSubscriberJsonText: JSON.stringify(exampleAddSubscriber, null, 2),
      addSubscriberJsonError: ''
    }
  },
  computed: {},
  methods: {
    prependText(text, event, data) {
      let prefix = '-----------------\n>>> command >>>: '
      if (event) {
        prefix = '-----------------\n<<< event <<<: '
      }
      this.message = prefix + text + (data ? ' ' + JSON.stringify(data) : '') + '\n' + this.message
    },
    pageFn (offset) {
      return { height: `calc(100vh - ${offset}px)`, overflow: 'hidden' }
    },
    setSettings () {
      this.setSettingsDialog = true
    },
    validateJsonTab (tab) {
      try {
        JSON.parse(this.setSettingsJsonText[tab])
        this.setSettingsJsonError[tab] = ''
      } catch (e) {
        this.setSettingsJsonError[tab] = e.message
      }
    },
    applySettings () {
      const tab = this.setSettingsTab
      try {
        const config = JSON.parse(this.setSettingsJsonText[tab])
        this.config = JSON.parse(JSON.stringify(config))
        this.prependText(this.$refs.integrationTest.setSettings(this.config))
        this.setSettingsDialog = false
      } catch (e) {
        this.setSettingsJsonError[tab] = e.message
      }
    },
    setActive () {
      this.$q.dialog({
        title: 'Set Active',
        message: 'Enter client index:',
        prompt: { model: '0', type: 'number' },
        cancel: true
      }).onOk(index => {
        this.prependText(this.$refs.integrationTest.setActive(Number(index)))
      })
    },
    validateJson (text) {
      try {
        JSON.parse(text)
        return ''
      } catch (e) {
        return e.message
      }
    },
    addPublisher () {
      try {
        const config = JSON.parse(this.addPublisherJsonText)
        this.prependText(this.$refs.integrationTest.addPublisher(config))
        this.addPublisherDialog = false
      } catch (e) {
        this.addPublisherJsonError = e.message
      }
    },
    addSubscriber () {
      try {
        const config = JSON.parse(this.addSubscriberJsonText)
        this.prependText(this.$refs.integrationTest.addSubscriber(config))
        this.addSubscriberDialog = false
      } catch (e) {
        this.addSubscriberJsonError = e.message
      }
    },
    readyHandler () {
      this.prependText("ready", 1)

      // allication initialization sequence:
      // this.$refs.integrationTest.setSettings(this.config)
      // this.$refs.integrationTest.setActive(0)
      // this.$refs.integrationTest.addPublisher({
      //   topic: 'topic/to/publish',
      //   payload: 'test',
      //   options: { qos: 1, retain: false, dup: false, properties: { } }
      // })
      // this.$refs.integrationTest.addSubscriber({
      //   topic: 'topic/to/subscribe',
      //   mode: 1,
      //   treeField: '',
      //   highlight: true,
      //   options: { qos: 1, nl: false, rap: false, rh: 0, properties: {} },
      //   unsubscribeProperties: {}
      // })

    },
    updateSettingsHandler (config) {
      this.prependText("updateSettings", 1, config)
      this.config = { ...this.config, ...config }
    }
  }
}

</script>

<style>
.jv-indent {
  margin-left: 16px;
}
.jv-editable {
  cursor: pointer;
  border-bottom: 1px dashed transparent;
}
.jv-editable:hover {
  border-bottom-color: currentColor;
}
</style>
