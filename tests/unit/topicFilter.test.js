import { describe, it, expect } from 'vitest'
import {
  fixedTopicPrefix,
  isTopicOrDescendant,
  topicMatchesFilter,
  isExpandAncestor,
  sanitizeRatio
} from '../../src/mixins/topicFilter.js'

describe('topicFilter', () => {
  describe('fixedTopicPrefix', () => {
    it('drops a trailing multi-level wildcard', () => {
      expect(fixedTopicPrefix('flespi/message/gw/devices/#')).toBe('flespi/message/gw/devices')
    })

    it('keeps the single fixed segment of a top-level wildcard', () => {
      expect(fixedTopicPrefix('flespi/#')).toBe('flespi')
    })

    it('stops at the first single-level wildcard', () => {
      expect(fixedTopicPrefix('flespi/+/gw/#')).toBe('flespi')
    })

    it('returns the whole topic when there is no wildcard', () => {
      expect(fixedTopicPrefix('flespi/message/gw/devices/123')).toBe('flespi/message/gw/devices/123')
    })

    it('returns empty string for a bare # and for nullish input', () => {
      expect(fixedTopicPrefix('#')).toBe('')
      expect(fixedTopicPrefix('')).toBe('')
      expect(fixedTopicPrefix(null)).toBe('')
      expect(fixedTopicPrefix(undefined)).toBe('')
    })
  })

  describe('isTopicOrDescendant', () => {
    it('matches the exact topic', () => {
      expect(isTopicOrDescendant('a/b', 'a/b')).toBe(true)
    })

    it('matches a descendant', () => {
      expect(isTopicOrDescendant('a/b/c', 'a/b')).toBe(true)
    })

    it('does not match a sibling or a prefix-only string match', () => {
      expect(isTopicOrDescendant('a/bc', 'a/b')).toBe(false)
      expect(isTopicOrDescendant('a', 'a/b')).toBe(false)
    })
  })

  describe('topicMatchesFilter', () => {
    const selected = ['flespi/message/gw/devices', 'flespi/state']

    it('matches a selected topic and its descendants (OR across selections)', () => {
      expect(topicMatchesFilter('flespi/message/gw/devices', selected)).toBe(true)
      expect(topicMatchesFilter('flespi/message/gw/devices/123', selected)).toBe(true)
      expect(topicMatchesFilter('flespi/state/abc', selected)).toBe(true)
    })

    it('rejects topics outside every selection', () => {
      expect(topicMatchesFilter('flespi/message/gw/channels/1', selected)).toBe(false)
      expect(topicMatchesFilter('flespi/log', selected)).toBe(false)
    })

    it('matches nothing for an empty selection', () => {
      expect(topicMatchesFilter('anything', [])).toBe(false)
    })
  })

  describe('isExpandAncestor', () => {
    const prefix = 'flespi/message/gw/devices'

    it('matches ancestors and the prefix itself', () => {
      expect(isExpandAncestor('flespi', prefix)).toBe(true)
      expect(isExpandAncestor('flespi/message/gw', prefix)).toBe(true)
      expect(isExpandAncestor('flespi/message/gw/devices', prefix)).toBe(true)
    })

    it('does not match descendants of the prefix or unrelated nodes', () => {
      expect(isExpandAncestor('flespi/message/gw/devices/123', prefix)).toBe(false)
      expect(isExpandAncestor('flespi/state', prefix)).toBe(false)
    })

    it('matches nothing when the prefix is empty', () => {
      expect(isExpandAncestor('flespi', '')).toBe(false)
    })
  })

  describe('sanitizeRatio', () => {
    it('passes through valid numbers (including limits)', () => {
      expect(sanitizeRatio(40, 20)).toBe(40)
      expect(sanitizeRatio(0, 20)).toBe(0)
      expect(sanitizeRatio(100, 20)).toBe(100)
    })

    it('falls back for null/undefined/NaN', () => {
      expect(sanitizeRatio(null, 20)).toBe(20)
      expect(sanitizeRatio(undefined, 60)).toBe(60)
      expect(sanitizeRatio(NaN, 60)).toBe(60)
    })
  })
})
