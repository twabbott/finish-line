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

const messages = {
  // 2xx
  ok: "OK",
  created: "Created",

  // 4xx
  badRequest: "Bad request", // 400
  forbidden: "Forbidden", // 401
  unauthorized: "Unauthorized", // 403
  notFound: "Not found", // 404
  methodNotAllowed: "Method not allowed", // 405
  conflict: "Conflict", // 409
  unprocessableentity: "Unprocessable entity", // 422

  // 5xx
  internalServerError: "Internal server error"
}

// Make this a funciton that returns a middleware.  This allows you to 
// someday add config params
function responses() {
  return (req, res, next) => {
    // 200
    res.ok = function(data, message) {
      res
        .status(200)
        .json(successPayload(data, message || messages.ok));
    };

    // 201
    res.created = function(data, id, message) {
      var uri = `http://${req.headers["host"]}${req.url}/${id}`;
      res
        .set("Location", uri)
        .status(201)
        .json(successPayload(data, message || messages.created));
    };

    // 204
    res.noContent = function() {
      return res 
        .sendStatus(204);
    };

    // 4xx
    res.errorResponse = function(status, message) {
      return res
        .status(status)
        .json(errorPayload(message));
    };

    // 400
    res.badRequest = function(message) {
      return res.errorResponse(400, message || messages.badRequest);
    };
    
    // 401
    res.unauthorized = function(message) {
      return res.errorResponse(401, message || messages.unauthorized);
    };
    
    // 403
    res.forbidden = function(message) {
      return res.errorResponse(403, message || messages.forbidden);
    };
    
    // 404
    res.notFound = function(message) {
      return res.errorResponse(404, message || messages.notFound);
    };
    
    // 405
    res.methodNotAllowed = function(message) {
      return res.errorResponse(405, message || messages.methodNotAllowed);
    };
    
    // 409
    res.conflict = function(message) {
      return res.errorResponse(409, message || messages.conflict);
    };

    // 500
    res.internalServerError = function(message) {
      return res.errorResponse(500, message || messages.internalServerError);
    };

    next();
  }
}

module.exports = {
  responses,
  payloads: {
    successPayload,
    errorPayload
  },
  defaultMessages: messages
};
