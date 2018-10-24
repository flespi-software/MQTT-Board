# MQTT Board
![Logo](/misc/logo.png?raw=true "MQTT Board logo")
> A simple application built with [Quasar](http://quasar-framework.org). Allows playing with your MQTT connections - subscribing to topics and publishing messages to a broker.

![Screenshot](/misc/screenshot.png?raw=true "MQTT Board")

## Features
* ES6 Javascript
* Vue.js
* Writing .vue files
* Vuex
* Webpack
* Responsive layout
* NPM ecosystems
* Material theme
* Dev Hot Reload
* and many more!

## Prerequisites:

- [Node.js](https://nodejs.org/en/) (>=6.x)
- [Quasar](http://quasar-framework.org)
- npm version 3+ and [Git](https://git-scm.com/).

## Build Setup

``` bash
# clone the repo
$ git clone https://github.com/flespi-software/mqtt-board.git mqttboard

# go into app's directory and install dependencies
$ cd mqttboard
$ npm install

# serve with hot reload at localhost:8080
$ quasar dev

# build for production with minification for flespi.io
$ quasar build
```

## Use like component
You must have a Quasar-based app.
```bash
# install like repo
$ npm install git+https://github.com/flespi-software/mqtt-board.git
```
in quasar.conf.js
```js
framework: {
  components: [
    'QToolbar',
    'QToolbarTitle',
    'QModal',
    'QModalLayout',
    'QList',
    'QItem',
    'QItemMain',
    'QItemSide',
    'QItemTile',
    'QBtn',
    'QIcon',
    'QInput',
    'QCheckbox',
    'QSelect',
    'QCard',
    'QCardTitle',
    'QCardMain',
    'QCardSeparator',
    'QCardActions',
    'QCollapsible',
    'QTooltip',
    'QBtnToggle'
  ],
  directives: [
    'CloseOverlay',
    'TouchSwipe'
  ],
  plugins: [
    'Notify',
    'Dialog',
    'LocalStorage'
  ]
},
```
```js
import MqttClient from 'mqtt-board'

export default {
  components: { MqttClient }
}
```
```html
<mqtt-client :initSettings="settings" whiteLabel="My MQTT"/>
```
| Name  | Description  | Default |
|---|---|---|
| initSettings | Init settings for clients | undefined |
| whiteLabel | Label in component | '' |
| useLocalStorage | local storage usage flag | true |
| needInitNewClient | Need create and init new client with default settings | false |

settings structure:
```js
let settings = {
  clientId: `mqtt-client-${Math.random().toString(16).substr(2, 8)}`,
  host: 'wss://mqtt.flespi.io',
  keepalive: 60,
  protocolVersion: 5,
  clean: true,
  username: 'FlespiToken XXXXXXXXXXXXXXXXXXX',
  password: '',
  properties: {
    sessionExpiryInterval: null,
    receiveMaximum: null,
    maximumPacketSize: null,
    topicAliasMaximum: null,
    requestResponseInformation: null,
    requestProblemInformation: null,
    userProperties: null,
    authenticationMethod: null,
    authenticationData: null
  },
  will: {
    topic: null,
    payload: null,
    qos: null,
    retain: null,
    properties: {
      willDelayInterval: null,
      payloadFormatIndicator: null,
      messageExpiryInterval: null,
      contentType: null,
      responseTopic: null,
      correlationData: null,
      userProperties: null
    }
  }
}
```

## License
[MIT](https://github.com/flespi-software/mqtt-board/blob/master/LICENSE) license.
