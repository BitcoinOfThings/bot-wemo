// demo of Bitcoin Of Things and a wemo switch
// notice how manually turing the switch on and off
// will trigger the state change

// You can find ip address and port of your wemo
// devices using discover.js

var Wemo = require('wemo-client')
var mqtt = require('mqtt')
var wemo = new Wemo()

const topic_sub = 'demo'
const topic_pub = 'bot_demo'
var deviceIp = process.argv[2] || "192.168.1.55"
var devicePort = process.argv[3] || "49153"
var wemo_device

// connec to bot
const bot = mqtt.connect('mqtt://mqtt.bitcoinofthings.com',
    {
        clientId: "demo",
        username: "demo",
        password: "demo"
    })
bot.on('connect', () => {
    console.log(`subscribing to ${topic_sub}`)
    bot.subscribe(topic_sub)
})

wemo.load(`http://${deviceIp}:${devicePort}/setup.xml`, function(err, deviceInfo) {
    if (err) {
        console.log(err)
    } else
    {
        // initial state is 0 even for device that is on so it is useless
        deviceInfo.binaryState = null
        // Get the client for the found device
        wemo_device = wemo.client(deviceInfo)

        // You definitely want to listen to error events (e.g. device went offline),
        // Node will throw them as an exception if they are left unhandled  
        wemo_device.on('error', function(err) {
            console.log('Error: %s', err.code)
        })

        // Handle BinaryState events
        wemo_device.on('binaryState', function(value) {
            if (!wemo_device.device.binaryState) {
                console.log(`${wemo_device.device.friendlyName} is ${value}`)
            } else
            {
                console.log(`${wemo_device.device.friendlyName} status was ${wemo_device.device.binaryState} is now ${value}`)
                // if device was manually turned on then 
                // tell bitcoin of the change
                bot.publish(topic_pub,
                    JSON.stringify({clientId:"demo", message: value.toString()}))
                console.log(`sent ${value} on ${topic_pub}`)
            }
            // modifying client might not be the best idea
            // but cheap hacks are great for demos
            wemo_device.device.binaryState = value
        })

    }
})

bot.on('message', async (topic, message) => {
    console.log(`Arrived on ${topic}:${message}`)
    const msg = JSON.parse(message)
    if (!msg.txid) {
        console.log(message.toString())
        console.log(`aborting because no txid`)
    } else {
        if (msg.message)
        {
            //todo: query state to see if already on
            const newState = 
                msg.message.toUpperCase() === "ON" 
                || msg.message === "1"
            ? 1 : 0
            console.log(`setting device to ${newState}`)
            wemo_device.setBinaryState(newState)
        }
    }
})
