import mitt from 'mitt'

/*
  Message format: `MQTTBoard|${postkey}|${commandName}=>${payload}`
  => SetSettings({settings, entities, whiteLabel, useLS, needInitNewClient, secure, color, accentColor, configuredClients})
  <= @ready() - mounted on Board
  <= @updateSettings({settings, entities, whiteLabel, useLS, needInitNewClient, secure, color, accentColor, configuredClients}) - update model
*/
class IntegrationBus {
  constructor () {
    this.emitter = mitt()
    this.postkey = window.name
    window.addEventListener('message', (event) => {
      let cmd = ''
      let payload = null
      if (typeof event.data === 'string' && event.data.indexOf('MQTTBoard|') === 0) {
        let data = event.data.split('|')
        data = data[this.postkey ? 2 : 1].split('=>')
        cmd = data[0]
        try {
          payload = JSON.parse(data[1])
        } catch (e) {
          payload = data[1]
        }
      }
      if (cmd) {
        this.emitter.emit(cmd, payload)
      }
    })
  }

  on (event, handler) {
    this.emitter.on(event, handler)
  }

  off (event, handler) {
    this.emitter.off(event, handler)
  }

  send (cmd, payload) {
    cmd = `MQTTBoard${this.postkey ? `|${this.postkey}` : ''}|${cmd}${payload ? `=>${JSON.stringify(payload)}` : ''}`
    if (window.parent && window.parent !== window) {
      window.parent.postMessage(cmd, '*')
    }
    if (window.opener) {
      window.opener.postMessage(cmd, '*')
    }
  }
}

export default ({ app }) => {
  const bus = new IntegrationBus()
  app.config.globalProperties.$integrationBus = bus
}
