# MQTT Board
![Logo](/misc/logo.png?raw=true "MQTT Board logo")
> Diagnostic-oriented MQTT client tool. Supports MQTT 5.0 and 3.1.X protocols, connections to multiple brokers, MQTT operations logs and multiple subscribe widgets with unique/history topic filtering mode. Saves configuration in browser's local cache.

> Live version available here: [MQTT-Board](https://mqttboard.flespi.io).

![Screenshot](/misc/screenshot.png?raw=true "MQTT Board")

## Features
* ES6 Javascript
* Vue.js ([Quasar](http://quasar-framework.org))
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
    'QPopover',
    'QChip',
    'QField',
    'QInnerLoading',
    'QSpinnerGears'
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
Props:

| Name  | Description  | Default |
|---|---|---|
| initSettings | Init settings for clients | undefined |
| configuredClients | Full configured clients | [] |
| whiteLabel | Label in component | '' |
| useLocalStorage | local storage usage flag | true |
| needInitNewClient | Need create and init new client with default settings | false |
| secure | Need validate by security host | true |
| initEntities | Start-pack entities in new clients | [SUBSCRIBER, PUBLISHER] |
| color | Color of bars by quasar color palette | 'dark' |
| accentColor | Secondary color by quasar color palette | 'light-blue-7' |

Events:

| Name  | Description  | Payload |
|---|---|---|
| change | Any change in clients | [<client>] |

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
entities structure:
```js
/* linked entity for sorting all entities */
let entity = {
  type: '', // publisher || subscriber required,
  index: 1, // array index of current entity (subscriber, publisher) in array of full configured client
  id: 's3rdsf' // unique generated id of entity
}
```
client structure:
```js
let client = {
  config: <settings>, // settings like structure
  publishers: [<publisher>], // array of publisher like structures
  subscribers: [<subscriber>], // array of subscriber like structures
  entities: [<entity>] // array of entity like structure
}
```

## License
[MIT](https://github.com/flespi-software/mqtt-board/blob/master/LICENSE) license.
