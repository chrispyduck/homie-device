Homie Device
============

[![Build Status](https://travis-ci.org/chrispyduck/homie-device.svg?branch=master)](https://travis-ci.org/chrispyduck/homie-device)&nbsp;&nbsp;
[![Coverage Status](https://coveralls.io/repos/github/chrispyduck/homie-device/badge.svg?branch=master)](https://coveralls.io/github/chrispyduck/homie-device?branch=master)&nbsp;&nbsp;

This is a TypeScript port [NodeJS port](https://github.com/microclimates/homie-device) of the [Homie convention](https://github.com/marvinroger/homie) for lightweight IoT device interaction on an [MQTT](https://en.wikipedia.org/wiki/MQTT) message bus. It includes several modifications to make the API a bit easier to use.

Features
--------

* Device, Node, and Property
* Auto MQTT connect with optional username/password
* Auto MQTT re-connect
* Periodic $stats/uptime publishing
* $online will
* Device topic events
* Broadcast message events
* Periodic stats interval events
* Device/node/property announcement on connect
* Property send with retained value
* Settable properties
* Property ranges
* Lightweight

Quick Start
-----------

First, get a local [MQTT broker](https://mosquitto.org/download/) running and a window opened subscribing to the 'devices/#' topic.

Next, add these lines to an index.js file and run it:

```javascript
var HomieDevice = require('homie-device');
var myDevice = new HomieDevice('bare-minimum');
myDevice.setup();
```

Congratulations, you've got a running Homie device! 

Take a look at the messages on your MQTT bus under devices/bare-minimum. Then ctrl-c the program and watch the broker administer the will.

Setting Firmware
----------------

To publish the firmware name & version, call `myDevice.setFirmware()`:

```javascript
var HomieDevice = require('homie-device');
var myDevice = new HomieDevice('bare-minimum');
myDevice.setFirmware('nodejs-test', '0.0.1');
myDevice.setup();
```

Adding a Node
-------------

Devices aren't much use until they have some nodes and properties. Place the following into the index.js file and run it again:

```javascript
var HomieDevice = require('homie-device');
var myDevice = new HomieDevice('my-device');
var myNode = myDevice.node('my-node', 'test node friendly name', 'test-node');
myNode.advertise('my-property-1').setName('Friendly Prop Name').setUnit('W').setDatatype('integer');
myDevice.setup();
```

Publishing a Property
---------------------

Publishing properties has the same interface as the Homie ESP8266 implementation:

```javascript
var HomieDevice = require('homie-device');
var myDevice = new HomieDevice('my-device');
var myNode = myDevice.node('my-node', 'test node friendly name', 'test-node');
myNode.advertise('my-property-1').setName('Friendly Prop Name').setUnit('W').setDatatype('integer');
myDevice.setup();

myNode.setProperty('my-property-1').send('property-value');
```

Settable Properties
-------------------

To set properties from MQTT messages, add a setter function when advertising the property:

```javascript
var HomieDevice = require('homie-device');
var myDevice = new HomieDevice('my-device');
var myNode = myDevice.node('my-node', 'test node friendly name', 'test-node');
myNode.advertise('my-property-1').setName('Friendly Prop Name').setUnit('W').setDatatype('string').settable(function(range, value) {
  myNode.setProperty('my-property-1').setRetained().send(value);
});
myDevice.setup();
```

Once running, publish a message to the `devices/my-device/my-node/my-property-1/set` topic.

Array Nodes
----------------

Array nodes are also supported by passing lower and upper bounds on the range when creating the node.

```
var HomieDevice = require('homie-device');
var myDevice = new HomieDevice('my-device');

var lowerBound = 0;
var upperBound = 10;
var myNode = myDevice.node('my-node', 'test node friendly name', 'test-node', lowerBound, upperBound);
```

Publishing a property to a specific node index can be done like this:

```javascript
var HomieDevice = require('homie-device');
var myDevice = new HomieDevice('my-device');
var myNode = myDevice.node('my-node', 'test node friendly name', 'test-node', 0, 10);
myNode.advertise('my-property-1');
myDevice.setup();

// Publishes 'property-value' to the 'devices/my-device/my-node_2/my-property-1' topic.
myNode.setProperty('my-property-1').setRange(2).send('property-value');
```

Setting a property on a specific node index can be done like this:

```
var HomieDevice = require('homie-device');
var myDevice = new HomieDevice('my-device');
var myNode = myDevice.node('my-node', 'test node friendly name', 'test-node', 0, 10);
myNode.advertise('my-property-2').settable(function(range, value) {
  var index = range.index;
  myNode.setProperty('my-property-2').setRange(index).send(value);
});
myDevice.setup();
```

Now publish a message to the `devices/my-device/my-node_8/my-property-2/set` topic.

Device Messages
---------------

Incoming messages to the device emit `message` events. You can listen for all messages to the `devices/my-device/#` topic like this:

```javascript
var HomieDevice = require('homie-device');
var myDevice = new HomieDevice('my-device');

myDevice.on('message', function(topic, value) {
  console.log('A message arrived on topic: ' + topic + ' with value: ' + value);
});

myDevice.setup();
```

Now publish a message to the `devices/my-device/my-node/my-property-2_8/set` topic.

Topic Messages
--------------

You can listen for specific incoming topics by adding a listener to the `message:{topic}` event for the device:

```javascript
var HomieDevice = require('homie-device');
var myDevice = new HomieDevice('my-device');

myDevice.on('message:my/topic', function(value) {
  console.log('A message arrived on the my/topic topic with value: ' + value);
});

myDevice.setup();
```

Now publish a message to the `devices/my-device/my/topic` topic.

Broadcast Messages
------------------

You can listen to all `devices/$broadcast/#` messages by adding a listener to the `broadcast` event:

```javascript
var HomieDevice = require('homie-device');
var myDevice = new HomieDevice('my-device');

myDevice.on('broadcast', function(topic, value) {
  console.log('A broadcast message arrived on topic: ' + topic + ' with value: ' + value);
});

myDevice.setup();
```

Now publish a broadcast message to the `devices/$broadcast/some-topic` topic. All homie devices are exposed to broadcast messages.

Device Settings
---------------

To configure your device with external settings, pass a full or partial config object to the HomieDevice constructor. If you've worked with the Homie ESP8266 implementation, this will be familiar:

```javascript
var HomieDevice = require('homie-device');
var config = {
  "name": "Bare Minimum",
  "device_id": "bare-minimum",
  "mqtt": {
    "host": "localhost",
    "port": 1883,
    "base_topic": "devices/",
    "auth": false,
    "username": "user",
    "password": "pass"
  },
  "settings": {
    "percentage": 55
  }
}
var myDevice = new HomieDevice(config);
myDevice.setup();
```

Connection
----------

The Homie device maintains an `isConnected` (true/false) state, and emits 
a `connect` and `disconnect` event as the device becomes connected with MQTT.

Quiet Setup
-----------

If you don't want the startup message, pass the quiet flag of `true` to setup `myDevice.setup(true)`.

```javascript
var HomieDevice = require('homie-device');
var myDevice = new HomieDevice('bare-minimum');
myDevice.setup(true);
```

Contributors
------------
<table id="contributors"><tr>
<td><img width="124" src="https://avatars2.githubusercontent.com/u/373538?v=4"><br/><a href="https://github.com/lorenwest">lorenwest</a></td><td><img width="124" src="https://avatars0.githubusercontent.com/u/7427179?v=4"><br/><a href="https://github.com/marcus-garvey">marcus-garvey</a></td><td><img width="124" src="https://avatars0.githubusercontent.com/u/7627635?v=4"><br/><a href="https://github.com/rozpuszczalny">rozpuszczalny</a></td><td><img width="124" src="https://avatars1.githubusercontent.com/u/5964259?s=460&v=4"><br/><a href="https://github.com/carterzenk">carterzenk</a></td></tr></table>

License
-------

May be freely distributed under the [MIT license](https://raw.githubusercontent.com/microclimates/homie-device/master/LICENSE).

Copyright (c) 2017-2018 Loren West 
[and other contributors](https://github.com/microclimates/homie-device/graphs/contributors)

