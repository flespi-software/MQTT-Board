import isNil from 'lodash/isNil'
const schemas = {
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
  },
  settings: {
    clientId: 'string',
    host: 'string',
    keepalive: 'number',
    protocolVersion: 'number',
    clean: 'boolean',
    username: 'string',
    password: 'string',
    properties: {
      sessionExpiryInterval: 'number',
      receiveMaximum: 'number',
      maximumPacketSize: 'number',
      topicAliasMaximum: 'number',
      requestResponseInformation: 'boolean',
      requestProblemInformation: 'boolean',
      userProperties: {},
      authenticationMethod: 'string',
      authenticationData: 'string'
    },
    will: {
      topic: 'string',
      payload: 'string',
      qos: 'number',
      retain: 'boolean',
      properties: {
        willDelayInterval: 'number',
        payloadFormatIndicator: 'boolean',
        messageExpiryInterval: 'number',
        contentType: 'string',
        responseTopic: 'string',
        correlationData: 'string',
        userProperties: {}
      }
    }
  },
  entity: {
    type: 'string',
    index: 'number',
    id: 'string'
  }
}

export default {
  methods: {
    validateObjectBySchema (object, schema) {
      return Object.keys(schema).reduce((result, key) => {
        if (object[key] !== undefined && object[key] !== null) {
          const objectValueType = typeof object[key]
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
      switch (entity.type) {
        case 'publisher': {
          return this.validatePublisher(entity.settings)
        }
        case 'subscriber': {
          return this.validateSubscriber(entity.settings)
        }
        default: {
          return false
        }
      }
    },
    validateSettings (settings) {
      return this.validateObjectBySchema(settings, schemas.settings) &&
        !!settings.clientId &&
        !!settings.host &&
        (
          isNil(settings.keepalive) ||
          (settings.keepalive >= 0 && settings.keepalive <= 0xffff)
        ) &&
        (
          !settings.will || (!!settings.will && (
            (!!settings.will.topic && !!settings.will.payload) ||
            (!settings.will.topic && !settings.will.payload)
          ))
        ) &&
        (!settings.properties ||
          (
            !!settings.properties && (
              (isNil(settings.properties.sessionExpiryInterval) || (settings.properties.sessionExpiryInterval >= 0 && settings.properties.sessionExpiryInterval <= 0xffffffff)) &&
              (isNil(settings.properties.receiveMaximum) || (settings.properties.receiveMaximum > 0 && settings.properties.receiveMaximum <= 0xffff)) &&
              (isNil(settings.properties.maximumPacketSize) || (settings.properties.maximumPacketSize > 0 && settings.properties.maximumPacketSize <= 0xffffffff)) &&
              (isNil(settings.properties.topicAliasMaximum) || (settings.properties.topicAliasMaximum >= 0 && settings.properties.topicAliasMaximum <= 0xffff))
            )
          )
        )
    },
    validatePublisher (publisher) {
      return this.validateObjectBySchema(publisher, schemas.publisher) &&
      !!publisher.topic && !!publisher.options &&
      (!publisher.options.properties ||
        (
          !!publisher.options.properties &&
          (isNil(publisher.options.properties.messageExpiryInterval) || (publisher.options.properties.messageExpiryInterval >= 0 && publisher.options.properties.messageExpiryInterval <= 0xffffffff)) &&
          (isNil(publisher.options.properties.topicAlias) || (publisher.options.properties.topicAlias > 0 && publisher.options.properties.topicAlias <= 0xffff))
        )
      )
    },
    validateSubscriber (subscriber) {
      return this.validateObjectBySchema(subscriber, schemas.subscriber) &&
        !!subscriber.topic && !!subscriber.options &&
        (!subscriber.options.properties ||
          (
            !!subscriber.options.properties &&
            (isNil(subscriber.options.properties.subscriptionIdentifier) || (subscriber.options.properties.subscriptionIdentifier > 0 && subscriber.options.properties.subscriptionIdentifier <= 268435455))
          )
        )
    },
    validateEntityRecord (settings) {
      return this.validateObjectBySchema(settings, schemas.entity)
    }
  }
}
