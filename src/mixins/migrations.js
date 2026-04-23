import { version } from '../../package.json'
import { compare } from 'compare-versions'
import get from 'lodash/get'
import set from 'lodash/set'
import { DEFAULT_MAX_PANES } from './paneConstants.js'
const migrations = {
  '2.5.1': (client) => {
    if (!get(client.config, 'properties.userProperties', undefined)) {
      set(client.config, 'properties.userProperties', undefined)
    }
    if (!get(client.config, 'will.properties.userProperties', undefined)) {
      set(client.config, 'properties.userProperties', undefined)
    }
    client.publishers.forEach((publisher) => {
      if (!get(publisher, 'options.properties.userProperties', undefined)) {
        set(publisher, 'options.properties.userProperties', undefined)
      }
    })
    client.subscribers.forEach((subscriber) => {
      if (!get(subscriber, 'options.properties.userProperties', undefined)) {
        set(subscriber, 'options.properties.userProperties', undefined)
      }
      if (!get(subscriber, 'unsubscribeProperties', undefined)) {
        set(subscriber, 'unsubscribePropertie', undefined)
      }
    })
  },
  '3.4.0': (client) => {
    if (typeof client.maxPanes !== 'number') client.maxPanes = DEFAULT_MAX_PANES
  }
}

export default {
  methods: {
    migrateClient (client) {
      const versions = Object.keys(migrations)
      const fromVersion = client.appVersion || '2.5.0'
      const toVersion = version
      versions.forEach((version) => {
        if (compare(version, fromVersion, '>') && compare(version, toVersion, '<=')) {
          try {
            migrations[version](client)
          } catch (e) {
            console.log(e)
          }
        }
      })
      return client
    }
  }
}
