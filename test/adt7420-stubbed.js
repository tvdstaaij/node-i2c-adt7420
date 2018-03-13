'use strict';

const should = require('chai').should();
const assert = require('chai').assert;
const ADT7420 = require('../lib/adt7420');
const ADT7420Stub = require('./lib/adt7420-stub');

describe('ADT7420 (stubbed)', function() {

  it('should read temperature with 13-bit resolution', function() {
    const adt7420Stub = new ADT7420Stub();
    const adt7420 = new ADT7420(adt7420Stub, ADT7420.I2C_ADDRESS_DEFAULT);
    const roomTemperature = 20;
    const fractionalTemperature = 20.4242424242;
    adt7420Stub.setTemperature(
      ADT7420.Temperature.fromCelsius(roomTemperature, 13));
    return adt7420.readTemperature()
      .then((temperatureReading) => {
        temperatureReading.celsius.should.equal(roomTemperature);
        adt7420Stub.setTemperature(
          ADT7420.Temperature.fromCelsius(fractionalTemperature, 13));
        return adt7420.readTemperature();
      })
      .then((temperatureReading) => {
        temperatureReading.celsius.should.equal(20.4375);
      });
  });

  it('should read temperature with 16-bit resolution', function() {
    const adt7420Stub = new ADT7420Stub();
    const adt7420 = new ADT7420(adt7420Stub, ADT7420.I2C_ADDRESS_DEFAULT);
    const roomTemperature = 20;
    const fractionalTemperature = 20.4242424242;
    adt7420Stub.setTemperature(
      ADT7420.Temperature.fromCelsius(roomTemperature, 16));
    return adt7420.configure({resolution: 16})
      .then(() => adt7420.readTemperature())
      .then((temperatureReading) => {
        temperatureReading.celsius.should.equal(roomTemperature);
        adt7420Stub.setTemperature(
          ADT7420.Temperature.fromCelsius(fractionalTemperature, 16));
        return adt7420.readTemperature();
      })
      .then((temperatureReading) => {
        temperatureReading.celsius.should.equal(20.421875);
      });
  });

  it('should read negative temperature', function() {
    const adt7420Stub = new ADT7420Stub();
    const adt7420 = new ADT7420(adt7420Stub, ADT7420.I2C_ADDRESS_DEFAULT);
    const siberianTemperature = -20;
    adt7420Stub.setTemperature(
      ADT7420.Temperature.fromCelsius(siberianTemperature, 16));
    return adt7420.configure({resolution: 16})
      .then(() => adt7420.readTemperature())
      .then((temperatureReading) => {
        temperatureReading.celsius.should.equal(siberianTemperature);
      });
  });

  it('should work with an alternate I2C address', function() {
    const adt7420Stub = new ADT7420Stub(0x4A);
    const adt7420 = new ADT7420(adt7420Stub, ADT7420.I2C_ADDRESS_0x4A);
    const roomTemperature = 20;
    adt7420Stub.setTemperature(
      ADT7420.Temperature.fromCelsius(roomTemperature, 13));
    return adt7420.readTemperature()
      .then((temperatureReading) => {
        temperatureReading.celsius.should.equal(roomTemperature);
      });
  });

  it('should configure continuous and low power mode', function() {
    const adt7420Stub = new ADT7420Stub();
    const adt7420 = new ADT7420(adt7420Stub, ADT7420.I2C_ADDRESS_DEFAULT);
    return adt7420.configure({lowPowerMode: false})
      .then(() => {
        adt7420Stub.getConfiguredMode()
          .should.equal(ADT7420Stub.MODE_CONTINUOUS);
        return adt7420.configure({lowPowerMode: true});
      })
      .then(() => {
        adt7420Stub.getConfiguredMode().should.equal(ADT7420Stub.MODE_1SPS);
      });
  });

  it('should propagate errors through the promise chain', function() {
    const adt7420Stub = new ADT7420Stub(0x4A); // Mismatched address
    const adt7420 = new ADT7420(adt7420Stub, ADT7420.I2C_ADDRESS_DEFAULT);
    return adt7420.readTemperature()
      .then(assert.fail)
      .catch((err) => err.should.be.an('error'));
  });

});

