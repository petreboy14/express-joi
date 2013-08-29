express-joi
===========

[![Build Status](https://travis-ci.org/petreboy14/express-joi.png)](https://travis-ci.org/petreboy14/express-joi)


A validation middleware for express using the [Joi validation](https://github.com/spumko/joi) suite from Eran Hammer/Walmart Labs.

## Installation
```
npm install express-joi
```    
## Usage
```javascript
var express = require('express');
var expressJoi = require('express-joi');

var Joi = expressJoi.Joi; // The exposed Joi object used to create schemas and custom types

var app = express();
app.use(express.methodOverride());
app.use(express.bodyParser());
app.use(app.router);
app.use(errorHandler);

// Use the Joi object to create a few schemas for your routes. 
var getUsersSchema = {
  limit: expressJoi.Joi.types.Number().integer().min(1).max(25),
  offset: expressJoi.Joi.types.Number().integer().min(0).max(25),
  name: expressJoi.Joi.types.String().alphanum().min(2).max(25)
};

var updateUserSchema = {
  userId: Joi.types.String().alphanum().min(10).max(20),
  name: Joi.types.String().min(3).max(50)
};

// Attach the validator to the route definitions
app.get('/users', expressJoi.joiValidate(getUsersSchema), handleUsers);
app.put('/users/:userId', expressJoi.joiValidate(updateUserSchema), handleUpdateUser);

app.listen(8080);
```
If a validation error occurs it will either be handled by your express error handling middleware or thrown.

## Strict mode

joiValidate takes a second optional object which will accept a strict key of true or false. When true, Joi will validate
every parameter in req.params, req.body, and req.query. If false, Joi will only validate parameters specified in the 
given validation object and pass any others directly through.

```
app.get('/users', expressJoi.joiValidate(schema, { strict: false }, ...);
```

## Consolidated Parameters

Upon successful validation express-joi will add an items object to req with all parameters from req.body, req.params, and req.query.

```
function handleUsers(req, res) {
    var limit = req.items.limit;
    var offset = req.items.offset;
    
    // Do stuff...
}
```

## Joi Information

All Joi built in types can be used with this middleware. Information on types and creating custom ones can be found at:

[https://github.com/spumko/joi](https://github.com/spumko/joi)

## Running Tests

To run the test suite first invoke the following command within the repo, installing the development dependencies:
```
npm install
```

then run the tests:
```
npm test
```
