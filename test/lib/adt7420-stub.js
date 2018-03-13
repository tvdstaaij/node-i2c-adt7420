'use strict';

const assert = require('assert');

/* Simulated ADT7420 temperature sensor.
 * Implements part of the i2c-bus interface.
 */
class ADT7420Stub {
  static get MODE_CONTINUOUS() { return 0x00; }
  static get MODE_1SPS() { return 0x40; }

  constructor(i2cAddress) {
    this._i2cAddress = 0x48;
    if (Number.isInteger(i2cAddress)) {
      this._i2cAddress |= (i2cAddress & 0x03);
    }
    this._temperatureRegister = 0x0000;
    this._configRegister = 0x00;
  }

  /* Test functions */

  setTemperature(adt7420Temperature) {
    this._temperatureRegister = adt7420Temperature.raw;
    if ((this._configRegister & 0x80) === 0) {
      this._temperatureRegister &= (~0x07);
    }
  }
  getConfiguredMode() {
    return (this._configRegister & 0x60);
  }

  /* i2c-bus stubs */

  i2cRead(addr, length, buffer, cb) {
    assert.equal(addr, this._i2cAddress, 'NAK');
    assert.ok(length <= 2, 'Reading more than 2 bytes is undefined');
    setImmediate(() => {
      assert.ok(buffer.length >= length, 'Buffer has insufficient capacity');
      let bytesRead = 0;
      if (length > 0) {
        buffer[0] = (this._temperatureRegister >> 8) & 0xFF;
        bytesRead++;
      }
      if (length > 1) {
        buffer[1] = this._temperatureRegister & 0xFF;
        bytesRead++;
      }
      cb(null, bytesRead, buffer);
    });
  }
  writeByte(addr, cmd, byte, cb) {
    assert.equal(addr, this._i2cAddress, 'NAK');
    assert.equal(cmd, 0x03, 'Only config register is supported');
    assert.ok(byte >= 0 && (byte & 0xFF) === byte, 'Must be single byte');
    setImmediate(() => {
      this._configRegister = byte;
      cb(null);
    });
  }
}

module.exports = ADT7420Stub;
