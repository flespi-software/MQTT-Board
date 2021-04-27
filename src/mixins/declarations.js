const settings = {
    clientName: {
      desc: 'Human readable client name',
      type: 'String'
    },
    clientId: {
      desc: 'The Client Identifier (ClientID) identifies the Client on the Server',
      type: 'String',
      required: true
    },
    host: {
      desc: 'It`s a web app so you can use wss protocol only',
      type: 'String',
      required: true
    },
    keepalive: {
      desc: 'Maximum time interval that is permitted to elapse between the point at which the Client finishes transmitting one MQTT Control Packet and the point it starts sending the next',
      type: 'Number',
      min: 0,
      max: 65535,
      required: true
    },
    protocolVersion: {
      desc: 'Revision level of the protocol used by the Client',
      type: 'Number',
      options: [3, 4, 5]
    },
    clean: {
      desc: 'If true, instructs the connection to start a new session; if false, instructs to continue an existing session',
      type: 'Boolean'
    },
    username: {
      desc: 'Client username (valid flespi token)',
      type: 'String'
    },
    password: {
      desc: 'Client password (should be left blank for flespi)',
      type: 'String'
    },
    properties: {
      sessionExpiryInterval: {
        desc: 'Session Expiry Interval in seconds',
        type: 'Number',
        min: 0,
        max: 4294967295
      },
      receiveMaximum: {
        desc: 'Receive Maximum value in bytes',
        type: 'Number',
        min: 1,
        max: 65535
      },
      maximumPacketSize: {
        desc: 'Maximum Packet Size in bytes the Client is willing to accept',
        type: 'Number',
        min: 1,
        max: 4294967295
      },
      topicAliasMaximum: {
        desc: 'The highest value that the Client will accept as a Topic Alias sent by the Server',
        type: 'Number',
        min: 0,
        max: 65535
      },
      requestResponseInformation: {
        desc: 'Run a Request/Response interaction over MQTT',
        type: 'Boolean'
      },
      requestProblemInformation: {
        desc: 'The Client uses this value to indicate whether the Reason String or User Properties are sent in the case of failures',
        type: 'Boolean'
      },
      userProperties: {
        desc: 'Used to send connection-related properties from the Client to the Server',
        type: 'Object'
      },
      authenticationMethod: {
        desc: 'Name of the authentication method used for extended authentication',
        type: 'String'
      },
      authenticationData: {
        desc: 'Identifier of the authentication data',
        type: 'String'
      }
    },
    will: { // The Will Message MUST be published after the Network Connection is subsequently closed and either the Will Delay Interval has elapsed or the Session ends
      topic: {
        desc: 'Topic for will message',
        type: 'String'
      },
      payload: {
        desc: 'Will message payload',
        type: 'String'
      },
      qos: {
        desc: 'Specify the QoS level to be used when publishing the Will Message',
        type: 'Number',
        options: [0, 1, 2]
      },
      retain: {
        desc: 'If the Will Message is to be retained when it is published',
        type: 'Boolean'
      },
      properties: {
        willDelayInterval: {
          desc: 'Will Delay Interval in seconds',
          type: 'Number',
          max: 4294967295,
          min: 0
        },
        payloadFormatIndicator: {
          desc: 'Identifier of the Payload Format Indicator where false - unspecified, true - String',
          type: 'Boolean'
        },
        messageExpiryInterval: {
          desc: 'Message Expiry Interval',
          type: 'Number',
          max: 4294967295,
          min: 1
        },
        contentType: {
          desc: 'Content of the Will Message',
          type: 'String'
        },
        responseTopic: {
          desc: 'String which is used as the Topic Name for a response message',
          type: 'String'
        },
        correlationData: {
          desc: 'Used by the sender of the Request Message to identify which request the Response Message is for when it is received',
          type: 'String'
        },
        userProperties: {
          desc: 'Used to send will-related properties',
          type: 'Object'
        }
      }
    }
  },
  subscriber = {
    topic: {
      desc: 'String topic to subscribe to',
      type: 'String',
      required: true
    },
    options: {
      qos: {
        desc: 'Maximum QoS field. This gives the maximum QoS level at which the Server can send Application Messages to the Client',
        type: 'Number',
        options: [0, 1, 2]
      },
      nl: {
        desc: 'No Local option. If the value is true, Application Messages MUST NOT be forwarded to a connection with a ClientID equal to the ClientID of the publishing connection',
        type: 'Boolean'
      },
      rap: {
        desc: 'Retain As Published option. If true, Application Messages forwarded using this subscription keep the RETAIN flag they were published with. If false, Application Messages forwarded using this subscription have the RETAIN flag set to false',
        type: 'Boolean'
      },
      rh: {
        desc: 'Retain Handling option. This option specifies whether retained messages are sent when the subscription is established. \n\r0 = Send retained messages at the time of the subscribe, \n\r1 = Send retained messages at subscribe only if the subscription does not currently exist, \n\r2 = Do not send retained messages at the time of the subscribe',
        type: 'Number',
        options: [0, 1, 2]
      },
      properties: {
        subscriptionIdentifier: {
          desc: 'Identifier of the subscription',
          type: 'Number',
          min: 1,
          max: 268435455
        },
        userProperties: {
          desc: 'Used to send related properties',
          type: 'Object'
        }
      }
    },
    unsubscribeProperties: {
      userProperties: {
        desc: 'Used to send related properties on unsubscribe operation',
        type: 'Object'
      }
    }
  },
  publisher = {
    topic: {
      desc: 'The Topic Name identifies the information channel to which Payload data is published',
      type: 'String',
      required: true
    },
    payload: {
      desc: 'Payload contains the Application Message that is being published',
      type: 'String'
    },
    options: {
      qos: {
        desc: 'Level of assurance for delivery of an Application Message',
        type: 'Number',
        options: [0, 1, 2]
      },
      retain: {
        desc: 'If the RETAIN flag is set to 1 in a PUBLISH packet sent by a Client to a Server, the Server MUST replace any existing retained message for this topic and store the Application Message',
        type: 'Boolean'
      },
      dup: {
        desc: 'If the DUP flag is set to false, it indicates that this is the first occasion that the Client or Server has attempted to send this PUBLISH packet. If the DUP flag is set to true, it indicates that this might be re-delivery of an earlier attempt to send the packet',
        type: 'Boolean'
      },
      properties: {
        payloadFormatIndicator: {
          type: 'Boolean',
          desc: 'Identifier of the Payload Format Indicator where false - unspecified, true - String'
        },
        messageExpiryInterval: {
          desc: 'Lifetime of the Application Message in seconds',
          type: 'Number',
          min: 1,
          max: 4294967295
        },
        topicAlias: {
          desc: 'Integer value that is used to identify the Topic instead of using the Topic Name',
          type: 'Number',
          min: 0,
          max: 65535
        },
        responseTopic: {
          type: 'String',
          desc: 'String used as the Topic Name for a response message'
        },
        correlationData: {
          type: 'String',
          desc: 'The Correlation Data is used by the sender of the Request Message to identify which request the Response Message is for when it is received'
        },
        userProperties: {
          type: 'Object',
          desc: 'Used to send related properties'
        },
        contentType: {
          type: 'String',
          desc: 'String describing the MIME content type of the Application Message'
        }
      }
    }
  },
  entity = {
    type: { type: 'String' },
    index: { type: 'Number' },
    id: { type: 'String' }
  }
export {
  settings,
  subscriber,
  publisher,
  entity
}
export default {
  settings,
  subscriber,
  publisher,
  entity
}
