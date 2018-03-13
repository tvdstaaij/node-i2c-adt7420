'use strict';

const i2c = require('i2c-bus');
const ADT7420Temperature = require('./adt7420-temperature');

const DEFAULT_I2C_BUS = 1;

const REG_CONFIG_ADDRESS = 0x03;
const REG_CONFIG_RESOLUTION_13 = 0x00;
const REG_CONFIG_RESOLUTION_16 = 0x80;
const REG_CONFIG_1SPS = 0x40;

class ADT7420 {
  static get I2C_ADDRESS_DEFAULT() { return 0x48; }
  static get I2C_ADDRESS_0x48() { return 0x48; }
  static get I2C_ADDRESS_0x49() { return 0x49; }
  static get I2C_ADDRESS_0x4A() { return 0x4A; }
  static get I2C_ADDRESS_0x4B() { return 0x4B; }

  constructor(i2cBus, i2cAddress) {
    this._i2cBus = i2cBus;
    this._i2cAddress = i2cAddress;
    this._chipConfig = {
      // Defaults after sensor reset
      resolution: 13,
      lowPowerMode: false
    };
  }

  static open(options) {
    const i2cAddress = Number.isInteger(options.i2cAddress) ?
      options.i2cAddress : I2C_ADDRESS_DEFAULT;
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
    if (options.resolution === 13) {
      options.resolution = REG_CONFIG_RESOLUTION_13;
    } else if (options.resolution === 16) {
      options.resolution = REG_CONFIG_RESOLUTION_16;
    } else if (options.resolution !== undefined) {
      throw new Error('resolution must be 13 or 16');
    } else {
      options.resolution = this._chipConfig.resolution;
    }
    if (options.lowPowerMode === undefined) {
      options.lowPowerMode = this._chipConfig.lowPowerMode;
    } else if (options.lowPowerMode !== true &&
               options.lowPowerMode !== false) {
      throw new Error('lowPowerMode must be a boolean');
    }

    let configRegValue = options.resolution;
    if (options.lowPowerMode) {
      configRegValue |= REG_CONFIG_1SPS;
    }
    return new Promise((resolve, reject) => {
      this._i2cBus.writeByte(
        this._i2cAddress, REG_CONFIG_ADDRESS, configRegValue, (err) => {
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
        return new ADT7420Temperature(rawTemperature,
                                      this._chipConfig.resolution);
      });
  }
}

ADT7420.Temperature = ADT7420Temperature;

module.exports = ADT7420;
