/*global after,before,describe,it*/
var express = require('express');
var Joi = require('joi');
var should = require('should');
var request = require('request');

var expressJoi = require('../index');

describe('express-joi tests', function () {
  describe('expressJoi object', function () {
    it('should not be null', function () {
      should.exist(expressJoi);
    });
    it('should contain a joiValidate function', function () {
      should.exist(expressJoi.joiValidate);
      expressJoi.joiValidate.should.be.an.instanceof(Function);
    });
    it('should have a Joi object', function () {
      should.exist(expressJoi.Joi);
      expressJoi.Joi.should.equal(Joi);
    });
  });

  describe('expressJoi.Joi', function () {
    it('should be able to create a schema object with Joi', function () {
      var schemaError = null;
      var schema = null;
      try {
        schema = {
          username: expressJoi.Joi.string().alphanum().min(3).max(30).with('birthyear').required(),
          password: expressJoi.Joi.string().regex(/[a-zA-Z0-9]{3,30}/).without('access_token'),
          access_token: expressJoi.Joi.string(),
          birthyear: expressJoi.Joi.number().min(1850).max(2012),
          email: expressJoi.Joi.string().email()
        };
      } catch (err) {
        schemaError = err;
      }
      should.exist(schema);
      should.not.exist(schemaError);
    });
  });

  describe('expressJoi.joiValidate', function () {
    var app = null;
    var server = null;

    before(function (done) {
      app = express();
      app.use(express.methodOverride());
      app.use(express.bodyParser());
      app.use(app.router);
      app.use(function (err, req, res, next) {
        res.send(500, {message: err.message});
      });

      server = app.listen(8181, function () {
        done();
      });
    });

    it('should be able to attach a validator to a specific route', function () {
      var error = null;

      try {
        var schema = {
          limit: expressJoi.Joi.number().integer().min(1).max(25),
          offset: expressJoi.Joi.number().integer().min(0).max(25),
          name: expressJoi.Joi.string().alphanum().min(2).max(25)
        };

        app.get('/users', expressJoi.joiValidate(schema), function returnFunc(req, res) {
          res.send(200, { hello: 'world' });
        });
      } catch (err) {
        error = err;
      }

      should.not.exist(error);
    });
    it('should pass successfully through route with correct validation', function (done) {
      request.get('http://localhost:8181/users?limit=5&offset=5&name=tom', function (err, res, body) {
        if (err) {
          done(err);
        }
        res.statusCode.should.equal(200);
        should.exist(body);

        try {
          body = JSON.parse(body);
        } catch (err) {
          done(err);
        }

        body.should.have.property('hello');
        body.hello.should.equal('world');
        done();
      });
    });
    it('should fail if an item does not have correct validation', function (done) {
      request.get('http://localhost:8181/users?limit=-1&offset=5&name=tom', function (err, res, body) {
        if (err) {
          done(err);
        }

        res.statusCode.should.equal(400);

        try {
          body = JSON.parse(body);
        } catch (err) {
          done(err);
        }

        body.should.have.property('message');
        body.message.should.equal('the value of limit must be larger than or equal to 1');
        done();
      });
    });

    it('should be able to pass strict: false option and still pass validation with unspecified parameter', function (done) {
      var schema = {
        limit: expressJoi.Joi.number().integer().min(1).max(25),
        offset: expressJoi.Joi.number().integer().min(0).max(25),
        name: expressJoi.Joi.string().alphanum().min(2).max(25)
      };

      app.get('/foos', expressJoi.joiValidate(schema, { strict: false }), function returnFunc(req, res) {
        var items = req.items;
        items.should.have.keys('foo', 'offset', 'name');
        items.foo.should.equal('bar');
        res.send(200, { hello: 'world' });
      });
      request.get('http://localhost:8181/foos?foo=bar&offset=5&name=tom', function (err, res, body) {
        if (err) {
          done(err);
        }
        res.statusCode.should.equal(200);
        done();
      });
    });

    after(function () {
      server.close();
    });
  });
});
