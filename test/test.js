var express = require('express');
var should = require('should');
var Joi = require('joi');
var expressJoi = require('../index');

describe('express-joi tests', function() {
  describe('expressJoi object', function() {
    it('should not be null', function() {
      should.exist(expressJoi);
    });
    it('should contain a joiValidator function', function() {
      should.exist(expressJoi.joiValidator);
      expressJoi.joiValidator.should.be.an.instanceof(Function);
    });
    it('should contain a joiValidate function', function() {
      should.exist(expressJoi.joiValidate);
      expressJoi.joiValidate.should.be.an.instanceof(Function);
    });
    it('should have a Joi object', function() {
      should.exist(expressJoi.Joi);
      expressJoi.Joi.should.equal(Joi);
    });
  });

  describe('expressJoi.Joi', function() {
    it('should be able to create a schema object with Joi', function() {
      var schemaError = null;
      try {
        var schema = {
          username: expressJoi.Joi.types.String().alphanum().min(3).max(30).with('birthyear').required(),
          password: expressJoi.Joi.types.String().regex(/[a-zA-Z0-9]{3,30}/).without('access_token'),
          access_token: expressJoi.Joi.types.String(),
          birthyear: expressJoi.Joi.types.Number().min(1850).max(2012),
          email: expressJoi.Joi.types.String().email()
        };
      } catch(err) {
        schemaError = err;
      }
      should.exist(schema);
      should.not.exist(schemaError);
    });
  });
  
  describe('expressJoi.joiValidate', function() {
    it('should be able to attach a validator to a specific route');
    it('should pass successfully through route with correct validation');
    it('should fail if an item does not have correct validation');
  });
  
  describe('expressJoi.joiValidation', function() {
    it('should be able to create am object of validations for the middleware function');
    it('should be able to attach joiValidation as a middleware for express');
    it('should be able to validate a correct GET request');
    it('should be able to validate a correct PUT request');
    it('should be able to validate a correct POST request');
    it('should be able to validate a correct DELETE request');
  });
});