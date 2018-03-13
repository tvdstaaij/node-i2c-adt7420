'use strict';

class ADT7420Temperature {
  constructor(raw) {
    this._raw = raw;
  }
  static fromTemperatureRegister(registerValue, resolution) {
    switch (resolution) {
      case 13:
        return new ADT7420Temperature(registerValue & (~0x07));
      case 16:
        return new ADT7420Temperature(registerValue);
      default:
        throw new Error('Invalid resolution');
    }
  }
  static fromCelsius(degrees, resolution) {
    let raw;
    switch (resolution) {
      case 13:
        raw = Math.round(degrees * 16) * 8;
        break;
      case 16:
        raw = Math.round(degrees * 128);
        break;
      default:
        throw new Error('Invalid resolution');
    }
    if (raw >= 0) {
      // Positive temperature
      return new ADT7420Temperature(raw);
    } else {
      // Negative temperature; convert to 16-bit two's complement
      return new ADT7420Temperature(raw + 0x10000);
    }
  }
  get raw() {
    return this._raw;
  }
  get celsius() {
    if (this._raw < 0x8000) {
      // Positive temperature
      return this._raw / 128;
    } else {
      // Negative temperature; convert from 16-bit two's complement
      return (this._raw - 0x10000) / 128;
    }
  }
  get kelvin() {
    return this.celsius + 273.15;
  }
}

module.exports = ADT7420Temperature;
