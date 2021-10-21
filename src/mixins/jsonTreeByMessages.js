import Vue from 'vue'
function jsonTreeByMessages (messages, treeField, dest) {
  function write (topic, payload, dest) {
    const path = topic.split('/')
    let currentNesting = dest
    let currentTopic = ''
    path.forEach((pathElement, pathIndex, path) => {
      if (!currentNesting[pathElement]) {
        Vue.set(currentNesting, pathElement, { children: undefined, topic: '', value: undefined })
      }
      if (pathIndex !== 0) {
        currentTopic += '/'
      }
      currentTopic += `${pathElement}`
      Vue.set(currentNesting[pathElement], 'topic', currentTopic)
      if (pathIndex !== path.length - 1) {
        if (!currentNesting[pathElement].children) {
          Vue.set(currentNesting[pathElement], 'children', {})
        }
        currentNesting = currentNesting[pathElement].children
      } else {
        if (!currentNesting[pathElement].value) {
          Vue.set(currentNesting[pathElement], 'value', {})
        }
        const valueByTreeField = payload.properties && payload.properties.userProperties && payload.properties.userProperties[treeField]
          ? payload.properties.userProperties[treeField]
          : ''
        Vue.set(currentNesting[pathElement].value, valueByTreeField, payload)
      }
    })
  }
  function clear (topic, payload, dest) {
    function getNesting (obj, path) {
      const currentChildContainers = new Array(path.length).fill(undefined)
      currentChildContainers[0] = obj
      return path.reduce((nesting, pathElement, pathIndex, path) => {
        const currentNesting = {
          container: currentChildContainers[pathIndex] || null,
          name: pathElement
        }
        currentChildContainers[pathIndex + 1] = currentNesting.container && currentNesting.container[pathElement] ? currentNesting.container[pathElement].children : null
        return currentNesting
      }, { container: obj, name: path[0] })
    }
    const path = topic.split('/')
    new Array(path.length).fill('').forEach((_, index) => {
      const nestingCount = path.length - index
      const currentPath = path.slice(0, nestingCount)
      const nesting = getNesting(dest, currentPath)
      if (!nesting.container || !nesting.container[nesting.name]) { return false }
      const valueByPath = nesting.container[nesting.name]
      const hasChildren = valueByPath.children && !!Object.keys(valueByPath.children).length
      if (valueByPath.value && index === 0) {
        const valueByTreeField = payload.properties && payload.properties.userProperties && payload.properties.userProperties[treeField]
          ? payload.properties.userProperties[treeField]
          : ''
        Vue.delete(valueByPath.value, valueByTreeField)
        if (!Object.keys(valueByPath.value).length) {
          Vue.set(valueByPath, 'value', undefined)
        }
      }
      if (!hasChildren) {
        Vue.set(valueByPath, 'children', undefined)
        if (!valueByPath.value) {
          Vue.delete(nesting.container, nesting.name)
        }
      }
    })
  }
  function getAction (message) {
    return typeof message.payload === 'string' && !message.payload.length ? clear : write
  }
  if (Array.isArray(messages)) {
    messages.forEach(message => {
      getAction(message)(message.topic, message, dest)
    })
  } else {
    getAction(messages)(messages.topic, messages, dest)
  }
}

export default jsonTreeByMessages
