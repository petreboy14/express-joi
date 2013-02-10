var express = require('express');
var Joi = require('joi');
var should = require('should');
var request = require('request');

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
    var app = null;

    before(function(done) {
      app = express();

      app.use(express.bodyParser());
      app.use(express.methodOverride());
      app.use(app.router);
      app.use(function(err, req, res, next) {
        res.send(500, {message: err.message});
      });

      app.listen(8181, function() {
        done();
      });
    });

    it('should be able to attach a validator to a specific route', function() {
      var error = null;

      try {
        var schema = {
          limit: expressJoi.Joi.types.Number().integer().min(1).max(25),
          offset: expressJoi.Joi.types.Number().integer().min(0).max(25),
          name: expressJoi.Joi.types.String().alphanum().min(2).max(25)
        };

        app.get('/users', expressJoi.joiValidate(schema), function returnFunc(req, res) {
          res.send(200, { hello: 'world' });
        });
      } catch(err) {
        error = err;
      }

      should.not.exist(error);
    });
    it('should pass successfully through route with correct validation', function(done) {
      request.get('http://localhost:8181/users?limit=5&offset=5&name=peter', function(err, res, body) {
        if (err) {
          done(err);
        }
        res.statusCode.should.equal(200);
        should.exist(body);

        try {
          body = JSON.parse(body);
        } catch(err) {
          done(err);
        }

        body.should.have.property('hello');
        body.hello.should.equal('world');
        done();
      });
    });
    it('should fail if an item does not have correct validation', function(done) {
      request.get('http://localhost:8181/users?limit=-1&offset=5&name=peter', function(err, res, body) {
        if (err) {
          done(err);
        }

        res.statusCode.should.equal(500);

        try {
          body = JSON.parse(body);
        } catch(err) {
          done(err);
        }

        body.should.have.property('message');
        body.message.should.equal('[ValidationError]: the value of `limit` must be larger than (or equal to) 1');
        done();
      });
    });
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