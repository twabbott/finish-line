

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

/* asyncServiceWrapper()
 *     Use this function to wrap an async call to a service and generate a middleware.
 *       - If your service is successful, it shouild set result.data (and  
 *         optionally result.message or result.id).
 *       - If an item is not found, throw a NotFoundError
 *       - If there is an error in the data and the request cannot be processed, 
 *         throw an AppError.
 *       - If there is a permissions problem, throw a ForbiddenError.
 *       - Do not catch any unexpected exceptions.  Let restFactory handle them.
 */
function asyncServiceWrapper(service) {
  return function (req, res, next) {
    const state = {};

    service(req, state)
      .then(data => {
        Object.assign(res.locals, state);

        if (data !== null && data !== undefined) {
          res.locals.data = data;
          next();
        } else {
          next(new NotFoundError());
        }
      })
      .catch(err => next(err));
  };
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
  return res.ok(res.locals.data, res.locals.message);
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
  if (typeof res.locals.id !== "number" && typeof res.locals.id !== "string") {
    delete res.locals.id;
  }

  if (res.locals.id) {
    trace("handleCreated - 201, with locationId");
  } else {
    trace("handleCreated - 201");
  }

  return res.created(res.locals.data, res.locals.id, res.locals.message);
}

/* handleNoContent()
 *   This middleware relies on the previous middleware in the chain performing the 
 *   following:
 *     - If the operation was successful, set res.locals.data to the number of 
 *       items deleted.  This number must be greater than zero.
 *     - If no such item was found, you can
 *         - set res.locals.data to zero
 *         - Leave res.locals.data to its default value of undefined.
 *         - Throw a NotFoundError
 *     - If the parameters for the request are invalid (400 bad request), throw a
 *       NotFoundError
 *     - For any fatal errors, either throw an exception or call next(err), whichever you 
 *       like.
 * 
 *   This middleware relies on validation happening earlier in the pipeline.  The body
 *   and all params should be validated BEFORE this middleware is invoked. 
 */
function handleNoContent(req, res, next) { // eslint-disable-line
  if (typeof res.locals.data === "number" && res.locals.data > 0) {
    trace("handleNoContent = 200");
    return res.ok(undefined, `Deleted ${res.locals.data} item${res.locals.data !== 1? "s": ""}.`);
  } else {
    trace("handleNoContent = 404");
    return res.notFound();
  }
}

class AppError extends Error {
  constructor(message, description, fileName, lineNumber) {
    super(message, fileName, lineNumber);    
    Error.captureStackTrace(this, AppError);

    this.description = description;
  }
}

class ForbiddenError extends Error {
  constructor(...errorArgs) {
    super(...errorArgs);
    Error.captureStackTrace(this, ForbiddenError);
  }
}

class NotFoundError extends Error {
  constructor(...errorArgs) {
    super(...errorArgs);
    Error.captureStackTrace(this, NotFoundError);
  }
}

class UnauthorizedError extends Error {
  constructor(message, challenge, ...errorArgs) {
    super(message, ...errorArgs);
    Error.captureStackTrace(this, UnauthorizedError);

    this.challengeOptions = challenge;
  }
}

/* This middleware gets called first.  Its purpose is to look for errors.  If there are
 * no errors, it will call next().
 */
function handleErrors(err, req, res, next) { // eslint-disable-line
  if (err instanceof AppError) {
    trace("handleErrors - 400");
    return res.badRequest(err.message, err.description);
  }

  if (err instanceof UnauthorizedError) {
    trace("handleErrors - 401");
    return res.unauthorized(err.challengeOptions, err.message);
  }

  if (err instanceof ForbiddenError) {
    trace("handleErrors - 403");
    return res.forbidden(err.message);
  }

  if (err instanceof NotFoundError) {
    trace("handleErrors - 404");
    return res.notFound(undefined, err.message);
  }

  trace("handleErrors - 500");
  logError(err);
  return res.internalServerError();
}

module.exports = {
  init,
  asyncServiceWrapper,
  AppError,
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
    handleNoContent,
    handleErrors
  ],
  handleErrors
};
