import { describe, it, expect, beforeEach } from 'vitest'
import jsonTreeByMessages from '../../src/mixins/jsonTreeByMessages.js'

describe('jsonTreeByMessages', () => {
  let dest

  beforeEach(() => {
    dest = {}
  })

  describe('write operation (non-empty payload)', () => {
    it('should create single-level topic entry', () => {
      const message = { topic: 'test', payload: 'hello' }
      jsonTreeByMessages(message, '', dest)

      expect(dest.test).toBeDefined()
      expect(dest.test.topic).toBe('test')
      expect(dest.test.value['']).toEqual(message)
    })

    it('should create multi-level topic tree', () => {
      const message = { topic: 'home/living/temp', payload: '22' }
      jsonTreeByMessages(message, '', dest)

      expect(dest.home).toBeDefined()
      expect(dest.home.topic).toBe('home')
      expect(dest.home.children.living).toBeDefined()
      expect(dest.home.children.living.topic).toBe('home/living')
      expect(dest.home.children.living.children.temp).toBeDefined()
      expect(dest.home.children.living.children.temp.topic).toBe('home/living/temp')
      expect(dest.home.children.living.children.temp.value['']).toEqual(message)
    })

    it('should handle multiple messages on same topic', () => {
      const msg1 = { topic: 'sensors/temp', payload: '20' }
      const msg2 = {
        topic: 'sensors/temp',
        payload: '21',
        properties: { userProperties: { device: 'sensor1' } }
      }

      jsonTreeByMessages(msg1, 'device', dest)
      jsonTreeByMessages(msg2, 'device', dest)

      expect(dest.sensors.children.temp.value['']).toEqual(msg1)
      expect(dest.sensors.children.temp.value['sensor1']).toEqual(msg2)
    })

    it('should handle array of messages', () => {
      const messages = [
        { topic: 'a/b', payload: '1' },
        { topic: 'a/c', payload: '2' },
        { topic: 'd', payload: '3' }
      ]

      jsonTreeByMessages(messages, '', dest)

      expect(dest.a.children.b.value['']).toEqual(messages[0])
      expect(dest.a.children.c.value['']).toEqual(messages[1])
      expect(dest.d.value['']).toEqual(messages[2])
    })

    it('should use treeField from userProperties', () => {
      const message = {
        topic: 'device/status',
        payload: 'online',
        properties: {
          userProperties: {
            deviceId: 'dev123'
          }
        }
      }

      jsonTreeByMessages(message, 'deviceId', dest)

      expect(dest.device.children.status.value['dev123']).toEqual(message)
    })

    it('should handle topics with leading slash', () => {
      const message = { topic: '/root/child', payload: 'data' }
      jsonTreeByMessages(message, '', dest)

      expect(dest['']).toBeDefined()
      expect(dest[''].children.root.children.child.value['']).toEqual(message)
    })
  })

  describe('clear operation (empty payload)', () => {
    it('should remove leaf node with empty payload', () => {
      const writeMsg = { topic: 'test/node', payload: 'value' }
      const clearMsg = { topic: 'test/node', payload: '' }

      jsonTreeByMessages(writeMsg, '', dest)
      expect(dest.test.children.node.value['']).toBeDefined()

      jsonTreeByMessages(clearMsg, '', dest)
      expect(dest.test).toBeUndefined()
    })

    it('should preserve sibling nodes when clearing one', () => {
      const msg1 = { topic: 'parent/child1', payload: 'val1' }
      const msg2 = { topic: 'parent/child2', payload: 'val2' }
      const clearMsg = { topic: 'parent/child1', payload: '' }

      jsonTreeByMessages([msg1, msg2], '', dest)
      jsonTreeByMessages(clearMsg, '', dest)

      expect(dest.parent.children.child1).toBeUndefined()
      expect(dest.parent.children.child2.value['']).toEqual(msg2)
    })

    it('should clear specific treeField value only', () => {
      const msg1 = {
        topic: 'test',
        payload: 'val1',
        properties: { userProperties: { key: 'a' } }
      }
      const msg2 = {
        topic: 'test',
        payload: 'val2',
        properties: { userProperties: { key: 'b' } }
      }
      const clearMsg = {
        topic: 'test',
        payload: '',
        properties: { userProperties: { key: 'a' } }
      }

      jsonTreeByMessages([msg1, msg2], 'key', dest)
      jsonTreeByMessages(clearMsg, 'key', dest)

      expect(dest.test.value['a']).toBeUndefined()
      expect(dest.test.value['b']).toEqual(msg2)
    })

    it('should handle clearing non-existent topic gracefully', () => {
      const clearMsg = { topic: 'nonexistent/path', payload: '' }

      expect(() => jsonTreeByMessages(clearMsg, '', dest)).not.toThrow()
    })

    it('should remove empty parent containers after clearing', () => {
      const writeMsg = { topic: 'a/b/c/d', payload: 'deep' }
      const clearMsg = { topic: 'a/b/c/d', payload: '' }

      jsonTreeByMessages(writeMsg, '', dest)
      expect(dest.a.children.b.children.c.children.d).toBeDefined()

      jsonTreeByMessages(clearMsg, '', dest)
      expect(dest.a).toBeUndefined()
    })
  })

  describe('edge cases', () => {
    it('should handle empty topic', () => {
      const message = { topic: '', payload: 'value' }
      jsonTreeByMessages(message, '', dest)

      expect(dest['']).toBeDefined()
      expect(dest[''].value['']).toEqual(message)
    })

    it('should handle numeric payloads as non-empty', () => {
      const message = { topic: 'num', payload: 0 }
      jsonTreeByMessages(message, '', dest)

      expect(dest.num.value['']).toEqual(message)
    })

    it('should handle null payload as non-empty', () => {
      const message = { topic: 'null', payload: null }
      jsonTreeByMessages(message, '', dest)

      expect(dest.null.value['']).toEqual(message)
    })

    it('should handle object payload as non-empty', () => {
      const message = { topic: 'obj', payload: { key: 'value' } }
      jsonTreeByMessages(message, '', dest)

      expect(dest.obj.value['']).toEqual(message)
    })

    it('should handle topics with special characters', () => {
      const message = { topic: 'sensors/temp-1/value_°C', payload: '25' }
      jsonTreeByMessages(message, '', dest)

      expect(dest.sensors.children['temp-1'].children['value_°C'].value['']).toEqual(message)
    })
  })
})
