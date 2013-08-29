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

    var err = Joi.validate(items, validations);
    if (err) {
      next(err);
    } else {
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
