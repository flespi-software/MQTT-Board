<template>
  <div :class="{'flespi-topic-selector--mobile': mobile}">
    <div ref="topicRow" class="flespi-topic-selector__topic-row" :class="{'flespi-topic-selector__topic-row--mobile': mobile}">
      <span class="text-h6">flespi/</span>
      <template v-for="(level, index) in levels" :key="index">
        <span v-if="index > 0" class="text-h6">/</span>
        <span
          class="text-h6 flespi-topic-selector__segment-group"
          :style="getSegmentColorStyle(index)"
        >
          <template v-for="(val, vi) in level.selected" :key="vi">
            <span v-if="vi > 0" class="flespi-topic-selector__comma">,</span>
            <span class="flespi-topic-selector__segment-value">{{ val }}</span>
          </template>
          <span v-if="!level.selected.length" class="flespi-topic-selector__segment-value">...</span>
          <q-icon
            v-if="level.isIdLevel && !level.selected.includes('+')"
            name="cancel"
            size="14px"
            color="grey-7"
            class="flespi-topic-selector__cross-btn"
            @click.stop="onLevelChange(index, ['+'])"
          >
            <q-tooltip>Replace with + wildcard</q-tooltip>
          </q-icon>
          <span class="flespi-topic-selector__triangle">&#9662;<q-tooltip>Click to select</q-tooltip></span>
          <q-tooltip v-if="getLevelTooltip(level).length" class="flespi-topic-selector__tooltip">
            <div v-for="(line, li) in getLevelTooltip(level)" :key="li">{{ line }}</div>
          </q-tooltip>
          <q-menu
            :ref="el => { if (el) levelMenuRefs[index] = el }"
            @before-show="onMenuBeforeShow(index)"
            @hide="onMenuHide(index)"
            :class="level.entityGroups.length > 1 ? 'flespi-topic-selector__dropdown flespi-topic-selector__dropdown--tabbed' : 'flespi-topic-selector__dropdown'"
          >
            <!-- Multi-entity: tabs per entity type -->
            <template v-if="level.entityGroups.length > 1">
              <q-tabs v-model="level.activeTab" dense no-caps active-color="primary" indicator-color="primary" align="justify" narrow-indicator>
                <q-tab name="#" label="#" @click="onMultiEntityWildcardClick(index, '#')" />
                <q-tab name="+" label="+" @click="onMultiEntityWildcardClick(index, '+')" />
                <q-tab v-for="group in level.entityGroups" :key="group.entityName" :name="group.entityName" :label="group.entityName" />
              </q-tabs>
              <q-separator />
              <q-list v-if="level.activeTab !== '#' && level.activeTab !== '+'" dense class="flespi-topic-selector__tab-list">
                <q-item
                  v-for="opt in (level.groupedMenuOptions[level.activeTab] || [])"
                  :key="opt.value"
                  clickable
                  v-close-popup="0"
                  @click="onMenuItemClick(index, opt.value)"
                  :active="level.selected.includes(opt.value)"
                  active-class="bg-grey-3"
                >
                  <q-item-section>
                    <q-item-label class="flespi-topic-selector__option-label">{{ opt.label }}</q-item-label>
                    <q-item-label v-if="opt.value !== opt.label" caption class="flespi-topic-selector__option-label">{{ opt.value }}</q-item-label>
                  </q-item-section>
                  <q-tooltip v-if="opt.value !== opt.label">{{ opt.label + ' (' + opt.value + ')' }}</q-tooltip>
                </q-item>
              </q-list>
            </template>
            <!-- Single entity: flat list -->
            <q-list v-else dense>
              <q-item
                v-for="opt in level.menuOptions"
                :key="opt.value"
                clickable
                v-close-popup="isExclusiveOption(opt.value) ? 1 : 0"
                @click="onMenuItemClick(index, opt.value)"
                :active="level.selected.includes(opt.value)"
                active-class="bg-grey-3"
              >
                <q-item-section>
                  <q-item-label class="flespi-topic-selector__option-label" :class="{'text-purple-4': opt.isSelectableProperty}">{{ opt.label }}</q-item-label>
                  <q-item-label v-if="opt.value !== opt.label && opt.value !== '+' && opt.value !== '#'" caption class="flespi-topic-selector__option-label">{{ opt.value }}</q-item-label>
                </q-item-section>
                <q-tooltip v-if="opt.value !== opt.label || opt.selectablePropertyName">{{ opt.label + (opt.value !== opt.label ? ' (' + opt.value + ')' : '') + (opt.selectablePropertyName ? ' {' + opt.selectablePropertyName + '}' : '') }}</q-tooltip>
              </q-item>
              <template v-if="level.customInputLabels.length">
                <q-separator />
                <template v-if="!level.customInputActive">
                  <q-item
                    v-for="propName in level.customInputLabels"
                    :key="'custom-' + propName"
                    clickable
                    v-close-popup="0"
                    @click="level.customInputActive = true"
                  >
                    <q-item-section>
                      <q-item-label class="text-purple-4">{{"{"}}{{ propName }}{{"}"}}</q-item-label>
                    </q-item-section>
                    <q-tooltip>Click to enter custom {{ propName }}</q-tooltip>
                  </q-item>
                </template>
                <q-item v-else>
                  <q-item-section>
                    <q-input
                      v-model="level.customInputValue"
                      dense
                      autofocus
                      :placeholder="level.customInputLabels.join(', ')"
                      @keyup.enter="addCustomValue(index)"
                    >
                      <template v-slot:append>
                        <q-btn flat dense round icon="add" size="sm" @click="addCustomValue(index)" />
                      </template>
                    </q-input>
                  </q-item-section>
                </q-item>
              </template>
            </q-list>
          </q-menu>
        </span>
        <q-icon
          v-if="level.isIdLevel && (level.unsupported || level.warning)"
          name="warning"
          color="warning"
          size="sm"
          class="q-ml-xs"
        >
          <q-tooltip>{{ level.warning || 'Entity "' + level.entityName + '" is not yet supported for item fetching' }}</q-tooltip>
        </q-icon>
      </template>
      <q-icon
        v-if="unmatchedTopic"
        name="warning"
        color="warning"
        size="sm"
        class="q-ml-xs"
      >
        <q-tooltip>Topic does not match any known flespi topic pattern</q-tooltip>
      </q-icon>
      <q-btn
        v-if="canContinue && isComplete"
        flat
        dense
        round
        size="sm"
        icon="more_horiz"
        color="grey-7"
        class="q-ml-xs"
        @click="continueBuilding"
      >
        <q-tooltip>Continue with nested properties</q-tooltip>
      </q-btn>
    </div>
    <q-separator class="q-my-sm" style="flex-shrink: 0;" />
    <div class="text-subtitle1 text-bold q-mb-xs" style="flex-shrink: 0;">flespi</div>
    <div ref="treeScroll" :style="treeHeight ? { height: treeHeight } : {}" :class="{'flespi-topic-selector__tree--mobile': mobile}" class="scroll">
      <q-tree
        :nodes="displayTree"
        node-key="key"
        label-key="label"
        children-key="children"
        dense
        no-connectors
        :default-expand-all="false"
        v-model:expanded="expandedKeys"
      >
        <template v-slot:default-header="prop">
          <div
            class="row items-center no-wrap full-width flespi-topic-tree__row"
            :class="{'flespi-topic-tree__matched': matchedKeys.has(prop.node.key)}"
            :style="isLeafNode(prop.node) ? getTreeNodeColorStyle(prop.node.key) : {}"
          >
            <span
              class="cursor-pointer"
              style="white-space: nowrap;"
              :class="{'text-bold': isLeafNode(prop.node)}"
              :style="!isLeafNode(prop.node) ? getTreeNodeColorStyle(prop.node.key) : {}"
              @click.stop="selectTreeNode(prop.node.key, $event)"
            >/{{ prop.node.label }}</span>
            <span v-if="prop.node.description && !compactDescriptions" class="text-caption text-grey flespi-topic-tree__description gt-xs">{{ prop.node.description }}</span>
            <q-icon
              v-if="prop.node.description && ($q.screen.lt.sm || compactDescriptions)"
              name="mdi-information-outline"
              color="grey"
              size="xs"
              class="cursor-pointer"
              style="margin-left: auto; margin-right: 2px;"
            >
              <q-tooltip>{{ prop.node.description }}</q-tooltip>
            </q-icon>
          </div>
        </template>
      </q-tree>
    </div>
  </div>
</template>

<script>
import { defineComponent, nextTick } from 'vue'
import config from './selectors/config.json'

const SEGMENT_COLORS = [
  'rgba(100, 181, 246, 0.25)', // blue
  'rgba(129, 199, 132, 0.25)', // green
  'rgba(255, 183, 77, 0.25)',  // orange
  'rgba(206, 147, 216, 0.25)', // purple
  'rgba(240, 98, 146, 0.25)',  // pink
  'rgba(77, 208, 225, 0.25)',  // cyan
  'rgba(255, 213, 79, 0.25)',  // yellow
  'rgba(161, 136, 127, 0.25)', // brown
  'rgba(144, 164, 174, 0.25)', // blue-grey
  'rgba(174, 213, 129, 0.25)'  // light-green
]
const HASH_COLOR = 'rgba(158, 158, 158, 0.2)' // gray for # wildcard descendants

export default defineComponent({
  name: 'FlespiTopicConstructor',
  props: {
    modelValue: {
      type: String,
      default: 'flespi/#'
    },
    color: {
      type: String,
      default: 'grey-9'
    },
    connector: {
      type: Object,
      default: null
    },
    treeHeight: {
      type: String,
      default: '50vh'
    },
    mobile: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update:modelValue', 'topicLength'],
  data () {
    return {
      topicTree: {},
      displayTree: [],
      levels: [],
      loading: false,
      isComplete: false,
      canContinue: false,
      expandedKeys: [],
      matchedKeys: new Map(),
      unmatchedTopic: false,
      internalUpdate: false,
      levelMenuRefs: {},
      compactDescriptions: false,
      resizeObserver: null
    }
  },
  watch: {
    expandedKeys () {
      this.checkTreeOverflow()
    },
    modelValue (newVal) {
      if (!Object.keys(this.topicTree).length) { return }
      if (this.internalUpdate) {
        this.internalUpdate = false
        const result = this.computeMatchedAndExpanded(newVal)
        this.expandedKeys = result.expanded
        this.matchedKeys = result.matched
        this.unmatchedTopic = result.unmatched
        return
      }
      this.parseTopic(newVal)
      if (!this.levels.length) {
        this.levels = [this.createLevel(false)]
      }
      this.updateCompleteState()
      const result = this.computeMatchedAndExpanded(newVal)
      this.expandedKeys = result.expanded
      this.matchedKeys = result.matched
      this.unmatchedTopic = result.unmatched
    }
  },
  created () {
    this.fetchTopicsConfig()
  },
  mounted () {
    this.emitTopicLength()
    this.setupTreeOverflowCheck()
  },
  beforeUnmount () {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect()
    }
  },
  methods: {
    buildEntityChain (upToIndex) {
      // Walk levels 0..upToIndex-1 to collect entity chain.
      // Entity pattern: word-segment (non-ID level) followed by {curly} segment (ID level).
      const entities = []
      for (let i = 0; i < upToIndex; i++) {
        if (this.levels[i].isIdLevel && i > 0 && !this.levels[i - 1].isIdLevel) {
          entities.push({
            name: this.levels[i].entityName,
            selectorLevelIndex: i
          })
        }
      }
      return entities
    },
    buildSelectablePropertyConfigKey (entities, levelIndex) {
      const parts = entities.map(e => e.name)
      if (levelIndex > 0 && !this.levels[levelIndex - 1].isIdLevel) {
        const prevSelected = this.levels[levelIndex - 1].selected
        const keyword = prevSelected.find(s => s !== '+' && s !== '#')
        if (keyword) { parts.push(keyword) }
      }
      return parts.join('/')
    },
    resolveEntityName (levelIndex) {
      const entities = this.buildEntityChain(levelIndex)

      // Check if current ID level is a selectable property using tree-level flag
      // Covers both: {curly} after {curly} (case 2.1) and {curly} with plain-word siblings (case 2.2)
      const isSelectableProperty = this.isSelectablePropertyLevel(levelIndex)

      if (isSelectableProperty) {
        return {
          entityName: '',
          entityChain: [...entities],
          configKey: this.buildSelectablePropertyConfigKey(entities, levelIndex),
          isSelectableProperty: true
        }
      }

      // Current level is an entity - name comes from previous level's keyword
      const prevSelected = levelIndex > 0 ? this.levels[levelIndex - 1].selected : []
      let entityName = prevSelected.find(s => s !== '+' && s !== '#') || ''

      // Fallback: derive entity name from tree children pattern (e.g. {calc-id} → calcs)
      if (!entityName) {
        const children = this.getTreeChildrenKeys(levelIndex)
        if (children.length) {
          const idMatch = children[0].match(/^\{(.+?)-id\}$/)
          if (idMatch) { entityName = idMatch[1] + 's' }
          else {
            const nameMatch = children[0].match(/^\{(.+?)\}$/)
            if (nameMatch) { entityName = nameMatch[1] }
          }
        }
      }

      const chainNames = entities.map(e => e.name)
      const configKey = [...chainNames, entityName].filter(Boolean).join('/')

      return {
        entityName,
        entityChain: [...entities],
        configKey,
        isSelectableProperty: false
      }
    },
    resolveEntityGroups (levelIndex) {
      // When the previous keyword level has multiple selections or '+',
      // resolve entity info for each possible entity type at this ID level.
      if (!this.levels[levelIndex] || !this.levels[levelIndex].isIdLevel) { return [] }
      const prevLevel = levelIndex > 0 ? this.levels[levelIndex - 1] : null
      if (!prevLevel || prevLevel.isIdLevel) { return [] }

      let keywords
      if (prevLevel.selected.includes('+')) {
        // '+' — get all keyword children from tree at previous level
        keywords = this.getTreeChildrenKeys(levelIndex - 1)
          .filter(k => !k.startsWith('{') && k !== '#' && k !== '+')
      } else {
        keywords = prevLevel.selected.filter(s => s !== '#' && s !== '+')
      }

      if (keywords.length <= 1) { return [] }

      // Build entity chain from levels before the keyword level
      const entities = this.buildEntityChain(levelIndex - 1)
      const chainNames = entities.map(e => e.name)

      return keywords.map(keyword => ({
        entityName: keyword,
        configKey: [...chainNames, keyword].filter(Boolean).join('/'),
        entityChain: [...entities],
        items: [],
        itemsFetched: false,
        unsupported: false
      }))
    },
    createLevel (isIdLevel, entityInfo) {
      const entityName = (entityInfo && entityInfo.entityName) || ''
      const entityChain = (entityInfo && entityInfo.entityChain) || []
      const configKey = (entityInfo && entityInfo.configKey) || entityName
      const isSelectableProperty = (entityInfo && entityInfo.isSelectableProperty) || false
      // Flespi entity names are simple plurals (devices, channels, calcs, etc.),
      // so a name not ending in 's' indicates a non-collection property (e.g. phone-number, ip-address)
      const isNonIdEntity = isIdLevel && entityName && !entityName.endsWith('s')
      return {
        selected: ['#'],
        editing: false,
        isIdLevel: isIdLevel || false,
        entityName,
        entityChain,
        configKey,
        isSelectableProperty,
        allowCustomValues: isNonIdEntity || isSelectableProperty,
        unsupported: false,
        warning: '',
        items: [],
        itemsLoading: false,
        itemsFetched: false,
        selectableProperties: [],
        selectablePropertyValues: new Set(),
        menuOptions: [],
        groupedMenuOptions: {},
        entityGroups: [],
        activeTab: '',
        customInputActive: false,
        customInputValue: '',
        customInputLabels: []
      }
    },
    getTreeNodesAtLevel (levelIndex) {
      let nodes = [this.topicTree]
      for (let i = 0; i < levelIndex; i++) {
        if (i >= this.levels.length) { break }
        const level = this.levels[i]
        const selected = level.selected
        const nextNodes = []
        if (level.isIdLevel) {
          for (const node of nodes) {
            Object.entries(node).forEach(([key, child]) => {
              if (key.startsWith('{') && key.endsWith('}')) {
                nextNodes.push(child)
              }
            })
          }
        } else if (selected.includes('+')) {
          for (const node of nodes) {
            Object.values(node).forEach(child => {
              if (child && typeof child === 'object') { nextNodes.push(child) }
            })
          }
        } else {
          for (const sel of selected) {
            if (sel === '#') { continue }
            for (const node of nodes) {
              if (node[sel]) {
                nextNodes.push(node[sel])
              } else if (level.isSelectableProperty) {
                // Selected value is a selectable property value (e.g. an IP address) —
                // not a literal tree key. Follow all curly children instead.
                Object.entries(node).forEach(([key, child]) => {
                  if (key.startsWith('{') && key.endsWith('}') && child && typeof child === 'object') {
                    nextNodes.push(child)
                  }
                })
              }
            }
          }
        }
        nodes = nextNodes
        if (!nodes.length) { break }
      }
      return nodes
    },
    getTreeChildrenKeys (levelIndex) {
      const nodes = this.getTreeNodesAtLevel(levelIndex)
      const keys = new Set()
      nodes.forEach(node => {
        Object.keys(node).filter(k => !k.startsWith('_')).forEach(k => keys.add(k))
      })
      return Array.from(keys).sort()
    },
    isIdLevelChildren (children) {
      return children.length > 0 && children.every(c => c.startsWith('{') && c.endsWith('}'))
    },
    isSelectablePropertyLevel (levelIndex) {
      const nodes = this.getTreeNodesAtLevel(levelIndex)
      return nodes.some(node =>
        Object.keys(node).filter(k => !k.startsWith('_')).some(k =>
          node[k] && node[k]._selectableProperty
        )
      )
    },
    resolveSelectablePropertyInfo (levelIndex) {
      const entities = this.buildEntityChain(levelIndex)
      return {
        entityName: '',
        entityChain: [...entities],
        configKey: this.buildSelectablePropertyConfigKey(entities, levelIndex),
        isSelectableProperty: true
      }
    },
    getSelectablePropertyNames (levelIndex) {
      const nodes = this.getTreeNodesAtLevel(levelIndex)
      const names = new Set()
      for (const node of nodes) {
        for (const key of Object.keys(node).filter(k => !k.startsWith('_'))) {
          if (node[key] && node[key]._selectableProperty) {
            const match = key.match(/^\{(.+?)\}$/)
            if (match) { names.add(match[1]) }
          }
        }
      }
      return Array.from(names)
    },
    getLevelTooltip (level) {
      if (!level.isIdLevel || !level.items.length) { return [] }
      const selected = level.selected.filter(s => s !== '+' && s !== '#')
      if (!selected.length) { return [] }
      const itemMap = new Map(level.items.map(item => [item.value, item.label]))
      return selected.map(id => {
        const label = itemMap.get(id)
        return label ? `${label} (${id})` : id
      })
    },
    getLevelOptions (index) {
      const level = this.levels[index]
      if (level.isIdLevel) {
        return [
          { label: '#', value: '#' },
          { label: '+', value: '+' },
          ...level.items
        ]
      }
      const children = this.getTreeChildrenKeys(index)
      const options = [
        ...children.filter(c => !c.startsWith('{')).map(c => ({ label: c, value: c })),
        { label: '#', value: '#' },
        { label: '+', value: '+' }
      ]
      // Include fetched items from selectable properties (e.g. IP addresses)
      if (level.isSelectableProperty && level.items.length) {
        options.push(...level.items.map(item => ({ ...item, isSelectableProperty: true })))
      }
      return options
    },
    snapshotMenuOptions (index) {
      const level = this.levels[index]
      const options = this.getLevelOptions(index)
      const selected = new Set(level.selected)
      const sortLabel = (a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base' })

      const isWildcard = (o) => o.value === '#' || o.value === '+'

      if (level.entityGroups.length > 1) {
        // Multi-entity: organize options per group tab
        const wildcards = options.filter(isWildcard)
        const groupOptionsMap = {}
        for (const group of level.entityGroups) {
          const groupItems = options.filter(o => o.entityGroup === group.entityName)
          const selectedOpts = groupItems.filter(o => selected.has(o.value)).sort(sortLabel)
          const unselectedOpts = groupItems.filter(o => !selected.has(o.value)).sort(sortLabel)
          groupOptionsMap[group.entityName] = [...selectedOpts, ...unselectedOpts]
        }
        level.menuOptions = [
          ...wildcards,
          ...options.filter(o => !isWildcard(o) && !o.entityGroup)
        ]
        level.groupedMenuOptions = groupOptionsMap
        return
      }

      const regular = options.filter(o => !isWildcard(o))
      const wildcards = options.filter(isWildcard)
      const selectedOpts = regular.filter(o => selected.has(o.value)).sort(sortLabel)
      const unselectedOpts = regular.filter(o => !selected.has(o.value)).sort(sortLabel)
      level.menuOptions = [
        ...wildcards,
        ...selectedOpts,
        ...unselectedOpts
      ]
      level.customInputLabels = this.getCustomInputLabels(index)
    },
    onMenuBeforeShow (index) {
      const level = this.levels[index]
      level.editing = true
      // Detect selectable properties at this level (mixed curly/plain children)
      if (!level.isIdLevel) {
        const propNames = this.getSelectablePropertyNames(index)
        if (propNames.length) {
          level.selectableProperties = propNames
        }
      }
      // Detect multi-entity groups for ID levels
      if (level.isIdLevel && !level.entityGroups.length) {
        const groups = this.resolveEntityGroups(index)
        if (groups.length) {
          level.entityGroups = groups
          if (!level.activeTab) {
            level.activeTab = groups[0].entityName
          }
          // Reset so we re-fetch items for all entity groups
          level.itemsFetched = false
        }
      }
      // Fetch items for ID levels and selectable property levels
      if ((level.isIdLevel || level.isSelectableProperty) && !level.itemsFetched) {
        this.fetchLevelItems(index).then(() => this.snapshotMenuOptions(index))
      }
      this.snapshotMenuOptions(index)
    },
    isExclusiveOption (value) {
      return value === '+' || value === '#'
    },
    onMenuItemClick (index, value) {
      const level = this.levels[index]
      const selected = [...level.selected]
      if (value === '+' || value === '#') {
        // Exclusive: replace entire selection
        this.onLevelChange(index, [value])
      } else {
        // Toggle: add or remove
        const idx = selected.indexOf(value)
        if (idx >= 0) {
          selected.splice(idx, 1)
        } else {
          // Remove wildcards when adding specific values
          const filtered = selected.filter(v => v !== '+' && v !== '#')
          filtered.push(value)
          this.onLevelChange(index, filtered)
          return
        }
        this.onLevelChange(index, selected)
      }
    },
    onMultiEntityWildcardClick (index, wildcard) {
      this.onLevelChange(index, [wildcard])
      const level = this.levels[index]
      if (level.entityGroups.length) {
        level.activeTab = level.entityGroups[0].entityName
      }
      const menuRef = this.levelMenuRefs[index]
      if (menuRef) { menuRef.hide() }
    },
    cleanupMenuRefs () {
      const len = this.levels.length
      for (const key of Object.keys(this.levelMenuRefs)) {
        if (Number(key) >= len) {
          delete this.levelMenuRefs[key]
        }
      }
    },
    getCustomInputLabels (index) {
      const level = this.levels[index]
      if (!level.allowCustomValues) { return [] }
      const children = this.getTreeChildrenKeys(index)
      return children
        .filter(k => k.startsWith('{') && k.endsWith('}'))
        .map(k => k.slice(1, -1))
    },
    addCustomValue (index) {
      const level = this.levels[index]
      const value = level.customInputValue.trim()
      if (!value) { return }
      const filtered = level.selected.filter(v => v !== '+' && v !== '#')
      if (!filtered.includes(value)) {
        filtered.push(value)
      }
      level.customInputValue = ''
      this.onLevelChange(index, filtered)
    },
    applySelection (value) {
      if (!value || value.length === 0) { return [] }
      const lastAdded = value[value.length - 1]
      if (lastAdded === '+' || lastAdded === '#') { return [lastAdded] }
      return value.filter(v => v !== '+' && v !== '#')
    },
    updateCompleteState () {
      const lastLevel = this.levels.length ? this.levels[this.levels.length - 1] : null
      const lastIsClosed = !lastLevel || lastLevel.selected.includes('#')
      if (lastIsClosed) {
        this.isComplete = false
        this.canContinue = false
        return
      }
      const nodes = this.getTreeNodesAtLevel(this.levels.length)
      this.isComplete = nodes.some(n => n._complete)
      const childrenKeys = this.getTreeChildrenKeys(this.levels.length)
      this.canContinue = childrenKeys.length > 0
    },
    areLevelsConsistent (fromIndex) {
      // Check if levels after fromIndex are still valid in the tree
      for (let i = fromIndex; i < this.levels.length; i++) {
        const children = this.getTreeChildrenKeys(i)
        if (!children.length) { return false }
        const level = this.levels[i]
        const isId = this.isIdLevelChildren(children)
        if (level.isIdLevel !== isId) { return false }
        if (!isId) {
          // For keyword levels, check all selected values exist in children
          const validKeys = level.selected.filter(s => s !== '+' && s !== '#')
          if (validKeys.length && !validKeys.every(v => children.includes(v))) { return false }
        }
      }
      return true
    },
    resetLevelItemsAfter (index) {
      // Reset fetched items for ID levels after index, since the context may have changed
      for (let i = index + 1; i < this.levels.length; i++) {
        if (this.levels[i].isIdLevel) {
          this.levels[i].items = []
          this.levels[i].itemsFetched = false
          this.levels[i].entityGroups = []
          this.levels[i].groupedMenuOptions = {}
          this.levels[i].activeTab = ''
        }
      }
    },
    onLevelChange (index, value) {
      const selected = this.applySelection(value)
      this.levels[index].selected = selected
      this.updateCompleteState()
      this.emitTopic()
    },
    onMenuHide (index) {
      const level = this.levels[index]
      if (!level) { return }
      level.editing = false
      level.customInputActive = false
      level.customInputValue = ''
      const selected = level.selected
      // If selection is empty, remove this level and all after it
      if (!selected.length) {
        this.levels.splice(index)
        this.cleanupMenuRefs()
        // Check if the truncated topic is completable
        const nodes = this.getTreeNodesAtLevel(this.levels.length)
        const isCompletable = nodes.some(n => n._complete)
        if (!isCompletable) {
          // Not completable — re-add level with '#'
          const children = this.getTreeChildrenKeys(index)
          const isId = this.isIdLevelChildren(children)
          let entityInfo = null
          if (isId) {
            entityInfo = this.resolveEntityName(index)
          } else if (this.isSelectablePropertyLevel(index)) {
            entityInfo = this.resolveSelectablePropertyInfo(index)
          }
          const newLevel = this.createLevel(isId, entityInfo)
          newLevel.selected = ['#']
          this.levels.push(newLevel)
        }
        this.updateCompleteState()
        this.emitTopic()
        return
      }
      // Track which selected values are selectable property values (not literal tree keys)
      if (level.isSelectableProperty) {
        const treeKeys = new Set(this.getTreeChildrenKeys(index).filter(k => !k.startsWith('{')))
        level.selectablePropertyValues = new Set(
          selected.filter(v => v !== '+' && v !== '#' && !treeKeys.has(v))
        )
      }
      // Rebuild subsequent levels now that dropdown is closed
      const hasSubsequentLevels = this.levels.length > index + 1
      const canRetain = hasSubsequentLevels &&
        !selected.includes('#') &&
        this.areLevelsConsistent(index + 1)
      if (canRetain) {
        this.resetLevelItemsAfter(index)
      } else {
        // Remove all levels after this one
        this.levels.splice(index + 1)
        this.cleanupMenuRefs()
        // If not '#' and has selection, try adding next level
        if (!selected.includes('#')) {
          this.addNextLevel(index)
        }
      }
      this.updateCompleteState()
      this.emitTopic()
    },
    addNextLevel (afterIndex, force) {
      const children = this.getTreeChildrenKeys(afterIndex + 1)
      if (!children.length) { return }
      // Check if current position is a complete topic
      if (!force) {
        const nodes = this.getTreeNodesAtLevel(afterIndex + 1)
        const isComplete = nodes.some(n => n._complete)
        if (isComplete) {
          // Don't auto-add — show "..." button instead
          return
        }
      }
      const isId = this.isIdLevelChildren(children)
      let entityInfo = null
      if (isId) {
        entityInfo = this.resolveEntityName(afterIndex + 1)
      } else if (this.isSelectablePropertyLevel(afterIndex + 1)) {
        // Keyword level with selectable properties — build entityInfo for config lookup
        entityInfo = this.resolveSelectablePropertyInfo(afterIndex + 1)
      }
      this.levels.push(this.createLevel(isId, entityInfo))
    },
    continueBuilding () {
      this.addNextLevel(this.levels.length - 1, true)
      this.updateCompleteState()
      this.emitTopic()
    },
    findPrecedingEntityIds (index, entityName) {
      for (let i = index - 1; i >= 0; i--) {
        const lvl = this.levels[i]
        if (lvl.isIdLevel && lvl.entityName === entityName) {
          const ids = lvl.selected.filter(s => s !== '#')
          if (ids.includes('+')) { return 'all' }
          return ids.length ? ids.join(',') : null
        }
      }
      return null
    },
    getChainSelectors (entityChain) {
      // Resolve actual selector values from the levels for each entity in the chain
      return entityChain.map(entity => {
        const selectorLevel = this.levels[entity.selectorLevelIndex]
        if (!selectorLevel) { return 'all' }
        const ids = selectorLevel.selected.filter(s => s !== '#')
        if (!ids.length || ids.includes('+')) { return 'all' }
        return ids.join(',')
      })
    },
    async fetchEntityItemsByConfig (entityConfig, entityChain) {
      if (entityConfig.length === 0) { return [] }
      if (!this.connector || !this.connector.bus) { return [] }
      const chainSelectors = this.getChainSelectors(entityChain)
      const items = []
      const responses = await Promise.all(entityConfig.map(entry => {
        const module = this.connector.bus[entry.module]
        if (!module) { throw new Error(`Unknown connector module "${entry.module}"`) }
        const method = module[entry.method]
        if (typeof method !== 'function') { throw new Error(`Unknown method "${entry.method}" on module "${entry.module}"`) }
        const args = entry.noChain ? [] : [...chainSelectors]
        if (entry.selector) { args.push(entry.selector) }
        if (entry.query) { args.push(entry.query) }
        return method.apply(module, args)
      }))
      for (let idx = 0; idx < responses.length; idx++) {
        const entry = entityConfig[idx]
        const result = responses[idx] && responses[idx].data && responses[idx].data.result ? responses[idx].data.result : []
        if (entry.parse === 'objectKeys') {
          for (const item of result) {
            const obj = item[entry.objectField]
            if (obj && typeof obj === 'object') {
              for (const key of Object.keys(obj)) {
                items.push({ label: key, value: key })
              }
            }
          }
        } else {
          const valueKey = entry.value || 'id'
          const labelKeys = entry.labels || [entry.label || 'name']
          for (const item of result) {
            let label = ''
            if (entry.labels) {
              for (const key of labelKeys) {
                if (item[key]) { label = key + ': ' + item[key]; break }
              }
            } else {
              label = labelKeys.reduce((found, key) => found || item[key], '')
            }
            label = label || '#' + item[valueKey]
            items.push({ label, value: String(item[valueKey]) })
          }
        }
      }
      const seen = new Set()
      return items.filter(item => {
        if (seen.has(item.value)) { return false }
        seen.add(item.value)
        return true
      })
    },
    async fetchLevelItems (index) {
      const level = this.levels[index]
      if (level.itemsFetched) { return }

      // Selectable property levels: look up per-property configs
      if (level.isSelectableProperty) {
        const propNames = this.getSelectablePropertyNames(index)
        level.itemsLoading = true
        try {
          const items = []
          for (const propName of propNames) {
            const propConfigKey = level.configKey ? level.configKey + '/' + propName : propName
            const propConfig = config[propConfigKey]
            if (propConfig && propConfig.length) {
              const propItems = await this.fetchEntityItemsByConfig(propConfig, level.entityChain)
              items.push(...propItems.map(item => ({ ...item, isSelectableProperty: true, selectablePropertyName: propName })))
            }
          }
          level.items = items
          level.itemsFetched = true
        } catch (e) {
          console.error('Failed to fetch selectable property items:', e)
          level.warning = 'Failed to fetch items: ' + (e.message || e)
        } finally {
          level.itemsLoading = false
        }
        return
      }
      // Multi-entity groups: fetch items for each entity type separately
      if (level.entityGroups.length > 1) {
        level.itemsLoading = true
        try {
          const allItems = []
          for (const group of level.entityGroups) {
            if (group.itemsFetched) {
              allItems.push(...group.items)
              continue
            }
            const groupConfig = config[group.configKey]
            if (!groupConfig) {
              group.itemsFetched = true
              group.unsupported = true
              continue
            }
            const groupItems = await this.fetchEntityItemsByConfig(groupConfig, group.entityChain)
            group.items = groupItems.map(item => ({ ...item, entityGroup: group.entityName }))
            group.itemsFetched = true
            allItems.push(...group.items)
          }
          level.items = allItems
          level.itemsFetched = true
        } catch (e) {
          console.error('Failed to fetch multi-entity items:', e)
          level.warning = 'Failed to fetch items: ' + (e.message || e)
        } finally {
          level.itemsLoading = false
        }
        return
      }
      // Single entity level: look up config by entity name
      const entityConfig = config[level.configKey]
      if (!entityConfig) {
        level.itemsFetched = true
        level.unsupported = true
        return
      }

      level.itemsLoading = true
      try {
        level.items = await this.fetchEntityItemsByConfig(entityConfig, level.entityChain)
        level.itemsFetched = true
      } catch (e) {
        console.error('Failed to fetch ' + level.entityName + ' items:', e)
        level.warning = 'Failed to fetch items: ' + (e.message || e)
      } finally {
        level.itemsLoading = false
      }
    },
    setupTreeOverflowCheck () {
      if (!this.$refs.treeScroll) { return }
      this.resizeObserver = new ResizeObserver(() => {
        this.checkTreeOverflow()
      })
      this.resizeObserver.observe(this.$refs.treeScroll)
    },
    checkTreeOverflow () {
      if (this._overflowCheckPending) { return }
      this._overflowCheckPending = true
      nextTick(() => {
        this._overflowCheckPending = false
        const el = this.$refs.treeScroll
        if (!el) { return }
        const width = el.clientWidth
        if (width === this._lastOverflowWidth) { return }
        this._lastOverflowWidth = width
        if (this.compactDescriptions) {
          // Temporarily show descriptions to re-measure
          this.compactDescriptions = false
          nextTick(() => {
            if (el.scrollWidth > el.clientWidth) {
              this.compactDescriptions = true
            }
          })
        } else {
          if (el.scrollWidth > el.clientWidth) {
            this.compactDescriptions = true
          }
        }
      })
    },
    emitTopicLength() {
      nextTick(() => {
        if (this.$refs.topicRow) {
          this.$emit('topicLength', this.$refs.topicRow.scrollWidth)
        }
      })
    },
    emitTopic () {
      let topic = 'flespi'
      for (const level of this.levels) {
        if (!level.selected.length) { break }
        topic += '/' + level.selected.join(',')
        if (level.selected.includes('#')) { break }
      }
      if (topic !== this.modelValue) {
        this.internalUpdate = true
        this.$emit('update:modelValue', topic)
        this.emitTopicLength()
      }
    },
    parseTopic (topic) {
      if (!topic || !topic.startsWith('flespi/')) { return }
      const rest = topic.slice('flespi/'.length)
      if (!rest) { return }
      const parts = rest.split('/')
      this.levels = []
      for (let i = 0; i < parts.length; i++) {
        const values = parts[i].split(',').filter(Boolean)
        if (!values.length) { break }
        const children = this.getTreeChildrenKeys(i)
        const isId = this.isIdLevelChildren(children)
        let entityInfo = null
        if (isId) {
          entityInfo = this.resolveEntityName(i)
        } else if (this.isSelectablePropertyLevel(i)) {
          entityInfo = this.resolveSelectablePropertyInfo(i)
        }
        const level = this.createLevel(isId, entityInfo)
        level.selected = values
        // Track selectable property values
        if (level.isSelectableProperty) {
          const treeKeys = new Set(children.filter(k => !k.startsWith('{')))
          level.selectablePropertyValues = new Set(
            values.filter(v => v !== '+' && v !== '#' && !treeKeys.has(v))
          )
        }
        this.levels.push(level)
        if (values.includes('#')) { break }
      }
    },
    buildTopicsTree (data) {
      const topics = data && data.result && data.result[0] && data.result[0]['toolbox/topics'] && data.result[0]['toolbox/topics'].topics
      if (!topics) { return }
      const tree = {}
      const displayRoot = {}
      Object.entries(topics).forEach(([topicPattern, meta]) => {
        const parts = topicPattern.split('/')
        // Build navigation tree
        let node = tree
        for (let i = 1; i < parts.length; i++) {
          if (!node[parts[i]]) {
            node[parts[i]] = {}
          }
          node = node[parts[i]]
        }
        node._complete = true
        node._description = meta.description || ''
        // Build display tree
        let displayNode = displayRoot
        for (let i = 1; i < parts.length; i++) {
          const part = parts[i]
          if (!displayNode[part]) {
            displayNode[part] = { _children: {} }
          }
          if (i === parts.length - 1) {
            displayNode[part]._description = meta.description || ''
            displayNode[part]._topicPath = topicPattern
          }
          displayNode = displayNode[part]._children
        }
      })
      this.markSelectableProperties(tree)
      this.topicTree = tree
      this.displayTree = this.treeToNodes(displayRoot, 'flespi')
    },
    markSelectableProperties (node, parentIsCurly) {
      const childKeys = Object.keys(node).filter(k => !k.startsWith('_'))
      const curlyKeys = childKeys.filter(k => k.startsWith('{') && k.endsWith('}'))
      const plainKeys = childKeys.filter(k => !k.startsWith('{') || !k.endsWith('}'))
      const hasMixedSiblings = curlyKeys.length > 0 && plainKeys.length > 0

      for (const key of childKeys) {
        const child = node[key]
        if (typeof child !== 'object') { continue }
        const isCurly = key.startsWith('{') && key.endsWith('}')
        if (isCurly) {
          // Case 2.1: curly node after curly parent
          // Case 2.2: curly node with plain-word siblings
          if (parentIsCurly || hasMixedSiblings) {
            child._selectableProperty = true
          }
        }
        this.markSelectableProperties(child, isCurly)
      }
    },
    treeToNodes (obj, parentPath) {
      const keys = Object.keys(obj).sort()
      return keys.map(key => {
        const entry = obj[key]
        const currentPath = parentPath + '/' + key
        const childKeys = Object.keys(entry._children)
        const isLeaf = childKeys.length === 0
        const node = {
          key: currentPath,
          label: key,
          description: entry._description || '',
          topicPath: isLeaf ? (entry._topicPath || currentPath) : null
        }
        if (!isLeaf) {
          node.children = this.treeToNodes(entry._children, currentPath)
        }
        return node
      })
    },
    async fetchTopicsConfig () {
      const STORAGE_KEY = 'flespi_mqtt_topics'
      const cached = sessionStorage.getItem(STORAGE_KEY)
      if (cached) {
        try {
          const data = JSON.parse(cached)
          this.buildTopicsTree(data)
          this.initFromTopic()
          return
        } catch (e) {
          sessionStorage.removeItem(STORAGE_KEY)
        }
      }
      this.loading = true
      try {
        const response = await this.connector.bus.http.external('https://flespi.io/const/values?names=toolbox/topics')
        const data = response.data
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data))
        this.buildTopicsTree(data)
        this.initFromTopic()
      } catch (e) {
        console.error('Failed to fetch flespi topics config:', e)
      } finally {
        this.loading = false
      }
    },
    initFromTopic () {
      this.parseTopic(this.modelValue)
      if (!this.levels.length) {
        this.levels = [this.createLevel(false)]
      }
      this.updateCompleteState()
      this.emitTopic()
      const result = this.computeMatchedAndExpanded(this.modelValue)
      this.expandedKeys = result.expanded
      this.matchedKeys = result.matched
      this.unmatchedTopic = result.unmatched
      this.fetchItemsForIdLevels()
    },
    async fetchItemsForIdLevels () {
      // Auto-fetch items for ID levels with specific IDs selected,
      // so that tooltips can display labels (e.g. device names) for those IDs.
      // Sequential because later levels may depend on earlier chain selectors.
      for (let i = 0; i < this.levels.length; i++) {
        const level = this.levels[i]
        if (!level.isIdLevel || level.itemsFetched) { continue }
        const hasSpecificIds = level.selected.some(s => s !== '+' && s !== '#')
        if (hasSpecificIds) {
          await this.fetchLevelItems(i)
        }
      }
    },
    isTopicComplete (topic) {
      if (!topic || !topic.startsWith('flespi/')) { return false }
      if (topic.endsWith('/#') || topic.endsWith('#')) { return true }
      const rest = topic.slice('flespi/'.length)
      if (!rest) { return false }
      const parts = rest.split('/')
      let nodes = [this.topicTree]
      for (const part of parts) {
        const values = part.split(',').filter(Boolean)
        const nextNodes = []
        for (const node of nodes) {
          const childKeys = Object.keys(node).filter(k => !k.startsWith('_'))
          const isIdLevel = childKeys.every(k => k.startsWith('{') && k.endsWith('}'))
          let keys
          if (isIdLevel || values.includes('+')) {
            keys = childKeys
          } else {
            keys = []
            for (const v of values) {
              if (node[v]) {
                keys.push(v)
              } else {
                // Value might be a selectable property value (e.g. IP address) —
                // follow curly children that have _selectableProperty
                const curlyChildren = childKeys.filter(k =>
                  k.startsWith('{') && k.endsWith('}') && node[k] && node[k]._selectableProperty
                )
                keys.push(...curlyChildren)
              }
            }
          }
          for (const key of keys) {
            if (node[key] && typeof node[key] === 'object') { nextNodes.push(node[key]) }
          }
        }
        nodes = nextNodes
        if (!nodes.length) { break }
      }
      return nodes.some(n => n._complete)
    },
    selectTreeNode (keyPath, event) {
      const rawParts = keyPath.split('/')
      // Convert tree key path to topic: replace {…} segments with +
      const newParts = rawParts.map(segment => {
        return (segment.startsWith('{') && segment.endsWith('}')) ? '+' : segment
      })
      const currentParts = this.modelValue
        ? this.modelValue.replace(/\/#$/, '').split('/')
        : []
      // Build merged topic: preserve current values to the left of change, apply new values from change onward
      const mergedParts = []
      const isCtrl = event && (event.ctrlKey || event.metaKey)
      let changed = false
      const len = Math.max(currentParts.length, newParts.length)
      for (let i = 0; i < len; i++) {
        const cur = currentParts[i]
        const nw = newParts[i]
        const isIdLevel = rawParts[i] && rawParts[i].startsWith('{') && rawParts[i].endsWith('}')
        if (nw === undefined) {
          break
        } else if (cur === undefined) {
          mergedParts.push(nw)
        } else if (!changed && (cur === nw || (isIdLevel && nw === '+'))) {
          mergedParts.push(cur)
        } else if (!changed && isCtrl) {
          changed = true
          const curValues = cur.split(',').filter(v => v !== '#' && v !== '+')
          const newValues = nw.split(',').filter(v => v !== '#' && v !== '+')
          const result = new Set(curValues)
          for (const v of newValues) {
            if (result.has(v)) {
              result.delete(v)
            } else {
              result.add(v)
            }
          }
          if (!result.size) {
            break
          } else {
            mergedParts.push(Array.from(result).join(','))
          }
        } else {
          changed = true
          mergedParts.push(nw)
        }
      }
      const topic = mergedParts.join('/')
      const finalTopic = this.isTopicComplete(topic) ? topic : topic + '/#'
      if (finalTopic !== this.modelValue) {
        this.$emit('update:modelValue', finalTopic)
        this.emitTopicLength()
      }
    },
    isLeafNode (node) {
      return !node.children || !node.children.length
    },
    getSegmentColorStyle (levelIndex) {
      if (!this.levels[levelIndex] || !this.levels[levelIndex].selected.length) { return {} }
      const selected = this.levels[levelIndex].selected
      if (selected.length === 1 && selected[0] === '#') {
        return { backgroundColor: HASH_COLOR }
      }
      return { backgroundColor: SEGMENT_COLORS[levelIndex % SEGMENT_COLORS.length] }
    },
    getTreeNodeColorStyle (nodeKey) {
      if (!this.matchedKeys.has(nodeKey)) { return {} }
      const colorIndex = this.matchedKeys.get(nodeKey)
      const bgColor = colorIndex === -1 ? HASH_COLOR : SEGMENT_COLORS[colorIndex % SEGMENT_COLORS.length]
      return { backgroundColor: bgColor, borderRadius: '8px', padding: '0 4px' }
    },
    computeMatchedAndExpanded (topic) {
      const empty = { expanded: [], matched: new Map(), unmatched: false }
      if (!topic || !topic.startsWith('flespi/')) { return empty }
      const rest = topic.slice('flespi/'.length)
      if (!rest) { return empty }
      const parts = rest.split('/')
      const endsWithHash = parts[parts.length - 1] === '#'
      let activePaths = [{ tree: this.topicTree, pathKeys: [] }]
      let unmatched = false
      const nonHashParts = parts.filter(p => p !== '#')
      for (let partIndex = 0; partIndex < parts.length; partIndex++) {
        const part = parts[partIndex]
        if (part === '#') { break }
        const values = part.split(',').filter(Boolean)
        const level = this.levels[partIndex]
        const nextPaths = []
        for (const { tree, pathKeys } of activePaths) {
          const childKeys = Object.keys(tree).filter(k => !k.startsWith('_'))
          if (!childKeys.length) { continue }
          const isIdLevel = childKeys.every(k => k.startsWith('{') && k.endsWith('}'))
          let keysToExpand
          if (isIdLevel) {
            keysToExpand = childKeys
          } else if (values.includes('+')) {
            keysToExpand = childKeys
          } else {
            keysToExpand = []
            for (const v of values) {
              if (tree[v]) {
                keysToExpand.push(v)
              } else {
                // Value doesn't match a literal tree key — follow curly children
                // only if they are selectable properties (e.g. {ip-address} at a mixed level)
                for (const k of childKeys) {
                  if (k.startsWith('{') && k.endsWith('}') && tree[k] && tree[k]._selectableProperty && !keysToExpand.includes(k)) {
                    keysToExpand.push(k)
                  }
                }
              }
            }
          }
          for (const key of keysToExpand) {
            const parentPath = pathKeys.length ? pathKeys[pathKeys.length - 1].key : 'flespi'
            const expandPath = parentPath + '/' + key
            nextPaths.push({
              tree: tree[key],
              pathKeys: [...pathKeys, { key: expandPath, colorIndex: partIndex }]
            })
          }
        }
        activePaths = nextPaths
        if (!activePaths.length) {
          if (nonHashParts.length) { unmatched = true }
          break
        }
      }
      const expanded = new Set()
      const matched = new Map()
      for (const { pathKeys } of activePaths) {
        for (const { key, colorIndex } of pathKeys) {
          expanded.add(key)
          if (!matched.has(key)) {
            matched.set(key, colorIndex)
          }
        }
      }
      if (endsWithHash) {
        const collectDescendants = (tree, path) => {
          const childKeys = Object.keys(tree).filter(k => !k.startsWith('_'))
          for (const key of childKeys) {
            const childPath = path + '/' + key
            if (!matched.has(childPath)) {
              matched.set(childPath, -1) // -1 signals hash/gray color
            }
            if (tree[key] && typeof tree[key] === 'object') {
              collectDescendants(tree[key], childPath)
            }
          }
        }
        for (const { tree, pathKeys } of activePaths) {
          const lastPath = pathKeys.length ? pathKeys[pathKeys.length - 1].key : 'flespi'
          collectDescendants(tree, lastPath)
        }
      }
      return { expanded: Array.from(expanded), matched, unmatched }
    }
  }
})
</script>

<style scoped>
.flespi-topic-selector__topic-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  margin-left: 24px;
}
.flespi-topic-selector__topic-row > :first-child {
  margin-left: -24px;
}
.flespi-topic-selector__segment-group {
  cursor: pointer;
  position: relative;
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  padding: 0 2px 1px 4px;
  line-height: 1.2;
  border-radius: 8px;
  max-width: 100%;
}
.flespi-topic-selector__segment-group:hover {
  opacity: 0.8;
}
.flespi-topic-selector__segment-value {
  word-break: break-all;
}
.flespi-topic-selector__cross-btn {
  cursor: pointer;
  opacity: 0.6;
  margin-left: 2px;
}
.flespi-topic-selector__cross-btn:hover {
  opacity: 1;
}
.flespi-topic-selector__triangle {
  font-size: 14px;
  line-height: 1;
  color: rgba(0, 0, 0, 0.4);
  margin-left: 2px;
  align-self: center;
}
.flespi-topic-tree__row {
  padding: 0 4px;
}
.flespi-topic-tree__matched {
  border-radius: 8px;
}
.flespi-topic-tree__description {
  margin-left: auto;
  text-align: right;
  white-space: nowrap;
}
.flespi-topic-selector--mobile {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.flespi-topic-selector__topic-row--mobile {
  max-height: 50%;
  overflow-y: auto;
  flex-shrink: 1;
  margin-left: 0;
}
.flespi-topic-selector__topic-row--mobile > :first-child {
  margin-left: 0;
}
.flespi-topic-selector__tree--mobile {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}
</style>

<style>
.flespi-topic-selector__dropdown {
  max-width: 250px;
}
.flespi-topic-selector__dropdown--tabbed {
  max-width: 350px;
}
.flespi-topic-selector__dropdown .q-item__label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.flespi-topic-selector__tab-list {
  max-height: 300px;
  overflow-y: auto;
}
</style>
