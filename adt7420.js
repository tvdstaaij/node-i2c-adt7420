'use strict';

const i2c = require('i2c-bus');

const DEFAULT_I2C_BUS = 1;
const DEFAULT_I2C_ADDRESS = 0x48;
const REG_CONFIG = 0x03;

class ADT7420 {
  static get RESOLUTION_13_BIT() { return 0x00; }
  static get RESOLUTION_16_BIT() { return 0x80; }

  constructor(i2cBus, i2cAddress) {
    this._i2cBus = i2cBus;
    this._i2cAddress = i2cAddress;
    this._chipConfig = {
      resolution: ADT7420.RESOLUTION_13_BIT,
      lowPowerMode: false
    };
  }

  static open(options) {
    const i2cAddress = Number.isInteger(options.i2cAddress) ?
      options.i2cAddress : DEFAULT_I2C_ADDRESS;
    const i2cBusNumber = Number.isInteger(options.i2cBusNumber) ?
      options.i2cBusNumber : DEFAULT_I2C_BUS;
    return new Promise((resolve, reject) => {
      const i2cBus = i2c.open(i2cBusNumber, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve(i2cBus);
        }
      });

    })
      .then((i2cBus) => {
        return new ADT7420(i2cBus, i2cAddress);
      });
  }

  configure(options) {
    options = {...options};
    if (Number.isInteger(options.resolution)) {
      options.resolution = options.resolution & 0x80;
    } else {
      options.resolution = this._chipConfig.resolution;
    }
    if (options.lowPowerMode !== true && options.lowPowerMode !== false) {
      options.lowPowerMode = this._chipConfig.lowPowerMode;
    }

    let configRegValue = 0;
    configRegValue |= options.resolution;
    if (options.lowPowerMode) {
      configRegValue |= 0x40;
    }
    console.log(`Configuring <${configRegValue}>`);
    return new Promise((resolve, reject) => {
      this._i2cBus.writeByte(
        this._i2cAddress, REG_CONFIG, configRegValue, (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        }
      );
    })
      .then(() => {
        this._chipConfig = options;
      });
  }

  readTemperature() {
    const buf = Buffer.alloc(2);
    return new Promise((resolve, reject) => {
      this._i2cBus.i2cRead(this._i2cAddress, 2, buf, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      })
    })
      .then(() => {
        let rawTemperature = (buf[0] << 8) | buf[1];
        if (this._chipConfig.resolution === ADT7420.RESOLUTION_13_BIT) {
          rawTemperature &= (~0x07);
        }
        return new ADT7420Temperature(rawTemperature);
      });
  }
}

class ADT7420Temperature {
  constructor(raw) {
    this._raw = raw;
  }
  get raw() {
    return this._raw;
  }
  get celsius() {
    if (this._raw < 0x8000) {
      // Positive temperature
      return this._raw / 128;
    } else {
      // Negative temperature
      return (this._raw - 0x10000) / 128;
    }
  }
  get kelvin() {
    return this.celsius + 273.15;
  }
}

module.exports = {ADT7420, ADT7420Temperature};

