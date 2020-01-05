

/* Insert this middleware at the top of the pipeline, before you handle any of your API 
 * requests.  This middle initializes the res.locals property by setting result to null
 * and errors to an empty array.
 */
function init(req, res, next) {
  res.locals.result = null;
  res.locals.errors = [];
}

let handleError = (err) => {};

function onError(err) {
  handleError(err);
}

/* generalResponse()
 *   This middleware relies on the previous middleware in the chain performing the 
 *   following:
 *     - If the request yields results, it should set res.locals.result to 
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
function generalResponse(req, res, next) {
  if (res.locals.result === null) {
    res.notFound();
  } else {
    res.ok(res.locals.result);
  }
}

/* postResponse()
 *   This middleware relies on the previous middleware in the chain performing the 
 *   following:
 *     - If the request yields results, it should set res.locals.result
 *     - If the parameters for the request are invalid (400 bad request), set res.locals.errors
 *       to an array of one or more strings.
 *     - To auto-set a Location header, set res.locals.locationId to any number or string.  If 
 *       you want to suppress generating the Location header, res.locals.locationId as undefined.
 *     - For any fatal errors, either throw an exception or call next(err), whichever you 
 *       like.
 * 
 *   This middleware relies on validation happening earlier in the pipeline.  The body
 *   and all params should be validated BEFORE this middleware is invoked. 
 */
function postResponse(req, res, next) {
  if (typeof res.locals.locationId !== "number" && typeof res.locals.locationId !== "string") {
    delete res.locals.locationId;
  }

  res.created(res.locals.result, res.locals.locationId);
}

/* deleteResponse()
 *   This middleware relies on the previous middleware in the chain performing the 
 *   following:
 *     - If the operation was successful, set res.locals.result to the number of items deleted.
 *     - If no such item was found, set res.locals.result to zero (404 not found), or leave it 
 *       set to null (its default value).
 *     - If the parameters for the request are invalid (400 bad request), set res.locals.errors
 *       to an array of one or more strings.
 *     - For any fatal errors, either throw an exception or call next(err), whichever you 
 *       like.
 * 
 *   This middleware relies on validation happening earlier in the pipeline.  The body
 *   and all params should be validated BEFORE this middleware is invoked. 
 */
function deleteResponse(req, res, next) {
  if (typeof res.locals.result === "number" && res.locals.result > 0) {
    res.ok(undefined, `Deleted ${res.locals.result} item${res.locals.result !== 1? "s": ""}.`);
  } else {
    res.notFound();
  }
}

/* This middleware gets called first.  Its purpose is to look for errors.  If there are
 * no errors, it will call next().
 */
function handleClientErrors(req, res, next) {
  if (res.locals.errors && Array.isArray(res.locals.errors) && res.locals.errors.length > 0) {
    res.badRequest(undefined, res.locals.errors);
  }
}

/* This middleware gets called last.  Its purpose is to catch exceptions, and to return a 500.
 */
function handleFatalError(err, req, res, next) {
  if (onError) {
    onError(err);
  }
  
  res.internalServerError();
}



module.exports = {
  init,
  get: [
    handleClientErrors,
    generalResponse,
    handleFatalError
  ],
  post: [
    handleClientErrors,
    postResponse,
    handleFatalError
  ],
  put: [
    handleClientErrors,
    generalResponse,
    handleFatalError
  ],
  delete: [
    handleClientErrors,
    deleteResponse,
    handleFatalError
  ],
  onError,
  middleware: {
    generalResponse,
    postResponse,
    deleteResponse,
    handleClientErrors,
    handleFatalError
  }
};
