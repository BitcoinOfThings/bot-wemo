// discover wemo devices on your network
// sometimes discover appears to hang, not sure why?
// notice how manually turing the switch on and off
// will trigger the state change

var Wemo = require('wemo-client');
var wemo = new Wemo();

wemo.discover(function(err, deviceInfo) {
  console.log(`Wemo Device Found: ${deviceInfo.friendlyName} is a ${deviceInfo.modelName} ${deviceInfo.modelNumber} at ${deviceInfo.host}:${deviceInfo.port}`)
  console.log(`callback ${deviceInfo.callbackURL}`)
  // initial state is 0 even for device that is on so it is useless
  deviceInfo.binaryState = null
  // Get the client for the found device
  var client = wemo.client(deviceInfo)
  console.log(deviceInfo)

  // You definitely want to listen to error events (e.g. device went offline),
  // Node will throw them as an exception if they are left unhandled  
  client.on('error', function(err) {
    console.log('Error: %s', err.code);
  });

  // Handle BinaryState events
  client.on('binaryState', function(value) {
    if (!client.device.binaryState) {
        console.log(`${client.device.friendlyName} is ${value}`)
    } else
    {
        console.log(`${client.device.friendlyName} status was ${client.device.binaryState} is now ${value}`)
    }
    // modifying client might not be the best idea
    // but cheap hacks are great for demos
    client.device.binaryState = value
  })

  // Turn the switch on
  //client.setBinaryState(1);
});
