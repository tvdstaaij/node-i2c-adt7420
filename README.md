# i2c-adt7420

[![npm version](https://img.shields.io/npm/v/i2c-adt7420.svg)](https://www.npmjs.com/package/i2c-adt7420)
[![npm license](https://img.shields.io/npm/l/i2c-adt7420.svg)](https://www.npmjs.com/package/i2c-adt7420)
[![tests](https://github.com/tvdstaaij/node-i2c-adt7420/actions/workflows/test.yml/badge.svg)](https://github.com/tvdstaaij/node-i2c-adt7420/actions/workflows/test.yml)

Node.js driver for the acurate (±0.25°C) yet affordable [ADT7420][adt7420-prod] digital temperature sensor.
Should also work with the less accurate [ADT7410][adt7410-prod].

This module was tested with Raspberry Pi 3B and 4B, wired to an [EVAL-ADT7420-PMDZ][adt7420-eval] breakout board.
Please do note that the power LED on the EVAL-ADT7420-PMDZ board significantly influences the temperature reading!
The LED or its series resistor should be desoldered if you need accurate temperature.

Supported features:

* 13 and 16 bit resolution
* Continuous and one sample per second modes
* Alternate I2C addresses

## Installation

Available from npm: `npm install i2c-adt7420`

Requires Node.js 14 or higher.

## Example: ADT7420 temperature server

```javascript
const express = require('express');
const {ADT7420} = require('i2c-adt7420');

const config = {
  pollingInterval: 1000,
  httpPort: 7420,
  i2cBusNumber: 1
};

const app = express();
let adt7420 = null;
let lastUpdateTime = null;
let temperature = null;

app.get('/', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify({
    temperature: {
      raw: temperature.raw,
      celsius: temperature.celsius,
      kelvin: temperature.kelvin
    },
    time_updated: lastUpdateTime
  }, null, 2));
})

ADT7420.open({
  i2cBusNumber: config.i2cBusNumber
})
  .then((instance) => {
    adt7420 = instance;
    return adt7420.configure({
      resolution: 16,
      lowPowerMode: (config.pollingInterval >= 1000)
    });
  })
  .then(() => {
    console.log('Configured ADT7420');
    return updateTemperature();
  })
  .then(() => {
    console.log(`Read temperature of ${temperature.celsius}C`);
    setInterval(updateTemperature, config.pollingInterval);
    app.listen(config.httpPort, () => {
      console.log(`Serving temperature data on port ${config.httpPort}`);
    });
  })
  .catch((err) => {
    console.error(err);
    process.exit(3);
  });

function updateTemperature() {
  return adt7420.readTemperature()
    .then((result) => {
      lastUpdateTime = new Date();
      temperature = result;
    })
    .catch((err) => {
      console.error(err);
      process.exit(3);
    });
}
```

## API

### Class `ADT7420`

`ADT7420.open([options]) -> Promise`

Factory method to asynchronously create an instance of the class.

Arguments:

* `options` object of options:
    * `i2cBusNumber` Optional integer specifying the system's I2C device number of the bus the chip is attached to.
      If you use a Raspberry Pi, this should typically be `1` for a Raspberry Pi 2+ and `0` for the original model.
      Make sure the operating system supports I2C and that it is enabled. Default: 0.
    * `i2cAddress` Optional, one of `ADT7420.I2C_ADDRESS_0x48` (default), `ADT7420.I2C_ADDRESS_0x49`, `ADT7420.I2C_ADDRESS_0x4A`, `ADT7420.I2C_ADDRESS_0x4B`.
      This only needs to be specified if you have changed the default address of the chip by physically connecting its address configuration pins.

Returns: promise resolving to an ADT7420 class instance when succesful.

`ADT7420#configure([options]) -> Promise`

Changes the chip's configuration register. Configuring is recommended but not mandatory.

Arguments:

* `options` object of options:
    * `resolution` Optional integer specifying the sample resolution in bits (either 13 or 16).
      The chip's reset value is 13 bits.
    * `lowPowerMode` Optional boolean, false for continuous sample mode, true for one sample per second mode. 
      The chip's reset value is false (continuous mode). See datasheet for details.

Returns: promise resolving to undefined when succesful.

`ADT7420#readTemperature() -> Promise`

Reads the chip's temperature register.

Returns: promise resolving to an `ADT7420Temperature` instance when succesful.

### Class `ADT7420Temperature`

`ADT7420Temperature#raw : Number`

Raw temperature reading as a 16-bit two's complement integer.

`ADT7420Temperature#celsius : Number`

Temperature reading converted to degrees Celsius.

`ADT7420Temperature#kelvin : Number`

Temperature reading converted to Kelvin.

[adt7420-prod]: http://www.analog.com/en/products/analog-to-digital-converters/integrated-special-purpose-converters/digital-temperature-sensors/adt7420.html
[adt7410-prod]: http://www.analog.com/en/products/analog-to-digital-converters/integrated-special-purpose-converters/digital-temperature-sensors/adt7410.html
[adt7420-eval]: http://www.analog.com/en/design-center/evaluation-hardware-and-software/evaluation-boards-kits/eval-adt7420-pmdz.html
