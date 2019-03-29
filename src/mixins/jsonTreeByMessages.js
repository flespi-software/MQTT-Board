import Vue from 'vue'
function jsonTreeByMessages (messages, treeField, dest) {
  function write (topic, payload, dest) {
    let path = topic.split('/')
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
        let valueByTreeField = payload.properties && payload.properties.userProperties && payload.properties.userProperties[treeField]
          ? payload.properties.userProperties[treeField]
          : ''
        Vue.set(currentNesting[pathElement].value, valueByTreeField, payload)
      }
    })
  }
  function clear (topic, payload, dest) {
    function getNesting (obj, path) {
      let currentChildContainers = new Array(path.length).fill(undefined)
      currentChildContainers[0] = obj
      return path.reduce((nesting, pathElement, pathIndex, path) => {
        let currentNesting = {
          container: currentChildContainers[pathIndex] || null,
          name: pathElement
        }
        currentChildContainers[pathIndex + 1] = currentNesting.container && currentNesting.container[pathElement] ? currentNesting.container[pathElement].children : null
        return currentNesting
      }, {container: obj, name: path[0]})
    }
    let path = topic.split('/')
    new Array(path.length).fill('').forEach((_, index) => {
      let nestingCount = path.length - index
      let currentPath = path.slice(0, nestingCount)
      let nesting = getNesting(dest, currentPath)
      if (!nesting.container || !nesting.container[nesting.name]) { return false }
      let valueByPath = nesting.container[nesting.name]
      let hasChildren = valueByPath.children && !!Object.keys(valueByPath.children).length
      if (valueByPath.value && index === 0) {
        let valueByTreeField = payload.properties && payload.properties.userProperties && payload.properties.userProperties[treeField]
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
  if (Array.isArray(messages)) {
    messages.forEach(message => {
      message.payload.length ? write(message.topic, message, dest) : clear(message.topic, message, dest)
    })
  } else {
    messages.payload.length ? write(messages.topic, messages, dest) : clear(messages.topic, messages, dest)
  }
}

export default jsonTreeByMessages
