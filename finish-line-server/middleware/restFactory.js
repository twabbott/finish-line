

let logError = err => {};  // eslint-disable-line
let tracing = false;

/* Call this function to configure global options for restFactory.
 */
function init({ errorLogger = undefined, traceOn = false } = {}) {
  logError = errorLogger || logError;
  tracing = traceOn;
}

function trace(message) {
  if (tracing) {
    console.log("restFactory: " + message);
  }
}

/* serviceWrapper
 *     Use this function to wrap an async call to a service and generate a middleware.
 *       - If your service is successful, it shouild set result.data (and  
 *         optionally result.message or result.id).
 *       - If an item is not found, throw a NotFoundError
 *       - If there is an error in the data and the request cannot be processed, 
 *         throw an BadRequestError.
 *       - If there is a permissions problem, throw a ForbiddenError.
 *       - Do not catch any unexpected exceptions.  Let restFactory handle them.
 */
const serviceWrapper = {
  callAsync(service) {
    if (service.constructor.name !== "AsyncFunction") {
      throw new Error("serviceWrapper.callAsync() must take an async function");
    }

    return async function (req, res, next) {
      trace("serviceWrapper - begin");

      const controller = {
        setLocationId(id) {
          res.locals.locationId = id;
        },
        setLocation(url) {
          res.locals.url = url;
        },
        setMessage(Message) {
          res.locals.message
        }
      };

      try {
        const data = await service(req, controller);

        trace("serviceWrapper - service returned successfully");
        if (data !== undefined) {
          res.locals.data = data;
        }

        trace("serviceWrapper - end (calling next)");
        next();
      } catch (err) {
        trace("serviceWrapper - caught an exception");
        next(err);
      }
    };
  },

  call(service) {
    if (service.constructor.name === "AsyncFunction") {
      throw new Error("serviceWrapper.call() can not take an async function");
    }

    return function (req, res, next) {
      trace("serviceWrapper - begin");

      const controller = {
        setLocationId(id) {
          res.locals.locationId = id;
        },
        setLocation(url) {
          res.locals.url = url;
        },
        setMessage(Message) {
          res.locals.message
        }
      };

      try {
        const data = service(req, controller);

        trace("serviceWrapper - service returned successfully");
        if (data !== undefined) {
          res.locals.data = data;
        }

        trace("serviceWrapper - end (calling next)");
        next();
      } catch (err) {
        trace("serviceWrapper - caught an exception");
        next(err);
      }
    };
  }
}

/* handleOK()
 *     This middleware relies on the previous middleware in the chain performing the 
 *     following:
 *     - If the request yields results, it should set res.locals.data to 
 *       something besides null.
 *     - If the parameters for the request are invalid (400 bad request), set res.locals.errors
 *       to an array of one or more strings.
 *     - If the request is yields zero results (404 not found), set res.locals.
 *       result to null (or leave it unmodified, since its default value is null).
 *     - For any fatal errors, either throw an exception or call next(err), whichever you 
 *       like.
 * 
 *   This middleware relies on validation happening earlier in the pipeline.  The body
 *   and all params should be validated BEFORE this middleware is invoked. 
 */
function handleOK(req, res, next) { // eslint-disable-line
  trace("handleOK - 200");
  res
    .status(200)
    .json({
      success: true,
      message: res.locals.message || "OK",
      data: res.locals.data
    });
}

/* handleCreated()
 *   This middleware relies on the previous middleware in the chain performing the 
 *   following:
 *     - If the request yields results, it should set res.locals.data
 *     - If the parameters for the request are invalid (400 bad request), set res.locals.errors
 *       to an array of one or more strings.
 *     - To auto-set a Location header, set res.locals.id to any number or string.  If 
 *       you want to suppress generating the Location header, res.locals.id as undefined.
 *     - For any fatal errors, either throw an exception or call next(err), whichever you 
 *       like.
 * 
 *   This middleware relies on validation happening earlier in the pipeline.  The body
 *   and all params should be validated BEFORE this middleware is invoked. 
 */
function handleCreated(req, res, next) { // eslint-disable-line
  let url = undefined;
  if (typeof res.locals.locationId === "number" || typeof res.locals.locationId === "string") {
    url = `${req.protocol}://${req.headers["host"]}${req.url}/${res.locals.locationId}`;
  } else if (typeof res.locals.url === "string") {
    url = res.locals.url;
  }

  if (url) {
    trace("handleCreated - 201, Location=" + url);
    res.set("Location", url);
  } else {
    trace("handleCreated - 201");
  }

  res
    .status(201)
    .json({
      success: true,
      message: res.locals.message || "Created",
      data: res.locals.data
    });
}

/** Causes a 400 Bad Request to be sent to the client.  Use this error when validating 
 * request data before processing it.  This exception type allows you to include an array
 * containing error info (strings, or whatever format you like). 
 * @param {string} message - A title indicating the operation that the user was trying to perform.
 * @param {string} errors - An array of one or more errors describing validation errors for the user to fix.
 */
class ValidationError extends Error {
  constructor(message, errors, fileName, lineNumber) {
    super(message, fileName, lineNumber);    
    Error.captureStackTrace(this, ValidationError);

    this.errors = errors;
  }
}

/** Causes a 400 Bad Request to be sent to the client
 * @param {string} message - A title indicating the operation that the user was trying to perform.
 * @param {string} description - Specific details about what went wrong, so the user can fix the problem.
 */
class BadRequestError extends Error {
  constructor(message, description, fileName, lineNumber) {
    super(message, fileName, lineNumber);    
    Error.captureStackTrace(this, BadRequestError);

    this.description = description;
  }
}

/** Causes a 401 Not Authorized to be sent to the client
 * @param {string} message - Any details you want to provide (usually not needed).
 */
class UnauthorizedError extends Error {
  constructor(message, challenge, ...errorArgs) {
    super(message, ...errorArgs);
    Error.captureStackTrace(this, UnauthorizedError);

    this.challengeOptions = challenge;
  }
}

/** Causes a 403 Forbidden to be sent to the client
 * @param {string} message - Provide any explanation you think they ought to know
 */
class ForbiddenError extends Error {
  constructor(...errorArgs) {
    super(...errorArgs);
    Error.captureStackTrace(this, ForbiddenError);
  }
}


/** Causes a 403 Forbidden to be sent to the client
 * @param {string} message - Provide any explanation you think they ought to know
 */
class NotFoundError extends Error {
  constructor(...errorArgs) {
    super(...errorArgs);
    Error.captureStackTrace(this, NotFoundError);
  }
}

/** This middleware gets called at the end of your request pipeline.  Its purpose 
 * is to catch any errors that get thrown.  If it catches one of the response errors
 * (BadRequestError, NotFoundError, etc) it will respond with a 4xx.  Otherwise, it will
 * log an exception stack trace and return a 500.
 */
function handleErrors(err, req, res, next) { // eslint-disable-line
  if (err instanceof ValidationError) {
    trace("handleErrors - 400 (ValidationError)");
    return res
      .status(400)
      .json({
        success: false,
        message: err.message || "Bad request",
        errors: err.errors || undefined
      });
  }

  if (err instanceof BadRequestError) {
    trace("handleErrors - 400 (BadRequestError)");
    return res
      .status(400)
      .json({
        success: false,
        message: err.message || "Bad request"
      });
  }

  if (err instanceof UnauthorizedError) {
    trace("handleErrors - 401");
    if (err.challengeOptions) {
      res.set("WWW-Authenticate", wwwAuthenticateChallenge(challengeOptions));
    }
  
    return res
      .status(401)
      .json({
        success: false,
        message: err.message || "Unauthorized"
      });
  }

  if (err instanceof ForbiddenError) {
    trace("handleErrors - 403");
    return res
      .status(403)
      .json({
        success: false,
        message: err.message || "Forbidden"
      });
  }

  if (err instanceof NotFoundError) {
    trace("handleErrors - 404");
    return res
      .status(404)
      .json({
        success: false,
        message: err.message || "Not found"
      });
  }

  trace("handleErrors - 500");
  logError(err);
  return res
    .status(500)
    .json({
      success: false,
      message: err.message || "Internal server error"
    });
}

function wwwAuthenticateChallenge(challengeOptions) {
  if (typeof challengeOptions==="object") {
    if (!challengeOptions.hasOwnProperty("scheme")) {
      throw new Error("challengeOptions parameter missing \"scheme\" property.");
    }

    const scheme = challengeOptions.scheme.charAt(0).toUpperCase() + challengeOptions.scheme.slice(1);
    const params = [];
    for (let prop in challengeOptions) {
      if (prop==="scheme") {
        continue;
      }

      const value = challengeOptions[prop];
      switch (typeof value) {
        case "string":
          params.push(`${prop}="${value}"`);  
          break;

        case "number":
        case "boolean":
          params.push(`${prop}=${value}`);  
          break;

        default:
          throw new Error(`Error processing field "${prop}" in challengeOptions.  Value must be string, number, or boolean.`);
      }
    }

    if (!params.length) {
      return scheme;
    }

    return `${scheme} ${params.join(", ")}`;
  } 
  
  if (typeof challengeOptions === "string") {
    return challengeOptions;
  }
  
  throw new Error("Error processing challengeOptions.  Parameter must be an object or a string.");
}

module.exports = {
  init,
  serviceWrapper,
  ValidationError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  getResponse: [    
    handleOK,
    handleErrors
  ],
  postResponse: [
    handleCreated,
    handleErrors
  ],
  putResponse: [    
    handleOK,
    handleErrors
  ],
  deleteResponse: [    
    handleOK,
    handleErrors
  ],
  handleErrors
};
