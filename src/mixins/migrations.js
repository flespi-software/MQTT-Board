import { version } from '../../package.json'
import compareVersions from 'compare-versions'
import get from 'lodash/get'
import set from 'lodash/set'
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
  }
}

export default {
  methods: {
    migrateClient (client) {
      const versions = Object.keys(migrations)
      const fromVersion = client.appVersion || '2.5.0'
      const toVersion = version
      versions.forEach((version) => {
        if (compareVersions.compare(version, fromVersion, '>') && compareVersions.compare(version, toVersion, '<=')) {
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
