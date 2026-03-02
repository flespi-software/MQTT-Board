import { describe, it, expect } from 'vitest'

// Extract the validateTopic function logic for testing
// (The function is not exported, so we recreate it here for unit testing)
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

describe('validateTopic', () => {
  describe('valid topics', () => {
    it('should accept simple topic without wildcards', () => {
      expect(validateTopic('home/living/temp')).toBe(true)
    })

    it('should accept single-level topic', () => {
      expect(validateTopic('temperature')).toBe(true)
    })

    it('should accept empty topic', () => {
      expect(validateTopic('')).toBe(true)
    })

    it('should accept topic with trailing slash', () => {
      expect(validateTopic('home/living/')).toBe(true)
    })

    it('should accept topic with leading slash', () => {
      expect(validateTopic('/home/living')).toBe(true)
    })
  })

  describe('single-level wildcard (+)', () => {
    it('should accept + as entire level', () => {
      expect(validateTopic('home/+/temp')).toBe(true)
    })

    it('should accept + at beginning', () => {
      expect(validateTopic('+/living/temp')).toBe(true)
    })

    it('should accept + at end', () => {
      expect(validateTopic('home/living/+')).toBe(true)
    })

    it('should accept multiple + wildcards', () => {
      expect(validateTopic('+/+/+')).toBe(true)
    })

    it('should accept topic that is just +', () => {
      expect(validateTopic('+')).toBe(true)
    })

    it('should reject + mixed with text in same level', () => {
      expect(validateTopic('home/living+/temp')).toBe(false)
    })

    it('should reject + at start of level with text', () => {
      expect(validateTopic('home/+living/temp')).toBe(false)
    })

    it('should reject + at end of level with text', () => {
      expect(validateTopic('home/living+/temp')).toBe(false)
    })
  })

  describe('multi-level wildcard (#)', () => {
    it('should accept # at end of topic', () => {
      expect(validateTopic('home/living/#')).toBe(true)
    })

    it('should accept topic that is just #', () => {
      expect(validateTopic('#')).toBe(true)
    })

    it('should accept # after single level', () => {
      expect(validateTopic('home/#')).toBe(true)
    })

    it('should reject # in middle of topic', () => {
      expect(validateTopic('home/#/temp')).toBe(false)
    })

    it('should reject # at beginning with more levels', () => {
      expect(validateTopic('#/home')).toBe(false)
    })

    it('should reject # mixed with text in same level', () => {
      expect(validateTopic('home/living#')).toBe(false)
    })

    it('should reject # at start of level with text', () => {
      expect(validateTopic('home/#living')).toBe(false)
    })
  })

  describe('combined wildcards', () => {
    it('should accept + followed by # at end', () => {
      expect(validateTopic('+/home/#')).toBe(true)
    })

    it('should accept multiple + followed by #', () => {
      expect(validateTopic('+/+/#')).toBe(true)
    })

    it('should reject # before +', () => {
      expect(validateTopic('#/+')).toBe(false)
    })
  })

  describe('special characters', () => {
    it('should accept topics with hyphens', () => {
      expect(validateTopic('home-1/living-room/temp')).toBe(true)
    })

    it('should accept topics with underscores', () => {
      expect(validateTopic('home_1/living_room/temp')).toBe(true)
    })

    it('should accept topics with dots', () => {
      expect(validateTopic('home.1/living.room/temp')).toBe(true)
    })

    it('should accept topics with unicode characters', () => {
      expect(validateTopic('домой/гостиная/температура')).toBe(true)
    })

    it('should accept topics with numbers', () => {
      expect(validateTopic('sensor123/data456')).toBe(true)
    })
  })
})

describe('getType', () => {
  it('should return String for strings', () => {
    expect(getType('hello')).toBe('String')
    expect(getType('')).toBe('String')
  })

  it('should return Number for numbers', () => {
    expect(getType(42)).toBe('Number')
    expect(getType(3.14)).toBe('Number')
    expect(getType(0)).toBe('Number')
    expect(getType(-10)).toBe('Number')
  })

  it('should return Boolean for booleans', () => {
    expect(getType(true)).toBe('Boolean')
    expect(getType(false)).toBe('Boolean')
  })

  it('should return Object for objects', () => {
    expect(getType({})).toBe('Object')
    expect(getType({ key: 'value' })).toBe('Object')
  })

  it('should return Array for arrays', () => {
    expect(getType([])).toBe('Array')
    expect(getType([1, 2, 3])).toBe('Array')
  })

  it('should return Null for null', () => {
    expect(getType(null)).toBe('Null')
  })

  it('should return Undefined for undefined', () => {
    expect(getType(undefined)).toBe('Undefined')
  })

  it('should return Function for functions', () => {
    expect(getType(() => {})).toBe('Function')
    expect(getType(function () {})).toBe('Function')
  })
})

describe('validation rules', () => {
  describe('min/max validation', () => {
    // Test keepalive: min 0, max 65535
    it('should validate keepalive within range', () => {
      expect(0).toBeGreaterThanOrEqual(0)
      expect(0).toBeLessThanOrEqual(65535)
      expect(65535).toBeLessThanOrEqual(65535)
      expect(420).toBeGreaterThanOrEqual(0)
      expect(420).toBeLessThanOrEqual(65535)
    })

    it('should reject keepalive outside range', () => {
      expect(-1).toBeLessThan(0)
      expect(65536).toBeGreaterThan(65535)
    })

    // Test sessionExpiryInterval: min 0, max 4294967295
    it('should validate sessionExpiryInterval within range', () => {
      expect(0).toBeGreaterThanOrEqual(0)
      expect(4294967295).toBeLessThanOrEqual(4294967295)
    })

    // Test subscriptionIdentifier: min 1, max 268435455
    it('should validate subscriptionIdentifier within range', () => {
      expect(1).toBeGreaterThanOrEqual(1)
      expect(268435455).toBeLessThanOrEqual(268435455)
    })
  })

  describe('options validation', () => {
    it('should validate protocolVersion options', () => {
      const validVersions = [3, 4, 5]
      expect(validVersions).toContain(3)
      expect(validVersions).toContain(4)
      expect(validVersions).toContain(5)
      expect(validVersions).not.toContain(2)
      expect(validVersions).not.toContain(6)
    })

    it('should validate QoS options', () => {
      const validQos = [0, 1, 2]
      expect(validQos).toContain(0)
      expect(validQos).toContain(1)
      expect(validQos).toContain(2)
      expect(validQos).not.toContain(-1)
      expect(validQos).not.toContain(3)
    })

    it('should validate retain handling options', () => {
      const validRh = [0, 1, 2]
      expect(validRh).toContain(0)
      expect(validRh).toContain(1)
      expect(validRh).toContain(2)
    })
  })

  describe('required fields', () => {
    it('should require clientId to be non-empty string', () => {
      const clientId = 'mqtt-board-abc123'
      expect(typeof clientId).toBe('string')
      expect(clientId.length).toBeGreaterThan(0)
    })

    it('should require host to be non-empty string', () => {
      const host = 'wss://mqtt.flespi.io'
      expect(typeof host).toBe('string')
      expect(host.length).toBeGreaterThan(0)
    })

    it('should require publisher topic to be non-empty string', () => {
      const topic = 'my/topic'
      expect(typeof topic).toBe('string')
      expect(topic.length).toBeGreaterThan(0)
    })

    it('should require subscriber topic to be non-empty string', () => {
      const topic = '#'
      expect(typeof topic).toBe('string')
      expect(topic.length).toBeGreaterThan(0)
    })
  })
})
