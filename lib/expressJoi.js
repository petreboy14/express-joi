"use strict";

var async = require('async');
var Joi = require('joi');
var util = require('util');

/**
* Returns the Joi validator express middleware after setting up and checking the routes map.
*
* @param routes {Object} A mapping of method/routes to their validation schemas.
* @param strict {Boolean} Determines whether strict checking should take place. 
*
* @api public 
*/
exports.joiValidator = function joiValidator(routes, strict) {
  var validations = {};

  /**
  * Loads one route into the validations object to be used in the validator middleware
  *
  * @param path {String} An exposed route for validation such as /users, /companies
  * @param method {String} The HTTP method for that route (GET, PUT, POST, DELETE)
  * @param useValidation {Boolean} Indicates whether validation should exist on the route
  * @param validations {Object|null} The actual validation object or null
  *
  * @api private 
  */
  function addRoute(path, method, useValidation, validations) {

    // Check if there is already a duplicate route and/or route + method in validations object
    if (validations.hasOwnProperty(path) && validation[path].hasOwnProperty(method)) {
      var msg = 'Replacing validation for ' + method + ': ' + path;
      if (strict) {
        throw new Error(msg);
      } else {
        console.warn(msg);
        return false;
      }
    }

    // Add validation info for route/method
    validations[path] = {};

    validations[path][method] = {
      useValidation: useValidation,
      validations: useValidation ? validations : null 
    };

    return true;
  }

  /**
  * A shortcut method for adding all routes to the validation object in one shot
  *
  * @param routes {Object} A set of key/values that define all the valiations per route
  * 
  * @api private
  */
  function loadRoutes(routes) {
    var err = false;
    if (typeof(routes) !== 'undefined') {
      for (var route in routes) {
        if (routes.hasOwnProperty(route)) {
          var routeDef = routes[route];
          var routeAdded = addRoute(routeDef.path, routeDef.method, routeDef.useValidation, routeDef.validations);
          if (strict && !routeAdded) {
            throw new Error('Path could not be added to validation map: ' + util.inspect(routeDef));
          } else if (!routeAdded) {
            console.warn('Path could not be added to validation map: ' + util.inspect(routeDef));
            err = true;
          }
        }
      }
    } else if (strict) {
      throw new Error("Route map given to loadRoutes undefined");
    } else {
      console.warn('Route map given to loadRoutes undefined');
      err = true;
    }

    return !err;
  }

  /**
  * The middleware that handles the per route validation
  *
  * @param req {Object} The express request object
  * @param res {Object} The express result object
  * @param next {Function} The function to call upon validation completion
  *
  * @api private
  */
  function validate(req, res, next) {
    var route = req.route;
    var method = route.method;
    var path = route.path;

    var errMsg = null;

    // Ensure that the route has a cooresponding path/method in the validations object
    if (!validations.hasOwnProperty(path)) {
      errMsg = 'Validation not given for this path: ' + method + ': ' + path;
      if (strict) {
        next(new Error(errMsg));
      } else {
        console.warn(errMsg);
      }
    } else if (!validations[path].hasOwnProperty(method)) {
      errMsg = 'Validation not given for this path method: ' + method + ': ' + path;
      if (strict) {
        next(new Error(errMsg));
      } else {
        console.warn(errMsg);
      }
    } else {

      var routeValidationObj = validations[path][method];

      // Get all of our req data items
      var body = req.body;
      var params = req.params;
      var query = req.query;
      var items = {};

      // Copy all of the items from the express data into our single items object
      copyObject(params, items);
      copyObject(query, items);

      // Only store body methods on calls that may have a body
      if (method !== "GET" && method !== "DELETE") {
        copyObject(body, items);
      }

      // Check all the validations. If valid, add items property to req and continue.
      checkValidations(items, routeValidationObj.validations, function afterValiation(err) {
        if (err) {
          next(err);
        } else {
          req.items = items;
          next();
        }
      });
    }
  }

  // Load up our route validations
  loadRoutes(routes);

  return validate;

};

exports.joiValidate = function joiValidate(validations) {

  /**
  * The middleware that handles the route validation
  *
  * @param req {Object} The express request object
  * @param res {Object} The express result object
  * @param next {Function} The function to call upon validation completion
  *
  * @api private
  */
  function validate(req, res, next) {
    // Get method from req
    var method = req.path.method;

    // Get all of our req data items
    var body = req.body;
    var params = req.params;
    var query = req.query;
    var items = {};

    // Copy all of the items from the express data into our single items object
    copyObject(params, items);
    copyObject(query, items);

    // Only store body methods on calls that may have a body
    if (method !== "GET" && method !== "DELETE") {
      copyObject(body, items);
    }

    checkValidations(items, validations, function afterValidation(err) {
      if (err) {
        next(err);
      } else {
        req.items = items;
        next();
      }
    });
  }

  return validate;
};

// Expose the Joi object so users can create validation schemas.
exports.Joi = Joi;

/**
* Validates all the items against the given validation map
*
* @param items {Object} All the data items pulled from the request object
* @param validatiosn {Object} An abject containing expected parameters and their validation schemas
* @param cb {Function} Called after completion of valiations
*
* @api private
*/
function checkValidations(items, validations, cb) {
  // Do actual validation - Note that validation is asynchronous
  async.detect(validations, function(validation, cb) {
    // Still need to implement this section
    cb(false);
  }, function(err) {
    if (err) {
      cb(new Error("Validation failed"))
    } else {
      cb();
    }
  });
}

/**
* Copys one object's first level parameters to a second ones
*
* @param from  {Object}  An object to copy from
* @param to    {Object}  An object to copy to.
*
* @api private
*/
function copyObject(from, to) {
  if (from) {
    for (var key in from) {
      if (from.hasOwnProperty(key)) {
        to[key] = from[key];
      }
    }
  }
}
