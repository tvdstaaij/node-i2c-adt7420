'use strict';

const should = require('chai').should();
const ADT7420Temperature = require('../lib/adt7420-temperature');

const ONE_LSB = 1/128;

describe('ADT7420Temperature', function() {

  it('should convert a positive 16-bit raw value', function() {
    const temperature = 100;
    ADT7420Temperature.fromTemperatureRegister(temperature / ONE_LSB, 16)
      .celsius.should.equal(temperature);
  });

  it('should convert a positive 13-bit raw value', function() {
    const temperature = 100;
    ADT7420Temperature.fromTemperatureRegister(temperature / ONE_LSB, 13)
      .celsius.should.equal(temperature);
  });

  it('should convert a negative raw value', function() {
    // 16 bit two's complement for -1.5 / ONE_LSB = -192
    const raw = parseInt('1111111101000000', 2);

    ADT7420Temperature.fromTemperatureRegister(raw, 16).celsius
      .should.equal(-1.5);
  });

  it('should truncate the lower three bits of a 13-bit raw value', function() {
    const temperatureWithoutLowerBits = 10 + (8 * ONE_LSB);
    const temperatureWithLowerBits =
      temperatureWithoutLowerBits + (7 * ONE_LSB);
    ADT7420Temperature
      .fromTemperatureRegister(temperatureWithLowerBits / ONE_LSB, 16)
      .celsius.should.equal(temperatureWithLowerBits);
    ADT7420Temperature
      .fromTemperatureRegister(temperatureWithLowerBits / ONE_LSB, 13)
      .celsius.should.equal(temperatureWithoutLowerBits);
  });

  it('should accept degrees celsius and give back the same value', function() {
    for (let t = -10; t <= 10; t += ONE_LSB) {
      ADT7420Temperature.fromCelsius(t, 16).celsius.should.equal(t);
    }
    for (let t = -10; t <= 10; t += 8 * ONE_LSB) {
      ADT7420Temperature.fromCelsius(t, 13).celsius.should.equal(t);
    }
  });

});
