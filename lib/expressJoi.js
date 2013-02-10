/**
 * @name expressJoi.js
 * @author Peter Henning <petreboy14@gmail.com>
 *
 * @version 0.0.1
 */

// External module dependencies
var async = require('async');
var Joi = require('joi');
var util = require('util');

/**
* Returns the Joi validator express middleware after setting up and checking the routes map.
*
* @param {Object} routes A mapping of method/routes to their validation schemas.
* @param {Boolean} strict Determines whether strict checking should take place.
*
* @public
*/
exports.joiValidator = function joiValidator(routes, strict) {
  var validations = {};

  /**
  * Loads one route into the validations object to be used in the validator middleware
  *
  * @param {String} path An exposed route for validation such as /users, /companies
  * @param {String} method The HTTP method for that route (GET, PUT, POST, DELETE)
  * @param {Boolean} useValidation Indicates whether validation should exist on the route
  * @param {Object|null} validations The actual validation object or null
  *
  * @private
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
  * @param {Object} routes A set of key/values that define all the valiations per route
  * 
  * @private
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
  * @param {Object} req The express request object
  * @param {Object} res The express result object
  * @param {Function} next The function to call upon validation completion
  *
  * @private
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

/**
 * A per route validation option
 *
 * @param {Object|Array} validations The validations to perform on the specified route
 * @return {Function}
 *
 * @public
 */
exports.joiValidate = function joiValidate(validations) {

  /**
  * The middleware that handles the route validation
  *
  * @param {Object} req The express request object
  * @param {Object} res  The express result object
  * @param {Function} next The function to call upon validation completion
  *
  * @private
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
 * @param {Object} items The items to be validated
 * @param {Array} validations A list of validations for the given items
 * @param {Function} cb A function to call upon completion
 *
 * @private
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
 * Does a basic flattening of an object to an array
 *
 * @param {Object} object The object to be converted to an array
 * @return {Array}
 *
 * @private
 *
 */
function objectToArray(object) {
  if (object instanceof Array) {
    return object;
  } else if (typeof(object) === 'object') {
    var arr = [];

    for (var item in object) {
      if (object.hasOwnProperty(item)) {
        var objToPush = {};
        objToPush[item] = object[item];
        arr.push(objToPush);
      }
    }

    return arr;
  } else {
    throw new Error("Non-object sent for object-to-array conversion.");
  }
}

/**
 * Copies one object's first level parameters to a second ones
 *
 * @param {Object} from An object to copy from.
 * @param {Object} to An object to copy to.
 *
 * @private
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
