// import isNil from 'lodash/isNil'
import get from 'lodash/get'
import schemas from './declarations'

function validateTopic (topic) {
  const parts = topic.split('/')
  for (let i = 0; i < parts.length; i++) {
    if (parts[i] === '+') { continue }
    if (parts[i] === '#') { return i === parts.length - 1 }
    if (parts[i].indexOf('+') !== -1 || parts[i].indexOf('#') !== -1) {
      return false
    }
  }

  return true
}

function getType (data) {
  let result = ''
  const typeString = Object.prototype.toString.call(data)
  result = typeString.replace(/\[object /gi, '').replace(/\]/gi, '')
  return result
}

function min (value, path, object) {
  let result = true
  const fieldSchema = get(schemas, path, undefined)
  if (fieldSchema.min !== undefined) {
    const msg = `Value must be more or equal ${fieldSchema.min}`
    result = fieldSchema.min <= value || msg
  }
  return result
}
function max (value, path, object) {
  let result = true
  const fieldSchema = get(schemas, path, undefined)
  if (fieldSchema.max !== undefined) {
    const msg = `Value must be less or equal ${fieldSchema.max}`
    result = fieldSchema.max >= value || msg
  }
  return result
}
function options (value, path, object) {
  let result = true
  const fieldSchema = get(schemas, path, undefined)
  if (fieldSchema.options !== undefined) {
    const msg = `Value must be ${fieldSchema.options.join(' or ')}`
    result = fieldSchema.options.includes(value) || msg
  }
  return result
}

function typeDetails (value, path, object) {
  let result = true
  const minV = min(value, path, object),
    maxV = max(value, path, object),
    optV = options(value, path, object)
  if (typeof optV === 'string') {
    result = optV
  } else if (typeof maxV === 'string') {
    result = maxV
  } else if (typeof minV === 'string') {
    result = minV
  }
  return result
}

const commonValidators = {
  min,
  max,
  options,
  typeDetails,
  types (value, path, object) {
    let result = true
    const fieldType = this.getType(value),
      fieldSchema = get(schemas, path, undefined),
      isTypeValid = fieldType === fieldSchema.type,
      isEmpty = fieldType === 'String' && !value.length,
      isValueValid = typeDetails(value, path, object)
    if (fieldSchema.required) {
      if (isEmpty) {
        result = 'Value cannot be empty'
      } else if (!isTypeValid) {
        result = 'Value has invalid type'
      } else if (typeof isValueValid === 'string') {
        result = isValueValid
      }
    } else if (!fieldSchema.required && fieldType !== 'Undefined') {
      if (!isTypeValid) {
        result = 'Value has invalid type'
      } else if (typeof isValueValid === 'string') {
        result = isValueValid
      }
    }
    return result
  },
  custom (value, path, object) {
    let result = true
    if (customValidators[path]) {
      for (const validator of customValidators[path]) {
        const validatorResult = validator.apply(this, [value, path, object])
        if (typeof validatorResult === 'string') {
          result = validatorResult
          break
        }
      }
    }
    return result
  }
}

const customValidators = {
  // path:[Function(value, path, object)]
  'settings.host': [
    function (value, path, object) {
      return (!(!!this.secure && value.indexOf('ws:') === 0)) || 'Host must be only over secured sockets'
    }
  ],
  'publisher.topic': [
    function (value, path, object) {
      return validateTopic(value) || 'Topic is invalid'
    }
  ],
  'subscriber.topic': [
    function (value, path, object) {
      return validateTopic(value) || 'Topic is invalid'
    },
    function (value, path, object) {
      return ((
        value.indexOf(',') === -1 ||
        (value.indexOf(',') !== -1 && object.options.properties.subscriptionIdentifier)
      ) &&
      (
        value.indexOf('$filter') !== 0 ||
        (value.indexOf('$filter') === 0 && object.options.properties.subscriptionIdentifier)
      )) ||
      'You need to set up subscription identifier in the properties below'
    }
  ]
}

export default {
  methods: {
    getType,
    validateField (value, path, object, needReason = false) {
      let result = true
      const validators = ['types', 'custom']
      for (const validatorName of validators) {
        const validator = commonValidators[validatorName]
        const validatorResult = validator.apply(this, [value, path, object])
        if (typeof validatorResult === 'string') {
          if (needReason) {
            result = validatorResult
          } else {
            result = false
          }
          break
        }
      }
      return result
    },
    validateObjectBySchema (object, path, needReasons = false) {
      const schema = get(schemas, path, {})
      let result = Object.keys(schema).reduce((result, key) => {
        const value = object[key],
          isDict = !!schema[key].type,
          fieldPath = `${path}.${key}`
        let reason = true
        if (!isDict) {
          reason = this.validateObjectBySchema(value, fieldPath, needReasons)
        } else {
          reason = this.validateField(value, fieldPath, object, needReasons)
        }
        if (typeof reason !== 'boolean' || !reason) { result[key] = reason }
        return result
      }, {})
      const hasKeys = !!Object.keys(result).length
      if (!needReasons || !hasKeys) {
        result = !hasKeys
      }
      return result
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
    validateSettings (settings, needReasons = false) {
      return this.validateObjectBySchema(settings, 'settings', needReasons)
    },
    validatePublisher (publisher, needReasons = false) {
      return this.validateObjectBySchema(publisher, 'publisher', needReasons)
    },
    validateSubscriber (subscriber, needReasons = false) {
      return this.validateObjectBySchema(subscriber, 'subscriber', needReasons)
    },
    validateEntityRecord (settings, needReasons = false) {
      return this.validateObjectBySchema(settings, 'entity', needReasons)
    }
  }
}
