<template>
  <div>
    <q-btn-toggle v-model="entity" :options="options" class="q-mb-md" spread unelevated :toggle-color="cTheme.color" v-if="$q.platform.is.desktop" />
    <q-select
      class="q-mb-md"
      v-else
      v-model="entity"
      :options="options"
      emit-value
      map-options
      outlined dense :color="cTheme.color"
    />
    <div class="relative-position">
      <div v-if="!entity" class="selectors__settings-splash"></div>
      <template v-if="renderConfig.selectors">
        <div v-for="selector in renderConfig.selectors" :key="`${entity}-${selector.name}`">
          <q-select
            class="q-mb-md"
            :value="model[selector.name]"
            @input="value => update(selector.name, value)"
            :options="renderLists[selector.name]"
            emit-value
            map-options
            multiple
            clearable
            use-input
            use-chips
            outlined dense :color="cTheme.color"
            :label="model[selector.name] ? selector.name : `All ${selector.name}`"
            @filter="(filter, update) => filterItems(selector, filter, update)"
          >
            <template v-slot:no-option>
              <q-item>
                <q-item-section>
                  <div class="text-italic text-grey-9 text-h6 text-center text-bold">{{`No ${selector.name}`}}</div>
                  <div class="text-grey text-center">Maybe you need to clean another related selectors</div>
                </q-item-section>
              </q-item>
            </template>
            <template v-slot:option="scope">
              <q-item
                v-bind="scope.itemProps"
                v-on="scope.itemEvents"
              >
                <q-item-section>
                  <q-item-label v-html="scope.opt.label || '*Empty*'" />
                  <q-item-label caption>{{ scope.opt.value }}</q-item-label>
                </q-item-section>
              </q-item>
            </template>
          </q-select>
        </div>
      </template>
      <template v-if="renderConfig.children">
        <flespi-selectors :value="value" :config="renderConfig.children" :connector="connector" @input="updateModel" :entities="model" :key="entity" :theme="cTheme" />
      </template>
    </div>
  </div>
</template>

<script>
import config from './config.json'
export default {
  name: 'FlespiSelectors',
  props: {
    config: {
      type: Object,
      default () {
        return config
      }
    },
    connector: Object,
    entities: {
      type: Object,
      default () {
        return {}
      }
    },
    value: String,
    theme: Object,
    default () {
      return { color: 'grey-9', bgColor: 'white' }
    }
  },
  data () {
    const entity = undefined // Object.keys(this.config)[0]
    // const state = this.initByEntity(entity)
    const model = {} // { ...this.entities, ...state.model }
    const lists = {} // state.lists
    const topic = '' // this.config[entity].topic
    return {
      entity,
      lists,
      renderLists: { ...lists },
      model,
      topic,
      cTheme: { color: 'grey-9', bgColor: 'white', ...this.theme }
    }
  },
  computed: {
    options () {
      return Object.keys(this.config).map(name => ({ label: name, value: name }))
    },
    entitiesNames () { return Object.keys(this.config) },
    renderConfig () {
      return this.entity ? this.config[this.entity] : this.config[this.entitiesNames[0]]
    }
  },
  methods: {
    initByEntity (entity) {
      const selectors = this.config[entity].selectors
      const lists = {},
        model = {}
      if (selectors) {
        selectors.forEach(selector => {
          if (selector.value) { model[selector.name] = null }
          if (selector.list) {
            lists[selector.name] = selector.list
            lists[selector.name].inited = true
          } else {
            lists[selector.name] = []
            lists[selector.name].inited = false
          }
        })
      }
      return { lists, model }
    },
    filterItems (selector, filter, update) {
      if (this.lists[selector.name].inited) {
        this.$set(this.renderLists, selector.name, filter
          ? this.lists[selector.name].filter(item => item.label.toLowerCase().indexOf(filter.toLowerCase()) > -1)
          : this.lists[selector.name])
        update()
        return
      }
      this.connector[selector.getter.name](...selector.getter.params.map(param => this.model[param] || 'all'))
        .then(list => {
          this.$set(this.lists, selector.name, list)
          this.$set(this.renderLists, selector.name, filter
            ? this.lists[selector.name].filter(item => item.label.toLowerCase().indexOf(filter.toLowerCase()) > -1)
            : this.lists[selector.name])
          this.lists[selector.name].inited = true
          update()
        })
    },
    update (selectorName, value) {
      this.$set(this.model, selectorName, value && value.length ? value : null)
      if (this.entity && this.config[this.entity].selectors) {
        this.config[this.entity].selectors.forEach((selector) => {
          if (selector.getter && selector.getter.params && selector.getter.params.includes(selectorName)) {
            this.$set(this.lists, selector.name, [])
            this.$set(this.renderLists, selector.name, [])
          }
        })
      }
      this.$emit('input', this.getCurrentTopic(this.topic, this.model))
    },
    updateModel (topic) {
      this.topic = topic
      this.$emit('input', this.getCurrentTopic(this.topic, this.model))
    },
    getCurrentTopic (topic, model) {
      let currentTopic = topic && topic.topicPattern
      if (topic && this.entity && this.config[this.entity].selectors) {
        const vars = this.config[this.entity].selectors.map(selector => selector.name)
        currentTopic = vars.reduce((topic, variable) => {
          const name = variable
          const value = model[name]
          if (value !== undefined) {
            if (value && value.length) {
              topic = topic.replace(`$\{${name}}`, value)
            } else {
              topic = topic.replace(`$\{${name}}`, '+')
            }
          }
          return topic
        }, currentTopic)
      }
      return { ...topic, topicPattern: currentTopic }
    },
    topicToModelHandler (topic) {
      function createModelPath (config) {
        const paths = []
        for (const pathPart in config) {
          const confByPath = config[pathPart]
          const path = [pathPart]
          const topic = confByPath.topic && confByPath.topic.topicPattern
          if (confByPath.children) {
            const childrenProcess = createModelPath(confByPath.children)
            for (const child of childrenProcess) {
              paths.push(
                {
                  path: [...path, ...child.path],
                  topic: child.topic
                }
              )
            }
          } else {
            paths.push({ path, topic })
          }
        }
        return paths
      }
      const patternsToPath = createModelPath(this.config)
      const routes = patternsToPath.filter(({ path, topic: pattern }) => {
        pattern = new RegExp(pattern.replace(/\$\{\w+\}/g, '.*'))
        return pattern.test(topic)
      })
      const route = routes.pop()
      let model
      if (route) {
        model = { path: route.path, values: {} }
        const patternPath = route.topic.split('/'),
          valuesPath = topic.split('/')
        patternPath.forEach((path, index) => {
          path.replace(/\$\{(\w+)\}/, (_, name) => {
            const value = valuesPath[index]
            model.values[name] = value === '+' ? null : value.split(',')
          })
        })
      }
      return model
    },
    setModel (model) {
      if (!model) { return false }
      const { lists, model: selectorsModel } = this.initByEntity(model.path[0])
      this.entity = model.path[0]
      this.lists = lists
      this.model = Object.assign(selectorsModel, model.values)
      this.topic = this.config[model.path[0]].topic
      this.topic && this.$emit('input', this.getCurrentTopic(this.topic, this.model))
    },
    changeEntity (entity) {
      const { lists, model } = this.initByEntity(entity)
      this.lists = lists
      this.model = { ...model, ...this.entities }
      this.topic = this.config[entity].topic
      this.topic && this.$emit('input', this.getCurrentTopic(this.topic, this.model))
    }
  },
  created () {
    this.setModel(this.topicToModelHandler(this.value))
    const topicPattern = this.getCurrentTopic(this.topic, this.model)
    this.$watch('entity', this.changeEntity)
    if (topicPattern) {
      this.$emit('input', topicPattern)
    }
  },
  watch: {
    entities: {
      deep: true,
      handler (entities) {
        this.model = { ...this.model, ...entities }
        if (this.entity) {
          const { lists } = this.initByEntity(this.entity)
          this.lists = lists
        }
      }
    }
  }
}
</script>

<style lang="stylus">
  .selectors__settings-splash
    position absolute
    top 0
    bottom 0
    right 0
    left 0
    background-color rgba(255,255,255,0.6)
    z-index 1
</style>
