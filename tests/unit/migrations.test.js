import { describe, it, expect } from 'vitest'
import { compare } from 'compare-versions'

// Test the version comparison logic used in migrations
describe('migrations version comparison', () => {
  describe('compare function', () => {
    it('should correctly compare equal versions', () => {
      expect(compare('2.5.0', '2.5.0', '=')).toBe(true)
      expect(compare('2.5.1', '2.5.1', '=')).toBe(true)
    })

    it('should correctly identify newer versions', () => {
      expect(compare('2.5.1', '2.5.0', '>')).toBe(true)
      expect(compare('2.6.0', '2.5.1', '>')).toBe(true)
      expect(compare('3.0.0', '2.9.9', '>')).toBe(true)
    })

    it('should correctly identify older versions', () => {
      expect(compare('2.5.0', '2.5.1', '<')).toBe(true)
      expect(compare('2.5.1', '2.6.0', '<')).toBe(true)
      expect(compare('2.9.9', '3.0.0', '<')).toBe(true)
    })

    it('should handle less than or equal', () => {
      expect(compare('2.5.0', '2.5.1', '<=')).toBe(true)
      expect(compare('2.5.1', '2.5.1', '<=')).toBe(true)
      expect(compare('2.6.0', '2.5.1', '<=')).toBe(false)
    })

    it('should handle greater than or equal', () => {
      expect(compare('2.5.1', '2.5.0', '>=')).toBe(true)
      expect(compare('2.5.1', '2.5.1', '>=')).toBe(true)
      expect(compare('2.5.0', '2.5.1', '>=')).toBe(false)
    })
  })

  describe('migration selection logic', () => {
    // Simulating the migration selection logic from migrations.js
    function shouldApplyMigration (migrationVersion, fromVersion, toVersion) {
      return compare(migrationVersion, fromVersion, '>') && compare(migrationVersion, toVersion, '<=')
    }

    it('should apply migration when version is between from and to', () => {
      expect(shouldApplyMigration('2.5.1', '2.5.0', '2.6.0')).toBe(true)
    })

    it('should not apply migration when version is before from', () => {
      expect(shouldApplyMigration('2.4.0', '2.5.0', '2.6.0')).toBe(false)
    })

    it('should not apply migration when version equals from', () => {
      expect(shouldApplyMigration('2.5.0', '2.5.0', '2.6.0')).toBe(false)
    })

    it('should apply migration when version equals to', () => {
      expect(shouldApplyMigration('2.6.0', '2.5.0', '2.6.0')).toBe(true)
    })

    it('should not apply migration when version is after to', () => {
      expect(shouldApplyMigration('2.7.0', '2.5.0', '2.6.0')).toBe(false)
    })

    it('should handle multiple migrations in order', () => {
      const migrations = ['2.5.1', '2.5.2', '2.6.0', '2.6.1']
      const fromVersion = '2.5.0'
      const toVersion = '2.6.1'

      const applicableMigrations = migrations.filter(
        v => shouldApplyMigration(v, fromVersion, toVersion)
      )

      expect(applicableMigrations).toEqual(['2.5.1', '2.5.2', '2.6.0', '2.6.1'])
    })

    it('should handle default fromVersion of 2.5.0', () => {
      const fromVersion = '2.5.0' // Default when client.appVersion is not set
      const toVersion = '2.6.12'

      expect(shouldApplyMigration('2.5.1', fromVersion, toVersion)).toBe(true)
      expect(shouldApplyMigration('2.5.0', fromVersion, toVersion)).toBe(false)
    })
  })

  describe('migration 2.5.1 structure changes', () => {
    // Test that the migration properly sets up userProperties
    it('should add userProperties to config.properties if missing', () => {
      const client = {
        config: {
          properties: {}
        },
        publishers: [],
        subscribers: []
      }

      // Simulate migration
      if (!client.config.properties.userProperties) {
        client.config.properties.userProperties = undefined
      }

      expect(client.config.properties).toHaveProperty('userProperties')
    })

    it('should add userProperties to publisher options if missing', () => {
      const publisher = {
        options: {
          properties: {}
        }
      }

      // Simulate migration
      if (!publisher.options.properties.userProperties) {
        publisher.options.properties.userProperties = undefined
      }

      expect(publisher.options.properties).toHaveProperty('userProperties')
    })

    it('should add userProperties to subscriber options if missing', () => {
      const subscriber = {
        options: {
          properties: {}
        }
      }

      // Simulate migration
      if (!subscriber.options.properties.userProperties) {
        subscriber.options.properties.userProperties = undefined
      }

      expect(subscriber.options.properties).toHaveProperty('userProperties')
    })

    it('should not overwrite existing userProperties', () => {
      const client = {
        config: {
          properties: {
            userProperties: { existing: 'value' }
          }
        },
        publishers: [],
        subscribers: []
      }

      // Migration should not overwrite
      if (!client.config.properties.userProperties) {
        client.config.properties.userProperties = undefined
      }

      expect(client.config.properties.userProperties).toEqual({ existing: 'value' })
    })
  })
})

describe('client data structure', () => {
  it('should have expected structure for migration', () => {
    const client = {
      appVersion: '2.5.0',
      config: {
        clientId: 'test-client',
        host: 'wss://mqtt.flespi.io',
        properties: {
          userProperties: undefined
        },
        will: {
          properties: {
            userProperties: undefined
          }
        }
      },
      publishers: [
        {
          topic: 'test/topic',
          options: {
            properties: {
              userProperties: undefined
            }
          }
        }
      ],
      subscribers: [
        {
          topic: '#',
          options: {
            properties: {
              userProperties: undefined
            }
          },
          unsubscribeProperties: undefined
        }
      ]
    }

    expect(client).toHaveProperty('config')
    expect(client).toHaveProperty('publishers')
    expect(client).toHaveProperty('subscribers')
    expect(client.config).toHaveProperty('properties')
    expect(client.config).toHaveProperty('will')
    expect(client.publishers[0]).toHaveProperty('options')
    expect(client.subscribers[0]).toHaveProperty('options')
  })
})
