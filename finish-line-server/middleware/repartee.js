/***** Example code: ***********************************************
 *     const express = require("express");
 *     const app = express();
 *     
 *     const port = 3000;
 *     
 *     const repartee = require("./middleware/repartee");
 *     app.use(repartee.responses());
 *     
 *     app.get('*',  
 *       (req, res, next) => {
 *         // Echo back the query string
 *         res.ok({
 *           query: req.query
 *         });
 *       }
 *     );
 *     
 *     app.listen(port, () => { 
 *       console.log(`Server running on port ${port}`);
 *       console.log(`View at: http://localhost:${port}`);
 *     });
 */


function successPayload(data, message) {
  return {
    success: true,
    data,
    message: message || "OK"
  };
}

function errorPayload(message) {
  return {
    success: false,
    message
  };
}

// Make this a funciton that returns a middleware.  This allows you to 
// someday add config params
function responses() {
  return (req, res, next) => {
    // 200
    res.ok = function(data, message) {
      res
        .status(200)
        .json(successPayload(data, message || "OK"));
    };

    // 201
    res.created = function(data, message) {
      var uri = `http://${req.headers["host"]}${req.url}/${data._id}`;
      res
        .set("Location", uri)
        .status(201)
        .json(successPayload(data, message || "Created"));
    };

    // 204
    res.noContent = function() {
      return res 
        .sendStatus(204);
    };

    // 400
    res.badRequest = function(message) {
      return res
        .status(400)
        .json(errorPayload(message || "Bad request"));
    };
    
    // 404
    res.notFound = function(message) {
      return res
        .status(404)
        .json(errorPayload(message || "Not found"));
    };
    
    // 403
    res.unauthorized = function(message) {
      res.set("WWW-Authenticate", "Bearer realm=\"finish-line\"");
      return res
        .status(401)
        .json(errorPayload(message || "Unknown username or invalid password"));
    };

    // 500
    res.internalServerError = function(err, message) {
      console.log(err || "Unknown internal server error");
      return res
        .status(500)
        .json(errorPayload(message || "Internal server error"));
    };

    next();
  }
}

module.exports = {
  responses,
  payloads: {
    successPayload,
    errorPayload
  }
};
