/**
 * @name expressJoi.js
 * @author Peter Henning <petreboy14@gmail.com>
 *
 * @version 0.0.1
 */

// External module dependencies
var Joi = require('joi');
var util = require('util');

/**
 * A per route validation option
 *
 * @param {Object|Array} validations The validations to perform on the specified route
 * @param {Object} options A list of options for validations.
 * @return {Function}
 *
 * @public
 */
exports.joiValidate = function joiValidate(validations, options) {
  options = options || { strict: true };

  /**
  * The middleware that handles the route validation
  *
  * @param {Object} req The express request object
  * @param {Object} res The express result object
  * @param {Function} next The function to call upon validation completion
  *
  * @private
  */
  function validate(req, res, next) {
    // Get method from req
    var method = req.method;

    // Get all of our req data items
    var body = req.body;
    var params = req.params;
    var query = req.query;
    var items = {};

    // Copy all of the items from the express data into our single items object
    var paramExtras = copyObject(params, items, validations, options.strict, true);
    var queryExtras = copyObject(query, items, validations, options.strict, true);
    var bodyExtras = {};

    // Only store body methods on calls that may have a body
    if (method !== "GET" && method !== "DELETE") {
      bodyExtras = copyObject(body, items, validations, options.strict, true);
    }

    var err = Joi.validate(items, validations, options);
    if (err) {
      res.status(400);
      res.end(JSON.stringify({ message: err.message }));
    } else {
      copyObject(paramExtras, items, null, null);
      copyObject(queryExtras, items, null, null);
      copyObject(bodyExtras, items, null, null);
      req.items = items;
      next();
    }
  }

  return validate;
};

// Expose the Joi object so users can create validation schemas.
exports.Joi = Joi;

/**
 * Copies one object's first level parameters to a second ones
 *
 * @param {Object} from An object to copy from.
 * @param {Object} to An object to copy to.
 * @param {Object} validations list of validation keys.
 * @param {Boolean} strict whether to reject keys that aren't in validations list
 * @param {Boolean} decode whether to use decodeURIComponent or not
 *
 * @private
 */
function copyObject(from, to, validations, strict, decode) {
  var extras = {};
  if (from) {
    for (var key in from) {
      if (from.hasOwnProperty(key) && (!validations || strict || validations.hasOwnProperty(key))) {
        try {
          to[key] = (decode && typeof(from[key]) === 'string') ? decodeURIComponent(from[key]) : from[key];
        } catch (err) {
          to[key] = from[key];
        }
      } else {
        try {
          extras[key] = (decode && typeof(from[key]) === 'string') ? decodeURIComponent(from[key]) : from[key];
        } catch (err) {
          extras[key] = from[key];
        }
      }
    }
  }

  return extras;
}
