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
    'QListHeader',
    'QItem',
    'QItemMain',
    'QItemSide',
    'QItemTile',
    'QItemSeparator',
    'QBtn',
    'QIcon',
    'QInput',
    'QCheckbox',
    'QToggle',
    'QSelect',
    'QCard',
    'QCardTitle',
    'QCardMain',
    'QCardSeparator',
    'QCardActions',
    'QCollapsible',
    'QTooltip',
    'QBtnToggle',
    'QPopover'
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
| secure | Need validate by security host | true |
| initEntities | Start-pack entities in new clients | [SUBSCRIBER, PUBLISHER]] |

settings structure:
```js
let settings = {
  clientId: `mqtt-board-${Math.random().toString(16).substr(2, 8)}`,
  host: 'wss://mqtt.flespi.io',
  keepalive: 60,
  protocolVersion: 5,
  clean: true,
  username: 'FlespiToken XXXXXXXXXXXXXXXXXXX',
  password: '',
  properties: {
    sessionExpiryInterval: undefined,
    receiveMaximum: undefined,
    maximumPacketSize: undefined,
    topicAliasMaximum: undefined,
    requestResponseInformation: false,
    requestProblemInformation: false,
    userProperties: undefined,
    authenticationMethod: undefined,
    authenticationData: undefined
  },
  will: {
    topic: undefined,
    payload: undefined,
    qos: 0,
    retain: false,
    properties: {
      willDelayInterval: undefined,
      payloadFormatIndicator: false,
      messageExpiryInterval: undefined,
      contentType: undefined,
      responseTopic: undefined,
      correlationData: undefined,
      userProperties: undefined
    }
  }
}
```
subscriber structure:
```js
let subscriber = {
  topic: '#',
  mode: 0,
  options: {
    qos: 0,
    nl: false,
    rap: false,
    rh: 0,
    properties: {
      subscriptionIdentifier: undefined,
      userProperties: undefined
    }
  }
}
```
publisher structure:
```js
let publisher = {
  topic: 'my/topic',
  payload: '{"hello": "world"}',
  options: {
    qos: 0,
    retain: false,
    dup: false,
    properties: {
      payloadFormatIndicator: undefined,
      messageExpiryInterval: undefined,
      topicAlias: undefined,
      responseTopic: undefined,
      correlationData: undefined,
      userProperties: undefined,
      contentType: undefined
    }
  }
}
```

## License
[MIT](https://github.com/flespi-software/mqtt-board/blob/master/LICENSE) license.
