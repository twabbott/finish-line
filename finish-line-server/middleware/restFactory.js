/* generalResponse()
 *   This middleware relies on the previous middleware in the chain performing the 
 *   following:
 *     - If the request yields results, it should set res.result
 *     - If the parameters for the request are invalid (400 bad request), set res.errors
 *       to an array of one or more strings.
 *     - If the request is yields zero results (404 not found), set res.result to null
 *     - For any fatal errors, either throw an exception or call next(err), whichever you 
 *       like.
 * 
 *   This middleware relies on validation happening earlier in the pipeline.  The body
 *   and all params should be validated BEFORE this middleware is invoked. 
 */
function generalResponse(req, res, next) {
  if (res.result === null) {
    res.notFound();
    return;
  }

  if (res.result !== undefined) {
    res.ok(res.result);
    return;
  } 

  next();
}

/* postResponse()
 *   This middleware relies on the previous middleware in the chain performing the 
 *   following:
 *     - If the request yields results, it should set res.result
 *     - If the parameters for the request are invalid (400 bad request), set res.errors
 *       to an array of one or more strings.
 *     - To auto-set a Location header, set res.locationId to any number or string.  If 
 *       you want to suppress generating the Location header, res.locationId as undefined.
 *     - For any fatal errors, either throw an exception or call next(err), whichever you 
 *       like.
 * 
 *   This middleware relies on validation happening earlier in the pipeline.  The body
 *   and all params should be validated BEFORE this middleware is invoked. 
 */
function postResponse(req, res, next) {
  if (res.result !== undefined && res.result !== null) {
    if (typeof res.locationId !== "number" && typeof res.locationId !== "string") {
      delete res.locationId;
    }
    res.created(res.result, res.locationId);
    return;
  }

  next();
}

/* deleteResponse()
 *   This middleware relies on the previous middleware in the chain performing the 
 *   following:
 *     - If the operation was successful, set res.result to the number of items deleted.
 *     - If no such item was found, set res.result to zero (404 not found).
 *     - If the parameters for the request are invalid (400 bad request), set res.errors
 *       to an array of one or more strings.
 *     - For any fatal errors, either throw an exception or call next(err), whichever you 
 *       like.
 * 
 *   This middleware relies on validation happening earlier in the pipeline.  The body
 *   and all params should be validated BEFORE this middleware is invoked. 
 */
function deleteResponse(req, res, next) {
  if (typeof res.result === "number") {
    if (res.result === 0) {
      res.notFound("Item not found.");
      return;
    } 
    
    if (res.result > 0)  {
      res.ok(undefined, `Deleted ${res.result} item${res.result !== 1? "s": ""}.`);
      return;
    }
  }

  next();
}

function handleClientErrors(req, res, next) {
  if (res.errors) {
    if (!Array.isArray(res.errors)) {
      res.errors = [ res.errors ];
    }
  } else {
    res.errors = ["Unable to process request from parameters provided."];
  }

  res.badRequest("Error in request", errors);
}

function handleFatalError(err, req, res, next) {
  console.trace(err);
  res.internalServerError();
}

module.exports = {
  get: [
    generalResponse,
    handleClientErrors,
    handleFatalError
  ],
  post: [
    postResponse,
    handleClientErrors,
    handleFatalError
  ],
  put: [
    generalResponse,
    handleClientErrors,
    handleFatalError
  ],
  delete: [
    deleteResponse,
    handleClientErrors,
    handleFatalError
  ]
};
