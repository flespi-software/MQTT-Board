let schemas = {
  publisher: {
    topic: 'string',
    payload: 'string',
    options: {
      qos: 'number',
      retain: 'boolean',
      dup: 'boolean',
      properties: {
        payloadFormatIndicator: 'boolean',
        messageExpiryInterval: 'number',
        topicAlias: 'number',
        responseTopic: 'string',
        correlationData: 'string',
        userProperties: {},
        contentType: 'string'
      }
    }
  },
  subscriber: {
    topic: 'string',
    mode: 'number',
    options: {
      qos: 'number',
      nl: 'boolean',
      rap: 'boolean',
      rh: 'number',
      properties: {
        subscriptionIdentifier: 'number',
        userProperties: {}
      }
    }
  }
}

export default {
  methods: {
    validateObjectBySchema (object, schema) {
      return Object.keys(schema).reduce((result, key) => {
        if (object[key] !== undefined && object[key] !== null) {
          let objectValueType = typeof object[key]
          if (typeof schema[key] === 'object') {
            result = result && this.validateObjectBySchema(object[key], schema[key])
          } else if (objectValueType === schema[key]) {
            result = result && true
          } else {
            result = result && false
          }
        }
        return result
      }, true)
    },
    validateEntity (entity) {
      return this.validateObjectBySchema(entity.settings, schemas[entity.type])
    }
  }
}
